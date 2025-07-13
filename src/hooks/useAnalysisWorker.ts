import { useRef, useCallback, useEffect, useState } from 'react';

// 🚀 성능 최적화: WebWorker 관리 커스텀 훅

export interface AnalysisWorkerMessage {
  type: 'ANALYZE_DEPENDENCIES' | 'CALCULATE_METRICS' | 'ANALYZE_FILE';
  data: any;
  id: string;
}

export interface AnalysisWorkerResponse {
  type: 'SUCCESS' | 'ERROR' | 'READY';
  id?: string;
  data?: any;
  error?: {
    message: string;
    stack?: string;
  };
  message?: string;
}

export interface AnalysisProgress {
  id: string;
  type: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
}

export interface UseAnalysisWorkerOptions {
  maxConcurrentTasks?: number;
  timeoutMs?: number;
  enableProgress?: boolean;
  onProgress?: (progress: AnalysisProgress) => void;
  onComplete?: (result: any, taskId: string) => void;
  onError?: (error: Error, taskId: string) => void;
}

export function useAnalysisWorker(options: UseAnalysisWorkerOptions = {}) {
  const {
    maxConcurrentTasks = 1,
    timeoutMs = 30000,
    enableProgress = true,
    onProgress,
    onComplete,
    onError
  } = options;

  const workerRef = useRef<Worker | null>(null);
  const pendingTasks = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    progress: AnalysisProgress;
  }>>(new Map());
  
  const [isReady, setIsReady] = useState(false);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [taskQueue, setTaskQueue] = useState<AnalysisWorkerMessage[]>([]);
  const [taskProgress, setTaskProgress] = useState<Map<string, AnalysisProgress>>(new Map());

  // Worker 초기화
  useEffect(() => {
    try {
      const worker = new Worker('/workers/analysisWorker.js');
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
        handleWorkerMessage(event.data);
      };

      worker.onerror = (error) => {
        console.error('[AnalysisWorker] Worker error:', error);
        setIsReady(false);
      };

      worker.onmessageerror = (error) => {
        console.error('[AnalysisWorker] Message error:', error);
      };

      return () => {
        // 모든 대기 중인 작업 취소
        pendingTasks.current.forEach(({ reject, timeout }) => {
          clearTimeout(timeout);
          reject(new Error('Worker terminated'));
        });
        pendingTasks.current.clear();
        
        worker.terminate();
        workerRef.current = null;
        setIsReady(false);
      };
    } catch (error) {
      console.error('[AnalysisWorker] Failed to create worker:', error);
      setIsReady(false);
    }
  }, []);

  const handleWorkerMessage = useCallback((response: AnalysisWorkerResponse) => {
    switch (response.type) {
      case 'READY':
        setIsReady(true);
        console.log('[AnalysisWorker] Worker is ready');
        break;

      case 'SUCCESS':
        if (response.id) {
          const task = pendingTasks.current.get(response.id);
          if (task) {
            clearTimeout(task.timeout);
            
            // 진행률 업데이트
            const updatedProgress: AnalysisProgress = {
              ...task.progress,
              progress: 100,
              status: 'completed',
              result: response.data,
              endTime: Date.now()
            };
            
            updateTaskProgress(response.id, updatedProgress);
            
            task.resolve(response.data);
            pendingTasks.current.delete(response.id);
            setActiveTaskCount(prev => prev - 1);
            
            onComplete?.(response.data, response.id);
          }
        }
        break;

      case 'ERROR':
        if (response.id) {
          const task = pendingTasks.current.get(response.id);
          if (task) {
            clearTimeout(task.timeout);
            
            const error = new Error(response.error?.message || 'Worker error');
            
            // 진행률 업데이트
            const updatedProgress: AnalysisProgress = {
              ...task.progress,
              status: 'error',
              error: error.message,
              endTime: Date.now()
            };
            
            updateTaskProgress(response.id, updatedProgress);
            
            task.reject(error);
            pendingTasks.current.delete(response.id);
            setActiveTaskCount(prev => prev - 1);
            
            onError?.(error, response.id);
          }
        }
        break;
    }
  }, [onComplete, onError]);

  const updateTaskProgress = useCallback((taskId: string, progress: AnalysisProgress) => {
    setTaskProgress(prev => new Map(prev.set(taskId, progress)));
    
    if (enableProgress) {
      onProgress?.(progress);
    }
  }, [enableProgress, onProgress]);

  const generateTaskId = useCallback(() => {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const executeTask = useCallback((message: AnalysisWorkerMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      const taskId = message.id;
      
      // 진행률 초기화
      const initialProgress: AnalysisProgress = {
        id: taskId,
        type: message.type,
        progress: 0,
        status: 'running',
        startTime: Date.now()
      };
      
      updateTaskProgress(taskId, initialProgress);

      // 타임아웃 설정
      const timeout = setTimeout(() => {
        pendingTasks.current.delete(taskId);
        setActiveTaskCount(prev => prev - 1);
        
        const timeoutProgress: AnalysisProgress = {
          ...initialProgress,
          status: 'error',
          error: 'Task timeout',
          endTime: Date.now()
        };
        
        updateTaskProgress(taskId, timeoutProgress);
        reject(new Error('Task timeout'));
      }, timeoutMs);

      // 작업 등록
      pendingTasks.current.set(taskId, {
        resolve,
        reject,
        timeout,
        progress: initialProgress
      });

      setActiveTaskCount(prev => prev + 1);

      // Worker에 메시지 전송
      workerRef.current.postMessage(message);
    });
  }, [isReady, timeoutMs, updateTaskProgress]);

  // 의존성 분석
  const analyzeDependencies = useCallback(async (files: any[]) => {
    const taskId = generateTaskId();
    const message: AnalysisWorkerMessage = {
      type: 'ANALYZE_DEPENDENCIES',
      data: { files },
      id: taskId
    };

    return executeTask(message);
  }, [generateTaskId, executeTask]);

  // 워크플로우 메트릭 계산
  const calculateMetrics = useCallback(async (nodes: any[], edges: any[]) => {
    const taskId = generateTaskId();
    const message: AnalysisWorkerMessage = {
      type: 'CALCULATE_METRICS',
      data: { nodes, edges },
      id: taskId
    };

    return executeTask(message);
  }, [generateTaskId, executeTask]);

  // 단일 파일 분석
  const analyzeFile = useCallback(async (file: any) => {
    const taskId = generateTaskId();
    const message: AnalysisWorkerMessage = {
      type: 'ANALYZE_FILE',
      data: { file },
      id: taskId
    };

    return executeTask(message);
  }, [generateTaskId, executeTask]);

  // 모든 작업 취소
  const cancelAllTasks = useCallback(() => {
    pendingTasks.current.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Task cancelled'));
    });
    
    pendingTasks.current.clear();
    setActiveTaskCount(0);
    setTaskProgress(new Map());
  }, []);

  // 특정 작업 취소
  const cancelTask = useCallback((taskId: string) => {
    const task = pendingTasks.current.get(taskId);
    if (task) {
      clearTimeout(task.timeout);
      task.reject(new Error('Task cancelled'));
      pendingTasks.current.delete(taskId);
      setActiveTaskCount(prev => prev - 1);
      
      const cancelledProgress: AnalysisProgress = {
        ...task.progress,
        status: 'error',
        error: 'Cancelled',
        endTime: Date.now()
      };
      
      updateTaskProgress(taskId, cancelledProgress);
    }
  }, [updateTaskProgress]);

  // 작업 상태 조회
  const getTaskProgress = useCallback((taskId: string) => {
    return taskProgress.get(taskId);
  }, [taskProgress]);

  // 모든 작업 진행 상황 조회
  const getAllTaskProgress = useCallback(() => {
    return Array.from(taskProgress.values());
  }, [taskProgress]);

  // Worker 상태 정보
  const getWorkerStatus = useCallback(() => {
    return {
      isReady,
      activeTaskCount,
      pendingTaskCount: pendingTasks.current.size,
      queuedTaskCount: taskQueue.length,
      maxConcurrentTasks,
      memoryUsage: (performance as any).memory ? {
        used: ((performance as any).memory).usedJSHeapSize,
        total: ((performance as any).memory).totalJSHeapSize,
        limit: ((performance as any).memory).jsHeapSizeLimit
      } : null
    };
  }, [isReady, activeTaskCount, taskQueue.length, maxConcurrentTasks]);

  return {
    // 작업 실행
    analyzeDependencies,
    calculateMetrics,
    analyzeFile,
    
    // 작업 관리
    cancelAllTasks,
    cancelTask,
    
    // 상태 조회
    isReady,
    activeTaskCount,
    getTaskProgress,
    getAllTaskProgress,
    getWorkerStatus,
    
    // 진행 상황
    taskProgress: Array.from(taskProgress.values())
  };
}

export default useAnalysisWorker;