const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { prisma } = require('../db');

const router = express.Router();

// 💰 Stripe 웹훅 처리 (구독 상태 변경)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('웹훅 서명 검증 실패:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 💰 구독 관련 이벤트 처리
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`처리되지 않은 이벤트 타입: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 💰 체크아웃 세션 완료 처리
async function handleCheckoutSessionCompleted(session) {
  const { metadata } = session;
  const userId = metadata.userId;
  const planType = metadata.planType;

  if (!userId || !planType) {
    console.error('체크아웃 세션에 필수 메타데이터가 없습니다:', session.id);
    return;
  }

  // Stripe에서 구독 정보 조회
  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

  // 사용자 구독 정보 생성 또는 업데이트
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan: planType,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
    },
    create: {
      userId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan: planType,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
    }
  });

  console.log(`구독 생성 완료: 사용자 ${userId}, 플랜 ${planType}`);
}

// 💰 구독 생성 처리
async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata.userId;
  const planType = subscription.metadata.planType;

  if (!userId) {
    console.error('구독에 사용자 ID가 없습니다:', subscription.id);
    return;
  }

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      plan: planType || 'PRO',
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      plan: planType || 'PRO',
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  });

  console.log(`구독 업데이트: 사용자 ${userId}, 상태 ${subscription.status}`);
}

// 💰 구독 업데이트 처리
async function handleSubscriptionUpdated(subscription) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!existingSubscription) {
    console.error('업데이트할 구독을 찾을 수 없습니다:', subscription.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    }
  });

  // 💰 구독 취소 시 라이선스 키 비활성화
  if (subscription.status === 'canceled') {
    await prisma.licenseKey.updateMany({
      where: { subscriptionId: existingSubscription.id },
      data: { status: 'inactive' }
    });
  }

  console.log(`구독 업데이트: ${subscription.id}, 상태 ${subscription.status}`);
}

// 💰 구독 삭제 처리
async function handleSubscriptionDeleted(subscription) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (!existingSubscription) {
    console.error('삭제할 구독을 찾을 수 없습니다:', subscription.id);
    return;
  }

  // 구독을 FREE 플랜으로 변경
  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      plan: 'FREE',
      status: 'canceled',
      canceledAt: new Date()
    }
  });

  // 💰 모든 라이선스 키 비활성화
  await prisma.licenseKey.updateMany({
    where: { subscriptionId: existingSubscription.id },
    data: { status: 'inactive' }
  });

  console.log(`구독 삭제: ${subscription.id}`);
}

// 💰 결제 성공 처리
async function handlePaymentSucceeded(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (existingSubscription) {
    // 결제 성공 시 구독 기간 갱신
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'active',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        lastPaymentAt: new Date()
      }
    });

    // 💰 라이선스 키 재활성화
    await prisma.licenseKey.updateMany({
      where: { 
        subscriptionId: existingSubscription.id,
        status: 'inactive'
      },
      data: { 
        status: 'active',
        expiresAt: new Date(subscription.current_period_end * 1000)
      }
    });

    console.log(`결제 성공: 구독 ${subscription.id} 갱신`);
  }
}

// 💰 결제 실패 처리
async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id }
  });

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        status: 'past_due'
      }
    });

    console.log(`결제 실패: 구독 ${subscription.id} 연체 상태`);
  }
}

module.exports = router;