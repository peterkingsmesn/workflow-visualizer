import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    period: string;
    features: string[];
    cta: string;
    popular?: boolean;
  };
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
  currentPlan?: string;
  onUpgrade?: (planType: string) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ 
  plan, 
  planType, 
  currentPlan,
  onUpgrade 
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isCurrentPlan = currentPlan === planType;
  const isFreePlan = planType === 'FREE';
  const isEnterprisePlan = planType === 'ENTERPRISE';

  const handleUpgrade = async () => {
    if (isCurrentPlan || isFreePlan) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (isEnterprisePlan) {
        // 엔터프라이즈는 영업팀 연결
        window.location.href = 'mailto:sales@workflowvisualizer.com?subject=Enterprise%20Plan%20Inquiry';
        return;
      }

      // JWT 토큰 가져오기
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }

      // 체크아웃 세션 생성
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Stripe 체크아웃으로 리다이렉트
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.message || 'Failed to start upgrade process');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return t('billing.currentPlan');
    if (isFreePlan) return t('billing.freePlan');
    if (isEnterprisePlan) return t('billing.contactSales');
    return plan.cta;
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return 'bg-gray-100 text-gray-500 cursor-not-allowed';
    }
    if (plan.popular) {
      return 'bg-blue-600 text-white hover:bg-blue-700';
    }
    return 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50';
  };

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {t('pricing.pro.popular')}
          </span>
        </div>
      )}
      
      <div className="p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name}
          </h3>
          <div className="mb-6">
            <span className="text-4xl font-bold text-gray-900">
              {plan.price}
            </span>
            <span className="text-gray-600 ml-2">
              {plan.period}
            </span>
          </div>
        </div>

        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={isLoading || isCurrentPlan || isFreePlan}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            getButtonStyle()
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('billing.processing')}
            </span>
          ) : (
            getButtonText()
          )}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;