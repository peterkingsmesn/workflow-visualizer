import { useState, useEffect, useCallback } from 'react';

// 로컬 분석을 위한 커스텀 훅
export const useLocalAnalysis = () => {
  const [worker, setWorker] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // 워커 초기화
  useEffect(() => {
    const analysisWorker = new Worker(
      new URL('../workers/analysisWorker.js', import.meta.url)
    );

    analysisWorker.onmessage = (e) => {
      const { type, result } = e.data;
      
      switch(type) {
        case 'ANALYSIS_COMPLETE':
          setResults(result);
          setIsProcessing(false);
          setProgress(100);
          break;
          
        case 'PROGRESS_UPDATE':
          setProgress(result.progress);
          break;
          
        case 'ERROR':
          setError(result.error);
          setIsProcessing(false);
          break;
      }
    };

    setWorker(analysisWorker);

    return () => {
      analysisWorker.terminate();
    };
  }, []);

  // 로컬에서 파일 분석
  const analyzeFiles = useCallback(async (files) => {
    if (!worker) return;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    // 파일을 청크로 나누어 처리 (메모리 관리)
    const CHUNK_SIZE = 10;
    const chunks = [];
    
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      chunks.push(files.slice(i, i + CHUNK_SIZE));
    }
    
    // 각 청크를 순차적으로 처리
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 파일 읽기 및 분석
      const fileContents = await Promise.all(
        chunk.map(file => readFileAsText(file))
      );
      
      worker.postMessage({
        type: 'ANALYZE_CODE',
        data: fileContents.map((content, index) => ({
          id: chunk[index].name,
          name: chunk[index].name,
          content: content,
          type: getFileType(chunk[index].name)
        }))
      });
      
      // 진행률 업데이트
      setProgress(((i + 1) / chunks.length) * 100);
    }
  }, [worker]);

  // 단일 코드 분석
  const analyzeCode = useCallback((code, language) => {
    if (!worker) return;
    
    setIsProcessing(true);
    setError(null);
    
    worker.postMessage({
      type: 'ANALYZE_CODE',
      data: {
        id: 'single-code',
        content: code,
        type: language
      }
    });
  }, [worker]);

  // 워크플로우 생성
  const generateWorkflow = useCallback((projectData) => {
    if (!worker) return;
    
    setIsProcessing(true);
    setError(null);
    
    worker.postMessage({
      type: 'GENERATE_WORKFLOW',
      data: projectData
    });
  }, [worker]);

  // 분석 취소
  const cancelAnalysis = useCallback(() => {
    if (worker) {
      worker.terminate();
      // 새 워커 생성
      const newWorker = new Worker(
        new URL('../workers/analysisWorker.js', import.meta.url)
      );
      setWorker(newWorker);
      setIsProcessing(false);
      setProgress(0);
    }
  }, [worker]);

  // 로컬 스토리지에 결과 저장
  const saveResults = useCallback((key) => {
    if (results) {
      try {
        // 대용량 데이터는 IndexedDB 사용
        const request = indexedDB.open('WorkflowAnalysis', 1);
        
        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['results'], 'readwrite');
          const store = transaction.objectStore('results');
          
          store.put({
            key: key,
            data: results,
            timestamp: new Date().toISOString()
          });
        };
      } catch (error) {
        console.error('Failed to save results:', error);
      }
    }
  }, [results]);

  // 로컬 스토리지에서 결과 불러오기
  const loadResults = useCallback((key) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkflowAnalysis', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['results'], 'readonly');
        const store = transaction.objectStore('results');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data);
        };
        
        getRequest.onerror = () => {
          reject(new Error('Failed to load results'));
        };
      };
    });
  }, []);

  return {
    analyzeFiles,
    analyzeCode,
    generateWorkflow,
    cancelAnalysis,
    saveResults,
    loadResults,
    isProcessing,
    progress,
    results,
    error
  };
};

// 파일 읽기 헬퍼
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 파일 타입 확인
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const typeMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin'
  };
  
  return typeMap[ext] || 'text';
}