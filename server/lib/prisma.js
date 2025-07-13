// 개발 환경을 위한 간단한 메모리 기반 저장소
const users = new Map();
const sessions = new Map();
const activityLogs = [];

const prisma = {
  user: {
    findUnique: async ({ where }) => {
      if (where.id) return users.get(where.id);
      if (where.email) {
        for (const user of users.values()) {
          if (user.email === where.email) return user;
        }
      }
      if (where.providerId) {
        for (const user of users.values()) {
          if (user.providerId === where.providerId) return user;
        }
      }
      return null;
    },
    
    create: async ({ data }) => {
      const id = String(users.size + 1);
      const user = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      users.set(id, user);
      return user;
    },
    
    update: async ({ where, data }) => {
      const user = await prisma.user.findUnique({ where });
      if (!user) throw new Error('User not found');
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },
    
    count: async () => users.size
  },
  
  session: {
    create: async ({ data }) => {
      const id = String(sessions.size + 1);
      const session = { id, ...data, createdAt: new Date() };
      sessions.set(id, session);
      return session;
    },
    
    delete: async ({ where }) => {
      if (where.token) {
        for (const [id, session] of sessions.entries()) {
          if (session.token === where.token) {
            sessions.delete(id);
            return session;
          }
        }
      }
      return null;
    }
  },
  
  activityLog: {
    create: async ({ data }) => {
      const log = { id: String(activityLogs.length + 1), ...data, createdAt: new Date() };
      activityLogs.push(log);
      return log;
    }
  },
  
  notification: {
    create: async ({ data }) => {
      // 알림은 일단 무시 (메모리에 저장하지 않음)
      return { id: '1', ...data, createdAt: new Date() };
    }
  },
  
  subscription: {
    findFirst: async () => {
      // 기본 무료 구독 반환
      return {
        id: '1',
        userId: '1',
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },
  
  $disconnect: async () => {
    console.log('메모리 저장소 연결 해제');
  }
};

// 테스트용 관리자 계정 추가
users.set('1', {
  id: '1',
  email: 'admin@workflow-visualizer.com',
  name: 'Admin User',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

module.exports = prisma;