const Stripe = require('stripe');
const prisma = require('./prisma');
const { sendSubscriptionEmail } = require('./email');
const { logger, logError, logInfo, logDebug, logWarn } = require('../utils/logger');

// Stripe 초기화
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

// 가격 정보 (환경 변수로 설정)
const PRICE_CONFIG = {
  PRO: {
    priceId: process.env.STRIPE_PRICE_ID_PRO, // Required from environment
    amount: 2900, // $29.00
    currency: 'usd',
    interval: 'month'
  },
  ENTERPRISE: {
    // 엔터프라이즈는 커스텀 가격으로 처리
    amount: 'custom',
    currency: 'usd',
    interval: 'month'
  }
};

// 결제 세션 생성
const createCheckoutSession = async ({
  userId,
  priceId,
  planType,
  successUrl,
  cancelUrl
}) => {
  try {
    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 이미 활성 구독이 있는지 확인
    if (user.subscription?.status === 'active') {
      throw new Error('이미 활성 구독이 있습니다');
    }

    // Stripe 고객 생성 또는 조회
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id
        }
      });

      // 데이터베이스에 Stripe 고객 ID 저장
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });
    }

    // 체크아웃 세션 생성
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        planType: planType
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true
      }
    });

    return session;
  } catch (error) {
    logError(error, { context: 'Checkout session creation failed' });
    throw error;
  }
};

// 구독 취소
const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    logError(error, { context: 'Subscription cancellation failed', subscriptionId });
    throw error;
  }
};

// 구독 업데이트
const updateSubscription = async (subscriptionId, newPriceId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId
        }
      ],
      proration_behavior: 'create_prorations'
    });

    return updatedSubscription;
  } catch (error) {
    logError(error, { context: 'Subscription update failed', subscriptionId });
    throw error;
  }
};

// 고객 포털 세션 생성
const createCustomerPortalSession = async (customerId, returnUrl) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session;
  } catch (error) {
    logError(error, { context: 'Customer portal session creation failed', customerId });
    throw error;
  }
};

// 웹훅 이벤트 처리
const handleWebhookEvent = async (event) => {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
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
        logDebug(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    logError(error, { context: 'Webhook event processing failed', eventType: event.type });
    throw error;
  }
};

// 체크아웃 완료 처리
const handleCheckoutCompleted = async (session) => {
  const { customer, metadata } = session;
  const userId = metadata.userId;
  const planType = metadata.planType;

  try {
    // 구독 정보 생성
    await prisma.subscription.create({
      data: {
        userId: userId,
        stripeCustomerId: customer,
        stripeSubscriptionId: session.subscription,
        plan: planType.toUpperCase(),
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
      }
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'email',
        title: 'Subscription Activated',
        message: `Your ${planType} subscription has been activated successfully!`
      }
    });

    // 구독 활성화 이메일 전송
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user) {
      await sendSubscriptionEmail(user.email, user.name, {
        plan: planType,
        status: 'active',
        amount: PRICE_CONFIG[planType]?.amount || 0
      });
    }

    logInfo('Subscription activated', { userId, planType });
  } catch (error) {
    logError(error, { context: 'Checkout completion processing failed', userId });
    throw error;
  }
};

// 구독 생성 처리
const handleSubscriptionCreated = async (subscription) => {
  const customerId = subscription.customer;
  
  try {
    // 고객 ID로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      logError(new Error('User not found for subscription'), { customerId });
      return;
    }

    // 구독 정보 업데이트
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        plan: 'PRO', // 기본값, 실제로는 가격 ID에서 판단
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    logInfo('Subscription created', { subscriptionId: subscription.id, userId: user.id });
  } catch (error) {
    logError(error, { context: 'Subscription creation processing failed', subscriptionId: subscription.id });
    throw error;
  }
};

// 구독 업데이트 처리
const handleSubscriptionUpdated = async (subscription) => {
  const customerId = subscription.customer;
  
  try {
    // 고객 ID로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      logError(new Error('User not found for subscription'), { customerId });
      return;
    }

    // 구독 정보 업데이트
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    logInfo('Subscription updated', { subscriptionId: subscription.id, userId: user.id });
  } catch (error) {
    logError(error, { context: 'Subscription update processing failed', subscriptionId: subscription.id });
    throw error;
  }
};

// 구독 삭제 처리
const handleSubscriptionDeleted = async (subscription) => {
  const customerId = subscription.customer;
  
  try {
    // 고객 ID로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      logError(new Error('User not found for subscription'), { customerId });
      return;
    }

    // 구독 상태를 취소됨으로 변경
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: 'canceled',
        canceledAt: new Date()
      }
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'email',
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. You can still access your account until the end of your billing period.'
      }
    });

    // 구독 취소 이메일 전송
    const updatedSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id }
    });
    
    if (updatedSubscription) {
      await sendSubscriptionEmail(user.email, user.name, {
        plan: updatedSubscription.plan,
        status: 'canceled',
        nextBillingDate: updatedSubscription.currentPeriodEnd
      });
    }

    logInfo('Subscription canceled', { subscriptionId: subscription.id, userId: user.id });
  } catch (error) {
    logError(error, { context: 'Subscription cancellation processing failed', subscriptionId: subscription.id });
    throw error;
  }
};

// 결제 성공 처리
const handlePaymentSucceeded = async (invoice) => {
  const customerId = invoice.customer;
  
  try {
    // 고객 ID로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      logError(new Error('User not found for invoice'), { customerId });
      return;
    }

    // 인보이스 정보 저장
    await prisma.invoice.create({
      data: {
        userId: user.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000)
      }
    });

    logInfo('Payment succeeded', { invoiceId: invoice.id, userId: user.id, amount: invoice.amount_paid });
  } catch (error) {
    logError(error, { context: 'Payment success processing failed', invoiceId: invoice.id });
    throw error;
  }
};

// 결제 실패 처리
const handlePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;
  
  try {
    // 고객 ID로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      logError(new Error('User not found for invoice'), { customerId });
      return;
    }

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'email',
        title: 'Payment Failed',
        message: 'Your payment failed. Please update your payment method to continue your subscription.'
      }
    });

    logInfo('Payment failed notification sent', { invoiceId: invoice.id, userId: user.id });
  } catch (error) {
    logError(error, { context: 'Payment failure processing failed', invoiceId: invoice.id });
    throw error;
  }
};

module.exports = {
  stripe,
  PRICE_CONFIG,
  createCheckoutSession,
  cancelSubscription,
  updateSubscription,
  createCustomerPortalSession,
  handleWebhookEvent
};