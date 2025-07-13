// Redis 비활성화됨 - 메모리 캐시 사용
const memoryCache = new Map();

const redisClient = {
  isReady: false,
  get: async (key) => {
    return memoryCache.get(key);
  },
  set: async (key, value, options) => {
    memoryCache.set(key, value);
    if (options?.EX) {
      setTimeout(() => {
        memoryCache.delete(key);
      }, options.EX * 1000);
    }
  },
  del: async (key) => {
    memoryCache.delete(key);
  },
  exists: async (key) => {
    return memoryCache.has(key) ? 1 : 0;
  },
  on: () => {},
  connect: async () => {},
  disconnect: async () => {}
};

// 세션 관리 함수들
const getSession = async (token) => {
  const data = memoryCache.get(`session:${token}`);
  return data ? JSON.parse(data) : null;
};

const setSession = async (token, sessionData, ttl) => {
  memoryCache.set(`session:${token}`, JSON.stringify(sessionData));
  if (ttl) {
    setTimeout(() => {
      memoryCache.delete(`session:${token}`);
    }, ttl * 1000);
  }
};

const deleteSession = async (token) => {
  memoryCache.delete(`session:${token}`);
};

const addUserSession = async (userId, token) => {
  const userSessions = memoryCache.get(`user:sessions:${userId}`) || [];
  if (!userSessions.includes(token)) {
    userSessions.push(token);
    memoryCache.set(`user:sessions:${userId}`, userSessions);
  }
};

const removeUserSession = async (userId, token) => {
  const userSessions = memoryCache.get(`user:sessions:${userId}`) || [];
  const filtered = userSessions.filter(t => t !== token);
  memoryCache.set(`user:sessions:${userId}`, filtered);
};

const deleteAllUserSessions = async (userId) => {
  const userSessions = memoryCache.get(`user:sessions:${userId}`) || [];
  for (const token of userSessions) {
    memoryCache.delete(`session:${token}`);
  }
  memoryCache.delete(`user:sessions:${userId}`);
};

module.exports = { 
  redisClient,
  getSession,
  setSession,
  deleteSession,
  addUserSession,
  removeUserSession,
  deleteAllUserSessions
};