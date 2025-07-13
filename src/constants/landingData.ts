export const LANDING_DATA = {
  hero: {
    title: 'AI 코딩의\n혁명이 시작됩니다',
    subtitle: '전 세계 AI 코딩 사용자들의 필수 지침서 - Halo_workflow',
    stats: {
      number: '90%',
      description: '전 세계 7천만 AI 코딩 사용자 중 90%가 프로젝트를 포기합니다'
    },
    codeBlocks: [
      {
        content: `import React from 'react';
// 중복 임포트 감지됨`
      },
      {
        content: `const data = {
  // 더미데이터 제거됨
};`
      },
      {
        content: `// API 흐름 최적화
fetch('/api/optimized')`
      }
    ]
  },
  
  problems: {
    title: 'AI 코딩을 망치는 치명적 문제들',
    subtitle: '전 세계 AI 코딩 사용자의 90%가 프로젝트를 포기하는 이유',
    items: [
      {
        icon: '🗂️',
        title: '더미데이터 & 하드코딩 남발',
        description: 'AI가 시도때도 없이 생성하는 더미데이터와 하드코딩으로 인해 프로젝트가 스파게티 코드로 변해갑니다. 실제 데이터 연동 시점에서 모든 것을 다시 작성해야 하는 악몽이 시작됩니다.'
      },
      {
        icon: '🔄',
        title: '중복 임포트 지옥',
        description: '같은 라이브러리를 여러 번 임포트하고, 사용하지 않는 패키지들이 번들에 포함되어 앱이 무거워집니다. 빌드 시간은 늘어나고 성능은 떨어집니다.'
      },
      {
        icon: '🌊',
        title: 'API 생성 무분별한 흐름',
        description: '체계 없이 생성된 API들이 서로 충돌하고, 데이터 흐름을 파악할 수 없어 디버깅이 불가능합니다. 하나를 고치면 다른 곳에서 에러가 발생하는 연쇄 반응이 일어납니다.'
      },
      {
        icon: '📁',
        title: '중복파일 생성 혼란',
        description: '같은 기능을 하는 컴포넌트와 파일들이 여러 곳에 산재되어 있어 어떤 것이 최신인지, 어떤 것을 사용해야 하는지 알 수 없습니다. 프로젝트 구조가 완전히 엉망이 됩니다.'
      },
      {
        icon: '💸',
        title: 'AI API 비용 폭탄',
        description: '비효율적인 프롬프트와 반복적인 수정으로 AI API 비용이 기하급수적으로 증가합니다. 예상치 못한 청구서에 프로젝트가 중단됩니다.'
      },
      {
        icon: '🐛',
        title: '디버깅 불가능한 코드',
        description: 'AI가 생성한 복잡한 로직과 숨겨진 의존성으로 버그 추적이 불가능합니다. 에러 하나 고치는데 며칠이 걸립니다.'
      }
    ]
  },
  
  solutions: {
    title: 'Halo_workflow가 모든 혼란을 끝냅니다',
    items: [
      {
        icon: '🎯',
        title: '자동 워크플로우 생성',
        description: '작업폴더만 지정하면 AI가 전체 프로젝트 구조를 분석하여 최적화된 워크플로우를 자동으로 생성합니다. 복잡한 대형 프로젝트도 한눈에 파악 가능합니다.'
      },
      {
        icon: '🔍',
        title: '지능형 중복 검출',
        description: '워크플로우 노드를 통해 중복 임포트, 중복 파일, 중복 함수를 실시간으로 감지하고 최적화 방안을 제시합니다. 번들 크기를 최대 70%까지 줄일 수 있습니다.'
      },
      {
        icon: '📊',
        title: '3D 데이터흐름 시각화',
        description: '복잡한 데이터 흐름을 3D 그래프로 시각화하여 병목 지점과 최적화 포인트를 즉시 파악할 수 있습니다. 인터랙티브한 노드 조작으로 실시간 수정 가능합니다.'
      },
      {
        icon: '🔗',
        title: 'API 아키텍처 최적화',
        description: 'API 호출 패턴을 분석하여 불필요한 요청을 제거하고, RESTful 설계 원칙에 맞는 최적화된 API 구조를 자동으로 제안합니다.'
      },
      {
        icon: '⚠️',
        title: '실시간 품질 검증',
        description: '코드 작성과 동시에 잠재적 문제점을 실시간으로 감지하고 경고합니다. 보안 취약점, 성능 이슈, 코드 품질 문제를 사전에 방지합니다.'
      },
      {
        icon: '🤖',
        title: '원클릭 AI 수정',
        description: '분석 결과를 JSON으로 내보내어 AI 에이전트에게 전송하면 몇 초 안에 최적화된 코드를 받을 수 있습니다. 수동 수정은 이제 그만!'
      },
      {
        icon: '📊',
        title: '실시간 코드 품질 지표',
        description: '코드 복잡도, 기술 부채, 성능 병목 지점을 실시간으로 모니터링합니다. 문제가 발생하기 전에 미리 예방할 수 있습니다.'
      },
      {
        icon: '🎯',
        title: 'AI 모델별 최적화',
        description: 'Claude, GPT-4, Gemini 등 각 AI의 특성에 맞는 최적화된 프롬프트 템플릿과 가이드라인을 제공합니다.'
      },
      {
        icon: '👥',
        title: '팀 협업 워크플로우',
        description: '실시간 워크플로우 공유와 자동 코드 리뷰로 팀 전체의 생산성을 극대화합니다. 충돌 없는 완벽한 협업이 가능합니다.'
      },
      {
        icon: '💰',
        title: 'AI 비용 최적화',
        description: '토큰 사용량 추적과 최적화 제안으로 AI API 비용을 최대 80% 절감할 수 있습니다. ROI 분석 리포트도 제공합니다.'
      }
    ]
  },
  
  features: {
    title: '더 나은 AI 코딩을 위한 필수 기능',
    items: [
      {
        icon: '🌐',
        title: '전 세계 언어 지원',
        description: '한국어, 영어, 일본어, 중국어 등 주요 언어로 워크플로우 분석 결과를 번역합니다. 글로벌 팀과의 협업이 원활해집니다.'
      },
      {
        icon: '🗺️',
        title: 'Git 워크플로우 통합',
        description: '버전 관리를 자동화하고 최적의 브랜치 전략을 제시합니다. 머지 충돌을 사전에 예측하고 커밋 메시지도 자동 생성합니다.'
      },
      {
        icon: '📏',
        title: '비지니스 가치 추적',
        description: '개발 속도, 버그 감소율, 생산성 향상도를 실시간으로 추적합니다. 데이터 기반 의사 결정이 가능합니다.'
      },
      {
        icon: '🛡️',
        title: '보안 취약점 스캐너',
        description: '코드에 숨겨진 보안 취약점을 실시간으로 검사합니다. OWASP Top 10 및 최신 보안 위협에 대응합니다.'
      },
      {
        icon: '📡',
        title: '학습 곡선 분석',
        description: '개발자의 AI 코딩 실력 향상도를 추적하고 개인화된 학습 경로를 제공합니다. 실수에서 배우고 성장하세요.'
      },
      {
        icon: '🎯',
        title: '프롬프트 엔지니어링',
        description: '각 AI 모델에 최적화된 프롬프트 템플릿과 가이드를 제공합니다. 효율적인 AI 활용을 도와드립니다.'
      }
    ]
  },

  workflow: {
    title: '혁신적인 3단계 워크플로우',
    steps: [
      {
        number: '1',
        title: '스마트 폴더 스캔',
        description: '프로젝트 루트 폴더를 지정하면 AI가 모든 파일을 분석하여 의존성 그래프와 워크플로우를 자동 생성합니다. 숨겨진 문제점까지 모두 찾아냅니다.'
      },
      {
        number: '2',
        title: '인터랙티브 분석',
        description: '3D 시각화를 통해 데이터 흐름, API 구조, 파일 의존성을 실시간으로 탐색하고 수정할 수 있습니다. 클릭 한 번으로 세부 정보를 확인하세요.'
      },
      {
        number: '3',
        title: 'AI 협업 완성',
        description: '최적화 플랜을 JSON으로 내보내어 선호하는 AI 에이전트에게 전송하면 완벽하게 정리된 코드를 즉시 받을 수 있습니다. 품질 보장 100%!'
      }
    ]
  },
  
  target: {
    title: '누구를 위한 혁신인가요?',
    audiences: [
      {
        title: '🔧 기존 프로젝트 구원',
        features: [
          '혼란스러운 AI 코딩 프로젝트를 완전히 정리',
          '레거시 코드의 숨겨진 문제점 발견 및 해결',
          '성능 최적화로 사용자 경험 극대화',
          '유지보수 비용 90% 절감',
          '팀 협업 효율성 500% 향상'
        ]
      },
      {
        title: '🚀 새 프로젝트 완벽 시작',
        features: [
          '대형 프로젝트를 위한 엔터프라이즈급 워크플로우',
          '확장 가능한 아키텍처 자동 설계',
          'AI와 협업하는 차세대 개발 경험',
          '실시간 코드 품질 관리',
          '프로젝트 성공률 95% 달성'
        ]
      },
      {
        title: '🏢 엔터프라이즈 팀',
        features: [
          '온프레미스 설치 지원',
          '커스텀 규칙 및 정책 설정',
          '컴플라이언스 자동 체크',
          '감사 로그 및 보고서',
          '무제한 팀원 협업'
        ]
      },
      {
        title: '🎓 AI 코딩 입문자',
        features: [
          'AI 코딩 베스트 프랙티스 학습',
          '실패 사례 데이터베이스 접근',
          '단계별 가이드 튜토리얼',
          '커뮤니티 멘토링 지원',
          '성장 경로 추적'
        ]
      }
    ]
  },
  
  pricing: {
    title: '단 한 잔의 커피 값으로 시작하세요',
    plans: [
      {
        name: '월간 구독',
        price: '$3',
        period: '매월 결제',
        badge: '인기',
        badgeColor: 'blue',
        features: [
          '무제한 프로젝트 분석',
          '실시간 워크플로우 생성',
          'AI 에이전트 연동',
          '24/7 이메일 지원'
        ],
        ctaText: '월간 구독 시작'
      },
      {
        name: '연간 구독',
        price: '$30',
        period: '연간 결제 시',
        subPrice: '월 $2.5 (17% 절약!)',
        badge: '최고 할인',
        badgeColor: 'yellow',
        features: [
          '월간 플랜의 모든 기능',
          '프리미엄 AI 모델 액세스',
          '우선 고객 지원',
          '베타 기능 먼저 체험'
        ],
        ctaText: '연간 구독으로 절약하기',
        isHighlighted: true
      }
    ],
    footer: '💳 안전한 결제 | 🔄 언제든 취소 가능 | 🛡️ 30일 환불 보장'
  },
  
  finalCta: {
    title: 'AI 코딩의 새로운 시대가 왔습니다',
    subtitle: '전 세계 개발자들과 함께 코딩 혁명에 동참하세요. 더 이상 혼란 속에서 개발하지 마세요.',
    ctaText: '지금 시작하기'
  },
  
  testAccount: {
    title: '🔑 테스트 계정 (백엔드 없이 프론트엔드만 테스트)',
    accounts: [
      {
        type: '관리자',
        email: 'admin@workflow-visualizer.com',
        password: 'admin123!@#',
        color: '#ff6b9d'
      },
      {
        type: '프로 사용자',
        email: 'pro@example.com',
        password: 'pro123!@#',
        color: '#00d4ff'
      },
      {
        type: '일반 사용자',
        email: 'test@example.com',
        password: 'test123!@#',
        color: '#10b981'
      }
    ],
    disclaimer: '⚠️ 이 정보는 개발 환경에서만 표시됩니다. 프로덕션에서는 자동으로 숨겨집니다.',
    quickLoginText: '🚀 관리자로 빠른 로그인'
  }
};

export const NAV_LINKS = [
  { href: '#problems', text: '문제점' },
  { href: '#solutions', text: '솔루션' },
  { href: '#workflow', text: '워크플로우' },
  { href: '#features', text: '기능' },
  { href: '#target', text: '대상' },
  { href: '#pricing', text: '가격' }
];