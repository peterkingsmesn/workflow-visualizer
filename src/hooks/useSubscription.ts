import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  id: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

interface SubscriptionLimits {
  maxProjects: number;
  maxFileSize: number;
  maxTeamMembers: number;
  hasAdvancedFeatures: boolean;
  hasApiAccess: boolean;
  hasCustomBranding: boolean;
}

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  FREE: {
    maxProjects: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTeamMembers: 1,
    hasAdvancedFeatures: false,
    hasApiAccess: false,
    hasCustomBranding: false
  },
  PRO: {
    maxProjects: -1, // unlimited
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxTeamMembers: 5,
    hasAdvancedFeatures: true,
    hasApiAccess: true,
    hasCustomBranding: false
  },
  ENTERPRISE: {
    maxProjects: -1,
    maxFileSize: -1, // unlimited
    maxTeamMembers: -1,
    hasAdvancedFeatures: true,
    hasApiAccess: true,
    hasCustomBranding: true
  }
};

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/billing/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else if (response.status === 401) {
        // 인증 실패 - 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        navigate('/auth/login');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = (feature: keyof SubscriptionLimits): boolean => {
    if (!subscription) return false;
    
    const limits = PLAN_LIMITS[subscription.plan];
    const value = limits[feature];
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    return true; // 숫자 제한은 별도로 체크
  };

  const checkLimit = (feature: keyof SubscriptionLimits, currentValue: number): boolean => {
    if (!subscription) return false;
    
    const limits = PLAN_LIMITS[subscription.plan];
    const limit = limits[feature];
    
    if (typeof limit === 'number') {
      return limit === -1 || currentValue < limit;
    }
    
    return true;
  };

  const isActive = (): boolean => {
    return subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
  };

  const canAccessDashboard = (): boolean => {
    // FREE 플랜도 대시보드 접근 가능
    return isActive();
  };

  const canAccessPremiumFeatures = (): boolean => {
    return isActive() && (subscription?.plan === 'PRO' || subscription?.plan === 'ENTERPRISE');
  };

  const getLimits = (): SubscriptionLimits => {
    if (!subscription) {
      return PLAN_LIMITS.FREE;
    }
    return PLAN_LIMITS[subscription.plan];
  };

  return {
    subscription,
    loading,
    error,
    checkAccess,
    checkLimit,
    isActive,
    canAccessDashboard,
    canAccessPremiumFeatures,
    getLimits,
    refetch: fetchSubscription
  };
};