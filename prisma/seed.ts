import { PrismaClient, Role, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const { logger, logError, logInfo, logDebug, logWarn } = require('../server/utils/logger');

const prisma = new PrismaClient();

async function main() {
  logInfo('데이터베이스 시딩 시작...');

  // 1. 관리자 사용자 생성
  const adminPassword = await bcrypt.hash('admin123!@#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@workflow-visualizer.com' },
    update: {},
    create: {
      email: 'admin@workflow-visualizer.com',
      password: adminPassword,
      name: '시스템 관리자',
      role: Role.ADMIN,
      emailVerified: true,
      locale: 'ko',
      timezone: 'Asia/Seoul',
      marketingEmails: true,
    },
  });
  logInfo('관리자 사용자 생성 완료', { email: admin.email });

  // 2. 테스트 사용자 생성
  const testPassword = await bcrypt.hash('test123!@#', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testPassword,
      name: '테스트 사용자',
      role: Role.USER,
      emailVerified: true,
      locale: 'ko',
      timezone: 'Asia/Seoul',
    },
  });
  logInfo('테스트 사용자 생성 완료', { email: testUser.email });

  // 3. 프로 플랜 사용자 생성
  const proPassword = await bcrypt.hash('pro123!@#', 10);
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@example.com' },
    update: {},
    create: {
      email: 'pro@example.com',
      password: proPassword,
      name: '프로 사용자',
      role: Role.USER,
      emailVerified: true,
      locale: 'ko',
      timezone: 'Asia/Seoul',
    },
  });
  logInfo('프로 사용자 생성 완료', { email: proUser.email });

  // 4. 팀 생성
  const team = await prisma.team.upsert({
    where: { slug: 'demo-team' },
    update: {},
    create: {
      name: '데모 팀',
      slug: 'demo-team',
    },
  });
  logInfo('팀 생성 완료', { teamName: team.name });

  // 5. 팀 멤버 추가
  await prisma.teamMember.upsert({
    where: {
      userId_teamId: {
        userId: proUser.id,
        teamId: team.id,
      },
    },
    update: {},
    create: {
      userId: proUser.id,
      teamId: team.id,
      role: 'owner',
    },
  });

  await prisma.teamMember.upsert({
    where: {
      userId_teamId: {
        userId: testUser.id,
        teamId: team.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      teamId: team.id,
      role: 'member',
    },
  });
  logInfo('팀 멤버 추가 완료');

  // 6. 구독 플랜 생성
  const currentDate = new Date();
  const oneMonthLater = new Date(currentDate);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  // 무료 플랜 구독
  await prisma.subscription.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: currentDate,
      currentPeriodEnd: oneMonthLater,
    },
  });
  logInfo('무료 플랜 구독 생성 완료');

  // 프로 플랜 구독
  await prisma.subscription.upsert({
    where: { userId: proUser.id },
    update: {},
    create: {
      userId: proUser.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: currentDate,
      currentPeriodEnd: oneMonthLater,
      stripeCustomerId: 'cus_demo_pro_user',
      stripeSubscriptionId: 'sub_demo_pro_user',
      stripePriceId: 'price_demo_pro',
    },
  });
  logInfo('프로 플랜 구독 생성 완료');

  // 7. 샘플 프로젝트 생성
  const sampleProject1 = await prisma.project.create({
    data: {
      name: 'React 대시보드',
      description: 'React와 TypeScript로 만든 대시보드 애플리케이션',
      userId: testUser.id,
      isPublic: true,
      metadata: {
        framework: 'React',
        language: 'TypeScript',
        dependencies: ['react', 'react-dom', 'typescript', '@mui/material'],
      },
    },
  });

  const sampleProject2 = await prisma.project.create({
    data: {
      name: 'Node.js API 서버',
      description: 'Express.js 기반 RESTful API 서버',
      userId: proUser.id,
      teamId: team.id,
      isPublic: false,
      metadata: {
        framework: 'Express',
        language: 'JavaScript',
        dependencies: ['express', 'jsonwebtoken', 'bcryptjs', 'prisma'],
      },
    },
  });

  const sampleProject3 = await prisma.project.create({
    data: {
      name: '워크플로우 시각화 도구',
      description: '코드베이스 분석 및 시각화 도구',
      userId: admin.id,
      isPublic: true,
      metadata: {
        framework: 'React',
        language: 'TypeScript',
        dependencies: ['react', 'reactflow', 'zustand', 'framer-motion'],
      },
    },
  });
  logInfo('샘플 프로젝트 생성 완료');

  // 8. 분석 기록 생성
  await prisma.analysis.create({
    data: {
      projectId: sampleProject1.id,
      version: '1.0.0',
      status: 'completed',
      fileCount: 45,
      totalSize: BigInt(1024 * 1024 * 2), // 2MB
      duration: 3500,
      completedAt: new Date(),
      results: {
        components: 12,
        hooks: 8,
        pages: 5,
        utils: 20,
      },
    },
  });

  await prisma.analysis.create({
    data: {
      projectId: sampleProject2.id,
      version: '2.1.0',
      status: 'completed',
      fileCount: 32,
      totalSize: BigInt(1024 * 1024), // 1MB
      duration: 2800,
      completedAt: new Date(),
      results: {
        routes: 15,
        models: 8,
        middlewares: 5,
        utils: 4,
      },
    },
  });
  logInfo('분석 기록 생성 완료');

  // 9. API 키 생성
  await prisma.apiKey.create({
    data: {
      userId: proUser.id,
      name: '개발용 API 키',
      key: 'wfv_test_' + Buffer.from(Math.random().toString()).toString('base64').slice(0, 32),
      scopes: ['read:projects', 'write:projects', 'read:analyses'],
    },
  });
  logInfo('API 키 생성 완료');

  // 10. 활동 로그 생성
  await prisma.activityLog.createMany({
    data: [
      {
        userId: testUser.id,
        action: 'login',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        userId: testUser.id,
        action: 'project_created',
        resourceType: 'project',
        resourceId: sampleProject1.id,
        metadata: { projectName: sampleProject1.name },
      },
      {
        userId: proUser.id,
        action: 'subscription_upgraded',
        resourceType: 'subscription',
        metadata: { from: 'FREE', to: 'PRO' },
      },
    ],
  });
  logInfo('활동 로그 생성 완료');

  // 11. 알림 생성
  await prisma.notification.createMany({
    data: [
      {
        userId: testUser.id,
        type: 'in_app',
        title: '환영합니다!',
        message: '워크플로우 시각화 도구에 오신 것을 환영합니다.',
        metadata: { type: 'welcome' },
      },
      {
        userId: proUser.id,
        type: 'email',
        title: '프로 플랜 업그레이드 완료',
        message: '프로 플랜으로 업그레이드되었습니다. 모든 기능을 이용하실 수 있습니다.',
        metadata: { type: 'subscription_upgrade' },
      },
    ],
  });
  logInfo('알림 생성 완료');

  logInfo('데이터베이스 시딩 완료!');
  logInfo('생성된 테스트 계정:', {
    관리자: 'admin@workflow-visualizer.com / admin123!@#',
    일반사용자: 'test@example.com / test123!@#',
    프로사용자: 'pro@example.com / pro123!@#'
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logError(e, { context: 'Database seeding failed' });
    await prisma.$disconnect();
    process.exit(1);
  });