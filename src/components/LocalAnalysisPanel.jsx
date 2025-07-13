import React, { useState, useCallback } from 'react';
import { useLocalAnalysis } from '../hooks/useLocalAnalysis';

const LocalAnalysisPanel = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const {
    analyzeFiles,
    isProcessing,
    progress,
    results,
    error,
    saveResults
  } = useLocalAnalysis();

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    
    // 자동으로 분석 시작
    analyzeFiles(droppedFiles);
  }, [analyzeFiles]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    analyzeFiles(selectedFiles);
  }, [analyzeFiles]);

  // 폴더 업로드 핸들러
  const handleFolderSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    analyzeFiles(selectedFiles);
  }, [analyzeFiles]);

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6 text-primary">
        로컬 코드 분석
      </h2>
      
      <div className="mb-6">
        <p className="text-secondary mb-4">
          모든 분석은 여러분의 컴퓨터에서 진행됩니다. 
          코드가 서버로 전송되지 않아 안전합니다.
        </p>
        
        <div className="flex gap-4">
          <div className="badge badge-primary">
            🔒 완전한 프라이버시
          </div>
          <div className="badge badge-primary">
            ⚡ 빠른 처리 속도
          </div>
          <div className="badge badge-primary">
            📊 제한 없는 분석
          </div>
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-glass-border hover:border-primary/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <p className="text-lg">
            파일이나 폴더를 여기에 드래그하세요
          </p>
          <p className="text-secondary text-sm">
            또는 클릭하여 선택하세요
          </p>
          
          <div className="flex gap-4 justify-center">
            <label className="btn-gradient cursor-pointer">
              파일 선택
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.rb,.go,.rs,.php,.swift,.kt"
              />
            </label>
            
            <label className="btn-gradient cursor-pointer">
              폴더 선택
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                onChange={handleFolderSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      {isProcessing && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">분석 중...</span>
            <span className="text-sm">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-surface rounded-full h-2">
            <div
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 분석된 파일 목록 */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            분석 파일 ({files.length}개)
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-secondary">📄</span>
                <span>{file.name}</span>
                <span className="text-tertiary">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* 분석 결과 */}
      {results && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">분석 결과</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-medium mb-2">의존성</h4>
              <p className="text-2xl font-bold text-primary">
                {results.data?.dependencies?.length || 0}
              </p>
            </div>
            
            <div className="card">
              <h4 className="font-medium mb-2">복잡도</h4>
              <p className="text-2xl font-bold text-primary">
                {results.data?.complexity?.cyclomatic || 0}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => saveResults('last-analysis')}
            className="btn-gradient w-full"
          >
            결과 저장
          </button>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="font-semibold mb-2">💡 팁</h4>
        <ul className="text-sm space-y-1 text-secondary">
          <li>• 대용량 프로젝트도 로컬에서 빠르게 분석됩니다</li>
          <li>• 분석 결과는 브라우저에 저장되어 나중에 확인 가능합니다</li>
          <li>• 민감한 코드도 안전하게 분석할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default LocalAnalysisPanel;