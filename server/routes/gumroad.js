// 🛒 Gumroad 웹훅 및 라이센스 관리 라우트
const express = require('express');
const crypto = require('crypto');
const LicenseKeyGenerator = require('../../desktop/src/utils/licenseKeyGenerator');
const router = express.Router();

// 🔑 Gumroad 설정
const GUMROAD_WEBHOOK_SECRET = process.env.GUMROAD_WEBHOOK_SECRET || 'your-webhook-secret';
const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID || 'your-product-id';

// 라이센스 키 생성기
const licenseGenerator = new LicenseKeyGenerator();

// 🎯 Gumroad 웹훅 처리
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // 웹훅 서명 검증
    const signature = req.headers['x-gumroad-signature'];
    const isValid = verifyGumroadSignature(req.body, signature);
    
    if (!isValid) {
      console.error('Invalid Gumroad webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    console.log('Gumroad webhook received:', event.type);

    switch (event.type) {
      case 'sale':
        await handleSale(event.data);
        break;
      case 'subscription_created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      case 'refund':
        await handleRefund(event.data);
        break;
      default:
        console.log('Unhandled Gumroad event type:', event.type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Gumroad webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 💰 결제 완료 처리
async function handleSale(saleData) {
  try {
    const { 
      order_id, 
      product_id, 
      purchaser_email, 
      product_name,
      price,
      currency,
      sale_timestamp 
    } = saleData;

    console.log(`New sale: ${order_id} for ${purchaser_email}`);

    // 라이센스 키 생성
    const licenseKey = licenseGenerator.generateLicenseKey(
      purchaser_email, 
      'monthly' // 기본 월간 플랜
    );

    // 라이센스 정보 저장 (데이터베이스에)
    const licenseData = {
      licenseKey,
      email: purchaser_email,
      orderId: order_id,
      productId: product_id,
      plan: 'monthly',
      status: 'active',
      createdAt: new Date(sale_timestamp),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
      price,
      currency
    };

    // TODO: 데이터베이스에 저장
    await saveLicenseToDatabase(licenseData);

    // 구매자에게 라이센스 키 이메일 발송
    await sendLicenseEmail(purchaser_email, licenseKey, licenseData);

    console.log(`License generated for ${purchaser_email}: ${licenseKey}`);
  } catch (error) {
    console.error('Error handling sale:', error);
    throw error;
  }
}

// 🔄 구독 생성 처리
async function handleSubscriptionCreated(subscriptionData) {
  try {
    const { 
      subscription_id, 
      product_id, 
      user_email, 
      user_id,
      status,
      created_at,
      subscription_plan 
    } = subscriptionData;

    console.log(`New subscription: ${subscription_id} for ${user_email}`);

    // 라이센스 키 생성
    const licenseKey = licenseGenerator.generateLicenseKey(
      user_email, 
      subscription_plan || 'monthly'
    );

    // 구독 정보 저장
    const subscriptionInfo = {
      subscriptionId: subscription_id,
      licenseKey,
      email: user_email,
      userId: user_id,
      productId: product_id,
      plan: subscription_plan || 'monthly',
      status,
      createdAt: new Date(created_at),
      nextBillingDate: calculateNextBillingDate(subscription_plan)
    };

    await saveSubscriptionToDatabase(subscriptionInfo);
    await sendLicenseEmail(user_email, licenseKey, subscriptionInfo);

    console.log(`Subscription license generated for ${user_email}: ${licenseKey}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
    throw error;
  }
}

// 📝 구독 업데이트 처리
async function handleSubscriptionUpdated(subscriptionData) {
  try {
    const { subscription_id, status, user_email } = subscriptionData;
    
    console.log(`Subscription updated: ${subscription_id}, status: ${status}`);

    // 구독 상태에 따라 라이센스 활성화/비활성화
    await updateSubscriptionStatus(subscription_id, status);

    if (status === 'active') {
      // 구독 재활성화시 라이센스 갱신
      await renewLicenseForSubscription(subscription_id);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

// ❌ 구독 취소 처리
async function handleSubscriptionCancelled(subscriptionData) {
  try {
    const { subscription_id, user_email, cancelled_at } = subscriptionData;
    
    console.log(`Subscription cancelled: ${subscription_id} for ${user_email}`);

    // 구독 취소 처리 (유예 기간 부여)
    await cancelSubscription(subscription_id, cancelled_at);
    
    // 취소 안내 이메일 발송
    await sendCancellationEmail(user_email, subscriptionData);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

// 💸 환불 처리
async function handleRefund(refundData) {
  try {
    const { order_id, refund_amount, user_email } = refundData;
    
    console.log(`Refund processed: ${order_id} for ${user_email}`);

    // 해당 주문의 라이센스 비활성화
    await deactivateLicenseByOrderId(order_id);
    
    // 환불 안내 이메일 발송
    await sendRefundEmail(user_email, refundData);
  } catch (error) {
    console.error('Error handling refund:', error);
    throw error;
  }
}

// 🔏 Gumroad 서명 검증
function verifyGumroadSignature(payload, signature) {
  if (!signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', GUMROAD_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// 📧 라이센스 이메일 발송
async function sendLicenseEmail(email, licenseKey, licenseData) {
  // TODO: 실제 이메일 서비스 연동 (SendGrid, Nodemailer 등)
  console.log(`Sending license email to ${email}`);
  console.log(`License Key: ${licenseKey}`);
  
  // 이메일 템플릿
  const emailContent = {
    to: email,
    subject: '🚀 Workflow Visualizer 라이센스 키',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Workflow Visualizer 구매해주셔서 감사합니다!</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>📋 라이센스 정보</h3>
          <p><strong>라이센스 키:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${licenseKey}</code></p>
          <p><strong>플랜:</strong> ${licenseData.plan}</p>
          <p><strong>유효기간:</strong> ${licenseData.expiresAt ? new Date(licenseData.expiresAt).toLocaleDateString() : '무제한'}</p>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🚀 설치 방법</h3>
          <ol>
            <li><a href="https://halowf.com/download">여기서 Workflow Visualizer</a>를 다운로드하세요</li>
            <li>프로그램을 설치하고 실행하세요</li>
            <li>라이센스 키를 입력하세요: <strong>${licenseKey}</strong></li>
            <li>모든 기능을 이용하세요!</li>
          </ol>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>💡 주요 기능</h3>
          <ul>
            <li>✅ 무제한 프로젝트 분석</li>
            <li>✅ 무제한 파일 크기</li>
            <li>✅ 모든 AI 분석 기능</li>
            <li>✅ 로컬 설치 및 사용</li>
            <li>✅ 업데이트 및 기술 지원</li>
          </ul>
        </div>

        <p>문제가 있으시면 <a href="mailto:support@halowf.com">support@halowf.com</a>으로 연락주세요.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6c757d; font-size: 14px;">
          © 2025 Workflow Visualizer. All rights reserved.
        </p>
      </div>
    `
  };

  // TODO: 실제 이메일 발송 구현
  return emailContent;
}

// 📅 다음 결제일 계산
function calculateNextBillingDate(plan) {
  const now = new Date();
  switch (plan) {
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'yearly':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}

// 💾 데이터베이스 저장 함수들 (구현 필요)
async function saveLicenseToDatabase(licenseData) {
  // TODO: Prisma 또는 다른 ORM으로 구현
  console.log('Saving license to database:', licenseData);
}

async function saveSubscriptionToDatabase(subscriptionInfo) {
  // TODO: 구독 정보 저장
  console.log('Saving subscription to database:', subscriptionInfo);
}

async function updateSubscriptionStatus(subscriptionId, status) {
  // TODO: 구독 상태 업데이트
  console.log(`Updating subscription ${subscriptionId} to ${status}`);
}

async function renewLicenseForSubscription(subscriptionId) {
  // TODO: 구독 라이센스 갱신
  console.log(`Renewing license for subscription ${subscriptionId}`);
}

async function cancelSubscription(subscriptionId, cancelledAt) {
  // TODO: 구독 취소 처리
  console.log(`Cancelling subscription ${subscriptionId} at ${cancelledAt}`);
}

async function deactivateLicenseByOrderId(orderId) {
  // TODO: 주문 ID로 라이센스 비활성화
  console.log(`Deactivating license for order ${orderId}`);
}

async function sendCancellationEmail(email, data) {
  // TODO: 취소 이메일 발송
  console.log(`Sending cancellation email to ${email}`);
}

async function sendRefundEmail(email, data) {
  // TODO: 환불 이메일 발송
  console.log(`Sending refund email to ${email}`);
}

// 🎯 라이센스 검증 API
router.post('/validate', async (req, res) => {
  try {
    const { licenseKey, machineId } = req.body;

    if (!licenseKey || !machineId) {
      return res.status(400).json({ 
        valid: false, 
        error: 'License key and machine ID are required' 
      });
    }

    // TODO: 데이터베이스에서 라이센스 확인
    const licenseRecord = await findLicenseInDatabase(licenseKey);
    
    if (!licenseRecord) {
      return res.status(404).json({ 
        valid: false, 
        error: 'License not found' 
      });
    }

    // 라이센스 상태 확인
    if (licenseRecord.status !== 'active') {
      return res.status(403).json({ 
        valid: false, 
        error: 'License is not active' 
      });
    }

    // 만료일 확인
    if (licenseRecord.expiresAt && new Date() > new Date(licenseRecord.expiresAt)) {
      return res.status(403).json({ 
        valid: false, 
        error: 'License expired' 
      });
    }

    // 기기 바인딩 확인/업데이트
    if (!licenseRecord.machineId) {
      // 첫 번째 활성화
      await bindLicenseToMachine(licenseKey, machineId);
    } else if (licenseRecord.machineId !== machineId) {
      // 다른 기기에서 사용 시도
      return res.status(403).json({ 
        valid: false, 
        error: 'License is bound to another device' 
      });
    }

    // 마지막 검증 시간 업데이트
    await updateLastValidated(licenseKey);

    res.json({
      valid: true,
      license: {
        plan: licenseRecord.plan,
        expiresAt: licenseRecord.expiresAt,
        email: licenseRecord.email
      }
    });
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Validation error' 
    });
  }
});

// 📊 라이센스 상태 조회
router.get('/status/:licenseKey', async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const licenseRecord = await findLicenseInDatabase(licenseKey);
    
    if (!licenseRecord) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({
      status: licenseRecord.status,
      plan: licenseRecord.plan,
      expiresAt: licenseRecord.expiresAt,
      lastValidated: licenseRecord.lastValidated,
      machineId: licenseRecord.machineId ? 'bound' : 'unbound'
    });
  } catch (error) {
    console.error('License status error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// 📋 임시 데이터베이스 함수들
async function findLicenseInDatabase(licenseKey) {
  // TODO: 실제 데이터베이스 조회
  console.log(`Finding license in database: ${licenseKey}`);
  return null;
}

async function bindLicenseToMachine(licenseKey, machineId) {
  // TODO: 기기 바인딩
  console.log(`Binding license ${licenseKey} to machine ${machineId}`);
}

async function updateLastValidated(licenseKey) {
  // TODO: 마지막 검증 시간 업데이트
  console.log(`Updating last validated for ${licenseKey}`);
}

module.exports = router;