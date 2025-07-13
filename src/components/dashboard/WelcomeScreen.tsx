import React from 'react';
import { FolderOpen, Sparkles, Zap, Shield } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectFolder: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectFolder }) => {
  return (
    <div className="h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-auto">
      {/* 헤더 섹션 */}
      <div className="text-center pt-16 pb-8">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full mb-8 shadow-2xl animate-pulse">
          <Sparkles size={64} className="text-white" />
        </div>
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 bg-clip-text text-transparent">
          Workflow Visualizer
        </h1>
        <p className="text-2xl text-gray-300 mb-2">
          코드베이스를 시각적으로 분석하고 이해하세요
        </p>
        <p className="text-lg text-gray-500">
          복잡한 프로젝트 구조를 직관적인 다이어그램으로 변환
        </p>
      </div>

      {/* 메인 CTA */}
      <div className="flex justify-center mb-12">
        <button
          onClick={onSelectFolder}
          className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center">
            <FolderOpen className="mr-4" size={28} />
            프로젝트 폴더 선택
          </div>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-16">
        {/* 주요 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-600 transition-all hover:transform hover:scale-105">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">초고속 분석</h3>
            <p className="text-gray-400 mb-4">수천 개의 파일도 몇 초 안에 분석</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• 병렬 처리로 속도 최적화</li>
              <li>• 스마트 캐싱 시스템</li>
              <li>• 실시간 진행 상황 표시</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-green-600 transition-all hover:transform hover:scale-105">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">완벽한 보안</h3>
            <p className="text-gray-400 mb-4">모든 분석은 로컬에서 처리</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• 소스 코드 외부 전송 없음</li>
              <li>• 오프라인 환경 지원</li>
              <li>• 엔터프라이즈급 보안</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-600 transition-all hover:transform hover:scale-105">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">AI 기반 분석</h3>
            <p className="text-gray-400 mb-4">지능적인 코드 패턴 인식</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• 순환 의존성 감지</li>
              <li>• 코드 품질 평가</li>
              <li>• 리팩토링 제안</li>
            </ul>
          </div>
        </div>

        {/* 지원 언어 및 프레임워크 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">지원하는 언어 및 프레임워크</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'JavaScript/TypeScript', color: 'from-yellow-500 to-yellow-600' },
              { name: 'React/Next.js', color: 'from-blue-500 to-cyan-600' },
              { name: 'Python', color: 'from-green-500 to-emerald-600' },
              { name: 'Java/Spring', color: 'from-red-500 to-orange-600' },
              { name: 'C/C++', color: 'from-gray-500 to-gray-600' },
              { name: 'Go', color: 'from-cyan-500 to-blue-600' },
              { name: 'Rust', color: 'from-orange-500 to-red-600' },
              { name: 'Ruby/Rails', color: 'from-pink-500 to-red-600' }
            ].map((lang) => (
              <div key={lang.name} className="bg-gray-800/50 rounded-xl p-4 text-center hover:bg-gray-700/50 transition-colors">
                <div className={`h-2 bg-gradient-to-r ${lang.color} rounded-full mb-3`}></div>
                <p className="text-sm font-medium">{lang.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">50K+</div>
            <div className="text-gray-400">분석된 프로젝트</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-500 mb-2">10M+</div>
            <div className="text-gray-400">처리된 파일</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-500 mb-2">99.9%</div>
            <div className="text-gray-400">정확도</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-500 mb-2">&lt;1s</div>
            <div className="text-gray-400">평균 분석 시간</div>
          </div>
        </div>

        {/* 드래그 앤 드롭 영역 */}
        <div className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:border-blue-600 transition-colors">
          <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-2">
            파일을 여기로 드래그 앤 드롭하거나
          </p>
          <button
            onClick={onSelectFolder}
            className="text-blue-500 hover:text-blue-400 font-semibold"
          >
            클릭하여 폴더 선택
          </button>
        </div>
      </div>
    </div>
  );
};