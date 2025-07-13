import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, X } from 'lucide-react';

export const SubscriptionRequired: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: [
        { name: '프로젝트 3개까지', included: true },
        { name: '기본 분석', included: true },
        { name: '워크플로우 시각화', included: false },
        { name: 'AI 진단', included: false },
        { name: '무제한 프로젝트', included: false }
      ]
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/월',
      recommended: true,
      features: [
        { name: '무제한 프로젝트', included: true },
        { name: '고급 분석', included: true },
        { name: '워크플로우 시각화', included: true },
        { name: 'AI 진단', included: true },
        { name: '우선 지원', included: true }
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: [
        { name: '모든 Pro 기능', included: true },
        { name: '팀 협업', included: true },
        { name: 'SSO 지원', included: true },
        { name: '전담 지원', included: true },
        { name: 'SLA 보장', included: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Pro 플랜으로 업그레이드하세요
          </h1>
          <p className="text-xl text-gray-400">
            워크플로우 시각화 기능은 Pro 플랜 이상에서 사용 가능합니다
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-gray-900 rounded-xl p-8 border-2 transition-all ${
                plan.recommended
                  ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/20'
                  : 'border-gray-800'
              }`}
            >
              {plan.recommended && (
                <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  추천
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-400">{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <Check size={20} className="text-green-500 mr-3 flex-shrink-0" />
                    ) : (
                      <X size={20} className="text-gray-600 mr-3 flex-shrink-0" />
                    )}
                    <span className={feature.included ? '' : 'text-gray-500'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/settings?tab=subscription')}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.recommended
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                {plan.name === 'Free' ? '현재 플랜' : '선택하기'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
};