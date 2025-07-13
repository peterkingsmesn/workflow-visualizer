import React, { useState, useEffect } from 'react';
import { Download, Monitor, Apple, Smartphone, ExternalLink, CheckCircle } from 'lucide-react';

interface Release {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
    download_count: number;
  }>;
}

const DownloadSection: React.FC = () => {
  const [latestRelease, setLatestRelease] = useState<Release | null>(null);
  const [userOS, setUserOS] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // OS 감지
  useEffect(() => {
    const detectOS = () => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Windows')) return 'windows';
      if (userAgent.includes('Mac')) return 'mac';
      if (userAgent.includes('Linux')) return 'linux';
      return 'unknown';
    };
    
    setUserOS(detectOS());
  }, []);

  // GitHub Releases에서 최신 버전 가져오기
  useEffect(() => {
    const fetchLatestRelease = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/peterkingsmesn/workflow-visualizer/releases/latest');
        if (response.ok) {
          const release = await response.json();
          setLatestRelease(release);
        }
      } catch (error) {
        console.error('최신 릴리스 정보를 가져올 수 없습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRelease();
  }, []);

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // OS별 다운로드 링크 찾기
  const getDownloadLink = (os: string) => {
    if (!latestRelease) return null;
    
    const patterns = {
      windows: /\.exe$/i,
      mac: /\.dmg$/i,
      linux: /\.AppImage$/i
    };
    
    return latestRelease.assets.find(asset => 
      patterns[os as keyof typeof patterns]?.test(asset.name)
    );
  };

  // 추천 다운로드 버튼
  const RecommendedDownload = () => {
    const recommendedAsset = getDownloadLink(userOS);
    
    if (!recommendedAsset) return null;
    
    const osNames = {
      windows: 'Windows',
      mac: 'macOS', 
      linux: 'Linux'
    };

    return (
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {osNames[userOS as keyof typeof osNames]} 사용자를 위한 추천
            </h3>
            <p className="text-blue-100">
              {recommendedAsset.name} • {formatFileSize(recommendedAsset.size)}
            </p>
          </div>
          <a
            href={recommendedAsset.browser_download_url}
            className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            onClick={() => {
              // 다운로드 통계 추적
              if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                  event_category: 'desktop_app',
                  event_label: userOS,
                  value: 1
                });
              }
            }}
          >
            <Download className="w-5 h-5" />
            다운로드
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">최신 버전 정보를 가져오는 중...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="download" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            데스크톱 앱 다운로드
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            $9.9/월 구독으로 모든 고급 기능을 데스크톱에서 사용하세요.
            {latestRelease && (
              <span className="block mt-2 text-blue-600 font-semibold">
                최신 버전: {latestRelease.tag_name}
              </span>
            )}
          </p>
        </div>

        {/* 추천 다운로드 */}
        {userOS && userOS !== 'unknown' && <RecommendedDownload />}

        {/* 모든 플랫폼 다운로드 */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Windows */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Monitor className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold">Windows</h3>
            </div>
            <p className="text-gray-600 mb-4">Windows 10/11 지원</p>
            
            {(() => {
              const windowsAsset = getDownloadLink('windows');
              if (windowsAsset) {
                return (
                  <div>
                    <div className="text-sm text-gray-500 mb-3">
                      {windowsAsset.name}<br />
                      {formatFileSize(windowsAsset.size)} • {windowsAsset.download_count.toLocaleString()} 다운로드
                    </div>
                    <a
                      href={windowsAsset.browser_download_url}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      .exe 다운로드
                    </a>
                  </div>
                );
              }
              return (
                <div className="text-gray-500">
                  <p>Windows 버전 준비 중...</p>
                </div>
              );
            })()}
          </div>

          {/* macOS */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Apple className="w-8 h-8 text-gray-700 mr-3" />
              <h3 className="text-xl font-bold">macOS</h3>
            </div>
            <p className="text-gray-600 mb-4">Intel & Apple Silicon 지원</p>
            
            {(() => {
              const macAsset = getDownloadLink('mac');
              if (macAsset) {
                return (
                  <div>
                    <div className="text-sm text-gray-500 mb-3">
                      {macAsset.name}<br />
                      {formatFileSize(macAsset.size)} • {macAsset.download_count.toLocaleString()} 다운로드
                    </div>
                    <a
                      href={macAsset.browser_download_url}
                      className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      .dmg 다운로드
                    </a>
                  </div>
                );
              }
              return (
                <div className="text-gray-500">
                  <p>macOS 버전 준비 중...</p>
                </div>
              );
            })()}
          </div>

          {/* Linux */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Smartphone className="w-8 h-8 text-orange-600 mr-3" />
              <h3 className="text-xl font-bold">Linux</h3>
            </div>
            <p className="text-gray-600 mb-4">모든 배포판 지원</p>
            
            {(() => {
              const linuxAsset = getDownloadLink('linux');
              if (linuxAsset) {
                return (
                  <div>
                    <div className="text-sm text-gray-500 mb-3">
                      {linuxAsset.name}<br />
                      {formatFileSize(linuxAsset.size)} • {linuxAsset.download_count.toLocaleString()} 다운로드
                    </div>
                    <a
                      href={linuxAsset.browser_download_url}
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      .AppImage 다운로드
                    </a>
                  </div>
                );
              }
              return (
                <div className="text-gray-500">
                  <p>Linux 버전 준비 중...</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 구독 안내 */}
        <div className="mt-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">🔑 라이센스 키가 필요합니다</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                구독 후 받을 수 있는 것:
              </h4>
              <ul className="space-y-1 text-purple-100">
                <li>• 개인 라이센스 키</li>
                <li>• 최대 3대 디바이스 사용</li>
                <li>• 30일 오프라인 사용</li>
                <li>• 모든 고급 분석 기능</li>
              </ul>
            </div>
            <div className="text-left">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                사용 방법:
              </h4>
              <ul className="space-y-1 text-purple-100">
                <li>1. Gumroad에서 구독 결제</li>
                <li>2. 이메일로 라이센스 키 수령</li>
                <li>3. 앱 실행 후 키 입력</li>
                <li>4. 모든 기능 활성화!</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="https://spiderverse10.gumroad.com/l/workflow-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              월 $9.9 구독하기
            </a>
          </div>
        </div>

        {/* 시스템 요구사항 */}
        <div className="mt-12 bg-white rounded-xl p-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">시스템 요구사항</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Windows</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Windows 10 이상</li>
                <li>• 4GB RAM</li>
                <li>• 1GB 저장공간</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">macOS</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• macOS 10.14 이상</li>
                <li>• Intel/Apple Silicon</li>
                <li>• 4GB RAM</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Linux</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Ubuntu 18.04+ 권장</li>
                <li>• GLIBC 2.17+</li>
                <li>• 4GB RAM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;