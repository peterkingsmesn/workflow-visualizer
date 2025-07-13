const express = require('express');
const { authenticate } = require('./auth');
const { validateInput, validations } = require('../middleware/security');
const { body } = require('express-validator');

const router = express.Router();

// 💰 Gumroad 월 구독 시스템 ($9.9/월)
const GUMROAD_CONFIG = {
  API_BASE: 'https://api.gumroad.com/v2',
  ACCESS_TOKEN: process.env.GUMROAD_ACCESS_TOKEN,
  PRODUCT_ID: process.env.GUMROAD_PRODUCT_ID || 'workflow-visualizer-pro',
  
  PLANS: {
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
      amount: 990, // $9.90
      currency: 'usd',
      features: {
        maxProjects: -1, // 무제한
        maxFilesPerProject: -1, // 무제한
        hasAdvancedFeatures: true,
        hasCollaboration: true,
        hasExport: true,
        maxDevices: 3
      }
    }
  }
};

// 💰 Gumroad 구독 생성
router.post('/create-gumroad-subscription', authenticate, validateInput([
  body('planType').isIn(['PRO']).withMessage('PRO 플랜만 지원됩니다')
]), async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (planType !== 'PRO') {
      return res.status(400).json({ message: 'PRO 플랜만 구독 가능합니다.' });
    }

    // 💰 Gumroad API로 구독 생성
    const subscriptionData = await createGumroadSubscription(userEmail, planType);
    
    // 구독 정보를 데이터베이스에 저장
    await saveGumroadSubscription(userId, subscriptionData);

    res.json({
      success: true,
      checkoutUrl: subscriptionData.short_url,
      message: 'Gumroad 결제 페이지로 이동합니다.'
    });

  } catch (error) {
    console.error('Gumroad 구독 생성 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 실제 Gumroad API 호출
async function createGumroadSubscription(email, planType) {
  const planConfig = GUMROAD_CONFIG.PLANS[planType];
  
  const requestBody = {
    product_id: GUMROAD_CONFIG.PRODUCT_ID,
    email: email,
    price: planConfig.amount, // 990 = $9.90
    subscription: true, // 🔄 월 자동결제 활성화
    quantity: 1
  };

  console.log('Gumroad 구독 요청:', requestBody);

  const response = await fetch(`${GUMROAD_CONFIG.API_BASE}/sales`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GUMROAD_CONFIG.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gumroad API 오류: ${response.status} - ${error}`);
  }

  return await response.json();
}

// 💰 구독 정보 데이터베이스 저장
async function saveGumroadSubscription(userId, gumroadData) {
  try {
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: 'PRO',
        status: 'PENDING', // Gumroad 결제 완료 시 ACTIVE로 변경
        gumroadSaleId: gumroadData.sale_id,
        gumroadSubscriptionId: gumroadData.subscription_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        metadata: {
          provider: 'gumroad',
          checkoutUrl: gumroadData.short_url
        }
      },
      create: {
        userId,
        plan: 'PRO',
        status: 'PENDING',
        gumroadSaleId: gumroadData.sale_id,
        gumroadSubscriptionId: gumroadData.subscription_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          provider: 'gumroad',
          checkoutUrl: gumroadData.short_url
        }
      }
    });

    console.log('Gumroad 구독 정보 저장 완료:', userId);
  } catch (error) {
    console.error('구독 정보 저장 오류:', error);
    throw error;
  }
}

// 💰 구독 상태 확인
router.get('/gumroad-subscription-status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return res.json({
        plan: 'FREE',
        status: 'none',
        features: GUMROAD_CONFIG.PLANS.FREE.features
      });
    }

    // Gumroad API로 최신 상태 확인
    let latestStatus = subscription.status;
    if (subscription.gumroadSaleId) {
      try {
        latestStatus = await checkGumroadSubscriptionStatus(subscription.gumroadSaleId);
      } catch (error) {
        console.warn('Gumroad 상태 확인 실패:', error.message);
      }
    }

    res.json({
      plan: subscription.plan,
      status: latestStatus,
      features: GUMROAD_CONFIG.PLANS[subscription.plan].features,
      expires: subscription.currentPeriodEnd,
      provider: 'gumroad'
    });

  } catch (error) {
    console.error('구독 상태 확인 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 Gumroad에서 구독 상태 확인
async function checkGumroadSubscriptionStatus(saleId) {
  try {
    const response = await fetch(`${GUMROAD_CONFIG.API_BASE}/sales/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${GUMROAD_CONFIG.ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Gumroad API 오류: ${response.status}`);
    }

    const saleData = await response.json();
    
    // Gumroad 상태를 우리 시스템 상태로 변환
    if (saleData.sale.refunded) {
      return 'CANCELED';
    } else if (saleData.sale.disputed) {
      return 'PAST_DUE';
    } else {
      return 'ACTIVE';
    }
  } catch (error) {
    console.error('Gumroad 상태 확인 오류:', error);
    throw error;
  }
}

// 💰 구독 취소
router.post('/cancel-gumroad-subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription || !subscription.gumroadSubscriptionId) {
      return res.status(400).json({ message: '활성 구독이 없습니다.' });
    }

    // Gumroad는 API로 구독 취소가 제한적이므로 상태만 변경
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date()
      }
    });

    res.json({ 
      message: 'Gumroad 대시보드에서 구독을 취소해주세요.',
      gumroadUrl: 'https://gumroad.com/library'
    });

  } catch (error) {
    console.error('구독 취소 오류:', error);
    res.status(500).json({ message: error.message });
  }
});

// 💰 데스크톱 라이선스 키 생성 (Gumroad 구독자용)
router.post('/generate-gumroad-license-key', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    if (!subscription || subscription.plan === 'FREE' || subscription.status !== 'ACTIVE') {
      return res.status(403).json({ 
        message: '활성 PRO 구독이 필요합니다.' 
      });
    }

    // 라이선스 키 생성
    const licenseKey = generateLicenseKey(userId, subscription.id, subscription.plan);
    
    // 라이선스 키 DB 저장
    await prisma.licenseKey.create({
      data: {
        key: licenseKey,
        userId,
        subscriptionId: subscription.id,
        planType: subscription.plan,
        status: 'active',
        expiresAt: subscription.currentPeriodEnd
      }
    });

    res.json({
      licenseKey,
      planType: subscription.plan,
      expiresAt: subscription.currentPeriodEnd,
      maxDevices: GUMROAD_CONFIG.PLANS[subscription.plan].features.maxDevices
    });

  } catch (error) {
    console.error('라이선스 키 생성 오류:', error);
    res.status(500).json({ message: error.message });
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

// 💰 데스크톱 앱 라이센스 검증 API
router.post('/validate-license', async (req, res) => {
  try {
    const { licenseKey, deviceFingerprint, platform, arch, hostname } = req.body;

    // 라이센스 키 형식 검증
    if (!validateLicenseKeyFormat(licenseKey)) {
      return res.status(400).json({ 
        valid: false, 
        reason: 'INVALID_FORMAT' 
      });
    }

    // 라이센스 키로 구독 정보 찾기
    const licenseRecord = await prisma.licenseKey.findFirst({
      where: { 
        key: licenseKey,
        status: 'active'
      },
      include: {
        subscription: true,
        user: true
      }
    });

    if (!licenseRecord) {
      return res.status(404).json({ 
        valid: false, 
        reason: 'INVALID_LICENSE' 
      });
    }

    // 구독 상태 확인
    if (licenseRecord.subscription.status !== 'ACTIVE') {
      return res.status(403).json({ 
        valid: false, 
        reason: 'SUBSCRIPTION_EXPIRED' 
      });
    }

    // 구독 만료일 확인
    if (new Date() > licenseRecord.subscription.currentPeriodEnd) {
      return res.status(403).json({ 
        valid: false, 
        reason: 'SUBSCRIPTION_EXPIRED' 
      });
    }

    // 디바이스 등록/확인
    const deviceRecord = await registerOrUpdateDevice(
      licenseRecord.userId, 
      deviceFingerprint, 
      platform, 
      arch, 
      hostname
    );

    if (!deviceRecord.success) {
      return res.status(403).json({ 
        valid: false, 
        reason: deviceRecord.reason 
      });
    }

    // 성공 응답
    res.json({
      valid: true,
      data: {
        planType: licenseRecord.planType,
        validUntil: licenseRecord.subscription.currentPeriodEnd,
        maxDevices: GUMROAD_CONFIG.PLANS[licenseRecord.planType].features.maxDevices,
        features: GUMROAD_CONFIG.PLANS[licenseRecord.planType].features,
        deviceCount: deviceRecord.deviceCount
      }
    });

  } catch (error) {
    console.error('라이센스 검증 오류:', error);
    res.status(500).json({ 
      valid: false, 
      reason: 'VALIDATION_ERROR' 
    });
  }
});

// 💰 라이센스 키 형식 검증
function validateLicenseKeyFormat(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return false;
  }
  const keyPattern = /^WV2024-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  return keyPattern.test(licenseKey);
}

// 💰 디바이스 등록/업데이트
async function registerOrUpdateDevice(userId, deviceFingerprint, platform, arch, hostname) {
  try {
    // 라이센스 키 찾기
    const licenseRecord = await prisma.licenseKey.findFirst({
      where: { userId }
    });

    if (!licenseRecord) {
      return { 
        success: false, 
        reason: 'NO_LICENSE_KEY' 
      };
    }

    // 기존 디바이스 확인
    const existingDevice = await prisma.device.findFirst({
      where: { 
        licenseKeyId: licenseRecord.id,
        fingerprint: deviceFingerprint 
      }
    });

    if (existingDevice) {
      // 기존 디바이스 업데이트
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          lastActiveAt: new Date(),
          platform,
          deviceName: hostname
        }
      });
    } else {
      // 디바이스 제한 확인
      const deviceCount = await prisma.device.count({
        where: { 
          licenseKeyId: licenseRecord.id,
          isActive: true 
        }
      });

      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      const maxDevices = GUMROAD_CONFIG.PLANS[subscription.plan].features.maxDevices;
      
      if (deviceCount >= maxDevices) {
        return { 
          success: false, 
          reason: 'DEVICE_LIMIT_EXCEEDED' 
        };
      }

      // 새 디바이스 등록
      await prisma.device.create({
        data: {
          licenseKeyId: licenseRecord.id,
          fingerprint: deviceFingerprint,
          platform,
          deviceName: hostname,
          appVersion: '1.0.0',
          isActive: true,
          registeredAt: new Date(),
          lastActiveAt: new Date()
        }
      });
    }

    const totalDevices = await prisma.device.count({
      where: { 
        licenseKeyId: licenseRecord.id,
        isActive: true 
      }
    });

    return { 
      success: true, 
      deviceCount: totalDevices 
    };

  } catch (error) {
    console.error('디바이스 등록 오류:', error);
    return { 
      success: false, 
      reason: 'DEVICE_REGISTRATION_ERROR' 
    };
  }
}

module.exports = router;