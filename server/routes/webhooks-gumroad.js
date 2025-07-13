const express = require('express');
const { prisma } = require('../db');

const router = express.Router();

// 💰 Gumroad 웹훅 처리 (구독 상태 변경)
router.post('/gumroad', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookData = JSON.parse(req.body.toString());
    
    console.log('Gumroad 웹훅 수신:', webhookData);

    // 💰 웹훅 타입별 처리
    switch (webhookData.type) {
      case 'sale':
        await handleGumroadSale(webhookData);
        break;
        
      case 'refund':
        await handleGumroadRefund(webhookData);
        break;
        
      case 'dispute':
        await handleGumroadDispute(webhookData);
        break;
        
      case 'subscription_updated':
        await handleGumroadSubscriptionUpdate(webhookData);
        break;
        
      default:
        console.log(`처리되지 않은 Gumroad 웹훅 타입: ${webhookData.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Gumroad 웹훅 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 💰 Gumroad 판매 완료 처리 (첫 결제 또는 월 자동결제)
async function handleGumroadSale(webhookData) {
  const sale = webhookData.sale;
  const email = sale.email;
  const saleId = sale.id;
  const productId = sale.product_id;
  const isSubscription = sale.subscription_id !== null;
  const amount = sale.price;

  console.log('Gumroad 판매 처리:', { email, saleId, isSubscription, amount });

  try {
    // 이메일로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      console.warn('Gumroad 웹훅: 사용자를 찾을 수 없음:', email);
      return;
    }

    // 구독 정보 업데이트 또는 생성
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: 'PRO',
        status: 'ACTIVE', // 결제 완료로 상태 변경
        gumroadSaleId: saleId,
        gumroadSubscriptionId: sale.subscription_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        lastPaymentAt: new Date(),
        metadata: {
          provider: 'gumroad',
          lastSaleId: saleId,
          amount: amount
        }
      },
      create: {
        userId: user.id,
        plan: 'PRO',
        status: 'ACTIVE',
        gumroadSaleId: saleId,
        gumroadSubscriptionId: sale.subscription_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastPaymentAt: new Date(),
        metadata: {
          provider: 'gumroad',
          lastSaleId: saleId,
          amount: amount
        }
      }
    });

    // 💰 기존 라이선스 키가 있다면 재활성화, 없다면 새로 생성
    const existingLicense = await prisma.licenseKey.findFirst({
      where: { userId: user.id }
    });

    if (existingLicense) {
      // 기존 라이선스 키 재활성화
      await prisma.licenseKey.update({
        where: { id: existingLicense.id },
        data: {
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    } else {
      // 새 라이선스 키 자동 생성
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id }
      });
      
      const licenseKey = generateLicenseKey(user.id, subscription.id, 'PRO');
      
      await prisma.licenseKey.create({
        data: {
          key: licenseKey,
          userId: user.id,
          subscriptionId: subscription.id,
          planType: 'PRO',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      console.log('새 라이선스 키 생성:', licenseKey);
    }

    console.log(`Gumroad 구독 활성화 완료: 사용자 ${user.id}, 판매 ID ${saleId}`);

  } catch (error) {
    console.error('Gumroad 판매 처리 오류:', error);
    throw error;
  }
}

// 💰 Gumroad 환불 처리
async function handleGumroadRefund(webhookData) {
  const refund = webhookData.refund;
  const saleId = refund.sale_id;

  console.log('Gumroad 환불 처리:', { saleId });

  try {
    // 해당 판매 ID로 구독 찾기
    const subscription = await prisma.subscription.findFirst({
      where: { gumroadSaleId: saleId }
    });

    if (!subscription) {
      console.warn('환불 처리: 구독을 찾을 수 없음:', saleId);
      return;
    }

    // 구독 취소 처리
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        plan: 'FREE'
      }
    });

    // 라이선스 키 비활성화
    await prisma.licenseKey.updateMany({
      where: { subscriptionId: subscription.id },
      data: { status: 'inactive' }
    });

    console.log(`Gumroad 환불 처리 완료: 구독 ${subscription.id} 취소`);

  } catch (error) {
    console.error('Gumroad 환불 처리 오류:', error);
    throw error;
  }
}

// 💰 Gumroad 분쟁 처리
async function handleGumroadDispute(webhookData) {
  const dispute = webhookData.dispute;
  const saleId = dispute.sale_id;

  console.log('Gumroad 분쟁 처리:', { saleId });

  try {
    // 해당 판매 ID로 구독 찾기
    const subscription = await prisma.subscription.findFirst({
      where: { gumroadSaleId: saleId }
    });

    if (!subscription) {
      console.warn('분쟁 처리: 구독을 찾을 수 없음:', saleId);
      return;
    }

    // 구독 일시 정지
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE' // 분쟁 중에는 연체 상태로 처리
      }
    });

    console.log(`Gumroad 분쟁 처리 완료: 구독 ${subscription.id} 일시 정지`);

  } catch (error) {
    console.error('Gumroad 분쟁 처리 오류:', error);
    throw error;
  }
}

// 💰 Gumroad 구독 업데이트 처리
async function handleGumroadSubscriptionUpdate(webhookData) {
  const subscription = webhookData.subscription;
  const subscriptionId = subscription.id;

  console.log('Gumroad 구독 업데이트:', { subscriptionId });

  try {
    // 해당 구독 ID로 구독 찾기
    const existingSubscription = await prisma.subscription.findFirst({
      where: { gumroadSubscriptionId: subscriptionId }
    });

    if (!existingSubscription) {
      console.warn('구독 업데이트: 구독을 찾을 수 없음:', subscriptionId);
      return;
    }

    // 구독 상태 업데이트
    let newStatus = 'ACTIVE';
    if (subscription.cancelled_at) {
      newStatus = 'CANCELED';
    } else if (subscription.paused_at) {
      newStatus = 'PAST_DUE';
    }

    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: newStatus,
        ...(subscription.cancelled_at && { canceledAt: new Date(subscription.cancelled_at) })
      }
    });

    // 라이선스 키 상태도 함께 업데이트
    const licenseStatus = newStatus === 'ACTIVE' ? 'active' : 'inactive';
    await prisma.licenseKey.updateMany({
      where: { subscriptionId: existingSubscription.id },
      data: { status: licenseStatus }
    });

    console.log(`Gumroad 구독 업데이트 완료: ${subscriptionId} → ${newStatus}`);

  } catch (error) {
    console.error('Gumroad 구독 업데이트 오류:', error);
    throw error;
  }
}

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