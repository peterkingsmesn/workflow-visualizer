const express = require('express');
const { authenticate } = require('./auth');
const { validateInput, validations } = require('../middleware/security');
const { body } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// 💰 업데이트된 가격 정책: $9.9/월
const PRICE_CONFIG = {
  FREE: {
    amount: 0,
    maxFiles: 10,
    features: {
      maxProjects: 1,
      maxFilesPerProject: 10,
      hasAdvancedFeatures: false,
      hasCollaboration: false,
      hasExport: true,
      maxDevices: 1
    }
  },
  PRO: {
    priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY, // $9.9/월
    amount: 990, // $9.90 (센트 단위)
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: -1, // 무제한
      maxFilesPerProject: -1, // 무제한
      hasAdvancedFeatures: true,
      hasCollaboration: true,
      hasExport: true,
      maxDevices: 3
    }
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY, // $49/월
    amount: 4900, // $49.00
    currency: 'usd',
    interval: 'month',
    features: {
      maxProjects: -1,
      maxFilesPerProject: -1,
      hasAdvancedFeatures: true,
      hasCollaboration: true,
      hasExport: true,
      hasTeamManagement: true,
      hasOnPremise: true,
      maxDevices: -1 // 무제한
    }
  }
};

// 💰 실제 Stripe 체크아웃 세션 생성 ($9.9/월 PRO 플랜)
router.post('/create-checkout-session', authenticate, validateInput([
  validations.planType
]), async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    if (!planType || !['PRO', 'ENTERPRISE'].includes(planType)) {
      return res.status(400).json({ message: '유효하지 않은 플랜 타입입니다.' });
    }

    const planConfig = PRICE_CONFIG[planType];
    if (!planConfig.priceId) {
      return res.status(400).json({ message: '해당 플랜을 사용할 수 없습니다.' });
    }

    // 💰 Stripe 체크아웃 세션 생성
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: planConfig.priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing/cancel`,
      customer_email: req.user.email,
      metadata: {
        userId: userId,
        planType: planType
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType
        }
      }
    });

    res.json({ 
      sessionId: session.id,
      redirectUrl: session.url
    });
  } catch (error) {
    console.error('체크아웃 세션 생성 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 실제 구독 취소 (Stripe 연동)
router.post('/cancel-subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 사용자의 현재 구독 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user?.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ message: '활성 구독이 없습니다.' });
    }

    // Stripe에서 구독 취소
    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // 데이터베이스 업데이트
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'cancel_at_period_end',
        canceledAt: new Date()
      }
    });

    res.json({ message: '구독이 현재 기간 종료 시 취소됩니다.' });
  } catch (error) {
    console.error('구독 취소 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 실제 구독 상태 확인 (DB 연동)
router.get('/subscription-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    const subscription = user?.subscription;
    
    res.json({
      plan: subscription?.plan || 'FREE',
      status: subscription?.status || 'active',
      expires: subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscription?.status === 'cancel_at_period_end'
    });
  } catch (error) {
    console.error('구독 상태 확인 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 실제 구독 정보 확인 (업데이트된 가격 정책 반영)
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    const planType = user?.subscription?.plan || 'FREE';
    const planConfig = PRICE_CONFIG[planType];

    res.json({
      plan: planType,
      status: user?.subscription?.status || 'active',
      features: planConfig.features,
      expires: user?.subscription?.currentPeriodEnd || null,
      amount: planConfig.amount,
      currency: planConfig.currency || 'usd'
    });
  } catch (error) {
    console.error('구독 정보 확인 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 데스크톱 라이선스 키 생성 (PRO/ENTERPRISE 구독자용)
router.post('/generate-license-key', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    const planType = user?.subscription?.plan;
    if (!planType || planType === 'FREE') {
      return res.status(403).json({ 
        message: '데스크톱 라이선스는 PRO 또는 ENTERPRISE 구독자만 사용할 수 있습니다.' 
      });
    }

    // 라이선스 키 생성 (WV2024-XXXXX-XXXXX-XXXXX-XXXXX 형식)
    const licenseKey = generateLicenseKey(userId, user.subscription.id, planType);
    
    // 라이선스 키 DB 저장
    await prisma.licenseKey.create({
      data: {
        key: licenseKey,
        userId,
        subscriptionId: user.subscription.id,
        planType,
        status: 'active',
        expiresAt: user.subscription.currentPeriodEnd
      }
    });

    res.json({
      licenseKey,
      planType,
      expiresAt: user.subscription.currentPeriodEnd,
      maxDevices: PRICE_CONFIG[planType].features.maxDevices
    });
  } catch (error) {
    console.error('라이선스 키 생성 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 데스크톱 라이선스 검증 (EXE 앱에서 호출)
router.post('/validate-license', async (req, res) => {
  try {
    const { licenseKey, deviceFingerprint, platform, appVersion } = req.body;

    if (!licenseKey || !deviceFingerprint) {
      return res.status(400).json({ 
        valid: false, 
        reason: 'MISSING_PARAMETERS' 
      });
    }

    // 라이선스 키 검증
    const license = await prisma.licenseKey.findUnique({
      where: { key: licenseKey },
      include: { 
        user: true,
        subscription: true,
        devices: true
      }
    });

    if (!license || license.status !== 'active') {
      return res.status(400).json({ 
        valid: false, 
        reason: 'INVALID_LICENSE' 
      });
    }

    // 구독 만료 확인
    if (license.subscription.currentPeriodEnd < new Date()) {
      return res.status(400).json({ 
        valid: false, 
        reason: 'SUBSCRIPTION_EXPIRED' 
      });
    }

    // 디바이스 제한 확인
    const maxDevices = PRICE_CONFIG[license.planType].features.maxDevices;
    const activeDevices = license.devices.filter(d => d.isActive);
    
    const existingDevice = activeDevices.find(d => d.fingerprint === deviceFingerprint);
    
    if (!existingDevice && activeDevices.length >= maxDevices && maxDevices !== -1) {
      return res.status(400).json({ 
        valid: false, 
        reason: 'DEVICE_LIMIT_EXCEEDED',
        maxDevices 
      });
    }

    // 디바이스 등록 또는 업데이트
    if (!existingDevice) {
      await prisma.device.create({
        data: {
          licenseKeyId: license.id,
          fingerprint: deviceFingerprint,
          platform,
          appVersion,
          isActive: true,
          lastActiveAt: new Date()
        }
      });
    } else {
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          lastActiveAt: new Date(),
          appVersion
        }
      });
    }

    res.json({
      valid: true,
      data: {
        planType: license.planType,
        validUntil: license.subscription.currentPeriodEnd,
        maxDevices,
        features: PRICE_CONFIG[license.planType].features
      }
    });
  } catch (error) {
    console.error('라이선스 검증 오류:', error);
    res.status(500).json({ 
      valid: false, 
      reason: 'VALIDATION_ERROR' 
    });
  }
});

// 💰 헬퍼 함수: 라이선스 키 생성
function generateLicenseKey(userId, subscriptionId, planType) {
  const crypto = require('crypto');
  
  const productCode = 'WV2024';
  const userHash = crypto.createHash('md5').update(userId.toString()).digest('hex').substring(0, 5).toUpperCase();
  const planHash = crypto.createHash('md5').update(planType + subscriptionId).digest('hex').substring(0, 5).toUpperCase();
  const deviceInfo = planType === 'PRO' ? '3DEVS' : 'UNLIM';
  const checksum = crypto.createHash('md5').update(productCode + userHash + planHash + deviceInfo).digest('hex').substring(0, 5).toUpperCase();
  
  return `${productCode}-${userHash}-${planHash}-${deviceInfo}-${checksum}`;
}

module.exports = router;