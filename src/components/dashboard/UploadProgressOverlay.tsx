import React from 'react';
import { motion } from 'framer-motion';

interface UploadProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
  speed: number;
  timeRemaining: number;
  analyzing: boolean;
  uploading: boolean;
  processing: boolean;
  currentFileName?: string;
  processedFiles: number;
  chunkProgress?: {
    current: number;
    total: number;
  };
}

interface UploadProgressOverlayProps {
  uploadProgress: UploadProgress;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({ 
  uploadProgress 
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분 ${Math.round(seconds % 60)}초`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="glass-panel p-8 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold mb-6 text-center">
          {uploadProgress.analyzing ? '프로젝트 분석 중' : 
           uploadProgress.processing ? '워크플로우 생성 중' : 
           '파일 업로드 중'}
        </h3>

        <div className="space-y-4">
          {/* 진행률 바 */}
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-400">
              <span>{uploadProgress.percentage}%</span>
              <span>{uploadProgress.current} / {uploadProgress.total} 파일</span>
            </div>
          </div>

          {/* 현재 파일 */}
          {uploadProgress.currentFileName && (
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">현재 파일:</span> {uploadProgress.currentFileName}
            </div>
          )}

          {/* 청크 진행률 */}
          {uploadProgress.chunkProgress && (
            <div className="text-sm text-gray-400">
              <span className="text-gray-500">청크:</span> {uploadProgress.chunkProgress.current} / {uploadProgress.chunkProgress.total}
            </div>
          )}

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="text-sm text-gray-500">업로드 속도</div>
              <div className="text-lg font-semibold">{formatBytes(uploadProgress.speed)}/s</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">남은 시간</div>
              <div className="text-lg font-semibold">{formatTime(uploadProgress.timeRemaining)}</div>
            </div>
          </div>

          {/* 상태 메시지 */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {uploadProgress.status}
          </div>

          {/* 애니메이션 로더 */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};