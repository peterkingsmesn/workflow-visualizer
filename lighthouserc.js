// 🚀 성능 테스트: Lighthouse CI 설정

module.exports = {
  ci: {
    collect: {
      // 테스트할 URL 설정
      url: [
        'http://localhost:3000', // 로컬 개발 서버
        'http://localhost:3000/workflow-editor', // 워크플로우 에디터 페이지
      ],
      // 크롬 옵션
      chromeFlags: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--headless'
      ],
      // 수집 옵션
      numberOfRuns: 3, // 3회 실행하여 평균값 계산
      settings: {
        // 성능 최적화된 설정
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        // 모바일 시뮬레이션
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        },
        // 추가 감사 항목
        audits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'first-meaningful-paint',
          'speed-index',
          'interactive',
          'total-blocking-time',
          'cumulative-layout-shift',
          'server-response-time',
          'critical-request-chains',
          'main-thread-tasks',
          'metrics',
          'performance-budget',
          'timing-budget',
          'resource-summary',
          'third-party-summary',
          'unused-css-rules',
          'unused-javascript',
          'modern-image-formats',
          'uses-optimized-images',
          'uses-text-compression',
          'uses-responsive-images',
          'efficient-animated-content',
          'dom-size',
          'no-document-write',
          'uses-http2',
          'uses-passive-event-listeners',
          'no-mutation-events',
          'long-tasks',
          'non-composited-animations',
          'unsized-images',
          'preload-lcp-image',
          'render-blocking-resources',
          'accessibility-color-contrast',
          'accessibility-aria',
          'accessibility-navigation',
          'accessibility-names-labels'
        ]
      }
    },
    upload: {
      // Lighthouse CI 서버 업로드 (옵션)
      target: 'temporary-public-storage',
      // 또는 자체 LHCI 서버 사용
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-server-token'
    },
    assert: {
      // 성능 임계값 설정 (워크플로우 최적화된 값)
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['error', { minScore: 0.95 }],
        'total-blocking-time': ['error', { minScore: 0.9 }],
        'speed-index': ['error', { minScore: 0.9 }],
        'interactive': ['error', { minScore: 0.9 }],
        
        // 성능 점수
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        
        // 리소스 최적화
        'unused-css-rules': ['warn', { maxLength: 0 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-text-compression': ['error', { minScore: 0.9 }],
        'render-blocking-resources': ['warn', { maxLength: 0 }],
        
        // DOM 및 JavaScript
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        'main-thread-tasks': ['warn', { maxNumericValue: 500 }],
        'long-tasks': ['warn', { maxLength: 0 }],
        
        // 네트워크 최적화
        'uses-http2': ['warn', { minScore: 0.8 }],
        'server-response-time': ['error', { maxNumericValue: 600 }],
        
        // 접근성
        'color-contrast': ['error', { minScore: 1.0 }],
        'aria-allowed-attr': ['error', { minScore: 1.0 }],
        'aria-required-attr': ['error', { minScore: 1.0 }],
        'aria-roles': ['error', { minScore: 1.0 }],
        'aria-valid-attr': ['error', { minScore: 1.0 }],
        'aria-valid-attr-value': ['error', { minScore: 1.0 }],
        'button-name': ['error', { minScore: 1.0 }],
        'document-title': ['error', { minScore: 1.0 }],
        'focus-traps': ['error', { minScore: 1.0 }],
        'focusable-controls': ['error', { minScore: 1.0 }],
        'heading-order': ['error', { minScore: 1.0 }],
        'html-has-lang': ['error', { minScore: 1.0 }],
        'html-lang-valid': ['error', { minScore: 1.0 }],
        'image-alt': ['error', { minScore: 1.0 }],
        'input-image-alt': ['error', { minScore: 1.0 }],
        'label': ['error', { minScore: 1.0 }],
        'link-name': ['error', { minScore: 1.0 }],
        'list': ['error', { minScore: 1.0 }],
        'listitem': ['error', { minScore: 1.0 }],
        'meta-refresh': ['error', { minScore: 1.0 }],
        'meta-viewport': ['error', { minScore: 1.0 }],
        'object-alt': ['error', { minScore: 1.0 }],
        'tabindex': ['error', { minScore: 1.0 }],
        'td-headers-attr': ['error', { minScore: 1.0 }],
        'th-has-data-cells': ['error', { minScore: 1.0 }],
        'valid-lang': ['error', { minScore: 1.0 }],
        'video-caption': ['error', { minScore: 1.0 }],
        'video-description': ['error', { minScore: 1.0 }]
      }
    },
    // 예산 설정 (성능 예산)
    budgets: [
      {
        resourceSizes: [
          { resourceType: 'script', budget: 300 }, // 300KB JavaScript
          { resourceType: 'stylesheet', budget: 100 }, // 100KB CSS
          { resourceType: 'image', budget: 500 }, // 500KB 이미지
          { resourceType: 'font', budget: 100 }, // 100KB 폰트
          { resourceType: 'total', budget: 1000 } // 1MB 총 크기
        ],
        resourceCounts: [
          { resourceType: 'script', budget: 10 }, // 최대 10개 스크립트
          { resourceType: 'stylesheet', budget: 5 }, // 최대 5개 CSS 파일
          { resourceType: 'image', budget: 20 }, // 최대 20개 이미지
          { resourceType: 'third-party', budget: 5 } // 최대 5개 서드파티 리소스
        ],
        timings: [
          { metric: 'first-contentful-paint', budget: 1800 }, // 1.8초
          { metric: 'largest-contentful-paint', budget: 2500 }, // 2.5초
          { metric: 'interactive', budget: 3800 }, // 3.8초
          { metric: 'first-meaningful-paint', budget: 2000 }, // 2초
          { metric: 'speed-index', budget: 3000 }, // 3초
          { metric: 'total-blocking-time', budget: 300 }, // 300ms
          { metric: 'cumulative-layout-shift', budget: 0.1 } // 0.1
        ]
      }
    ]
  },
  // 워크플로우별 맞춤 설정
  workflows: {
    // 개발 환경 워크플로우
    development: {
      collect: {
        numberOfRuns: 1,
        settings: {
          emulatedFormFactor: 'desktop',
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1
          }
        }
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.7 }],
          'categories:accessibility': ['error', { minScore: 0.9 }]
        }
      }
    },
    // 프로덕션 환경 워크플로우
    production: {
      collect: {
        numberOfRuns: 5,
        settings: {
          emulatedFormFactor: 'mobile',
          throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4
          }
        }
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.95 }],
          'categories:accessibility': ['error', { minScore: 0.98 }],
          'categories:best-practices': ['error', { minScore: 0.95 }]
        }
      }
    },
    // 접근성 전용 테스트
    accessibility: {
      collect: {
        numberOfRuns: 1,
        settings: {
          onlyCategories: ['accessibility'],
          audits: [
            'accesskeys',
            'aria-allowed-attr',
            'aria-hidden-body',
            'aria-hidden-focus',
            'aria-input-field-name',
            'aria-required-attr',
            'aria-required-children',
            'aria-required-parent',
            'aria-roles',
            'aria-toggle-field-name',
            'aria-valid-attr',
            'aria-valid-attr-value',
            'button-name',
            'bypass',
            'color-contrast',
            'definition-list',
            'dlitem',
            'document-title',
            'duplicate-id-active',
            'duplicate-id-aria',
            'focus-traps',
            'focusable-controls',
            'form-field-multiple-labels',
            'frame-title',
            'heading-order',
            'html-has-lang',
            'html-lang-valid',
            'image-alt',
            'input-image-alt',
            'label',
            'landmark-one-main',
            'link-name',
            'list',
            'listitem',
            'meta-refresh',
            'meta-viewport',
            'object-alt',
            'tabindex',
            'table-fake-caption',
            'td-headers-attr',
            'th-has-data-cells',
            'valid-lang',
            'video-caption',
            'video-description'
          ]
        }
      },
      assert: {
        assertions: {
          'categories:accessibility': ['error', { minScore: 1.0 }]
        }
      }
    }
  }
};