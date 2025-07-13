import React from 'react';
import { FolderOpen, File, Code, Database, Package, GitBranch } from 'lucide-react';
import { AnalysisResult } from '../../utils/projectAnalyzer';

interface ProjectSidebarProps {
  analysisResults: AnalysisResult | null;
  onClose: () => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  analysisResults, 
  onClose 
}) => {
  if (!analysisResults) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      JavaScript: '#f7df1e',
      TypeScript: '#3178c6',
      Python: '#3776ab',
      Java: '#007396',
      'C++': '#00599c',
      Go: '#00add8',
      Rust: '#dea584',
      Ruby: '#cc342d',
      PHP: '#777bb4',
      Swift: '#fa7343',
      HTML: '#e34c26',
      CSS: '#1572b6'
    };
    return colors[language] || '#6b7280';
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{analysisResults.projectName}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 프로젝트 개요 */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2">
            <File size={16} /> 총 파일
          </span>
          <span className="font-semibold">{analysisResults.totalFiles}개</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2">
            <FolderOpen size={16} /> 프로젝트 크기
          </span>
          <span className="font-semibold">{formatBytes(analysisResults.totalSize)}</span>
        </div>
      </div>

      {/* 언어 분포 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">언어 분포</h4>
        <div className="space-y-3">
          {Object.entries(analysisResults.languages)
            .sort(([, a], [, b]) => b - a)
            .map(([language, count]) => {
              const percentage = Math.round((count / analysisResults.totalFiles) * 100);
              return (
                <div key={language}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getLanguageColor(language) }}
                      />
                      {language}
                    </span>
                    <span className="text-gray-400">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getLanguageColor(language)
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 프레임워크 */}
      {analysisResults.frameworks.length > 0 && (
        <div className="mb-8">
          <h4 className="text-sm font-semibold text-gray-400 mb-4">프레임워크</h4>
          <div className="flex flex-wrap gap-2">
            {analysisResults.frameworks.map(framework => (
              <span
                key={framework}
                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 프로젝트 특성 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-400 mb-4">프로젝트 특성</h4>
        <div className="space-y-2">
          {analysisResults.hasBackend && (
            <div className="flex items-center gap-2 text-green-400">
              <Code size={16} /> 백엔드 포함
            </div>
          )}
          {analysisResults.hasFrontend && (
            <div className="flex items-center gap-2 text-blue-400">
              <Code size={16} /> 프론트엔드 포함
            </div>
          )}
          {analysisResults.hasDatabase && (
            <div className="flex items-center gap-2 text-purple-400">
              <Database size={16} /> 데이터베이스 포함
            </div>
          )}
          {analysisResults.hasDocker && (
            <div className="flex items-center gap-2 text-cyan-400">
              <Package size={16} /> Docker 설정 포함
            </div>
          )}
          {analysisResults.hasCI && (
            <div className="flex items-center gap-2 text-orange-400">
              <GitBranch size={16} /> CI/CD 설정 포함
            </div>
          )}
        </div>
      </div>

      {/* 코드 통계 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-4">코드 통계</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{analysisResults.components}</div>
            <div className="text-xs text-gray-400">컴포넌트</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{analysisResults.services}</div>
            <div className="text-xs text-gray-400">서비스</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{analysisResults.apiEndpoints}</div>
            <div className="text-xs text-gray-400">API 엔드포인트</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{analysisResults.tests}</div>
            <div className="text-xs text-gray-400">테스트 파일</div>
          </div>
        </div>
      </div>
    </div>
  );
};