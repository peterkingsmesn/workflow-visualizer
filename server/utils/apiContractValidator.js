/**
 * API 메소드 추출
 * @param {string} patternSource - 패턴 소스 코드
 * @returns {string} HTTP 메소드
 */
function getApiMethod(patternSource) {
  if (patternSource.includes('fetch')) return 'FETCH';
  if (patternSource.includes('\\.get')) return 'GET';
  if (patternSource.includes('\\.post')) return 'POST';
  if (patternSource.includes('\\.put')) return 'PUT';
  if (patternSource.includes('\\.delete')) return 'DELETE';
  if (patternSource.includes('axios')) return 'AXIOS';
  return 'UNKNOWN';
}

/**
 * API 계약 검증
 * @param {string} apiUrl - API URL
 * @param {string} method - HTTP 메소드
 * @returns {boolean} 유효한 계약인지 여부
 */
function checkApiContract(apiUrl, method) {
  // 알려진 유효한 API 엔드포인트 목록
  const validContracts = [
    { url: '/api/users', methods: ['GET', 'POST'] },
    { url: '/api/user', methods: ['GET', 'PUT', 'DELETE'] },
    { url: '/api/auth', methods: ['POST'] },
    { url: '/api/login', methods: ['POST'] },
    { url: '/api/logout', methods: ['POST'] },
    { url: '/api/data', methods: ['GET', 'POST'] },
    { url: '/api/files', methods: ['GET', 'POST', 'DELETE'] },
    { url: '/api/upload', methods: ['POST'] },
    { url: '/api/download', methods: ['GET'] },
    { url: '/api/config', methods: ['GET'] },
    { url: '/api/status', methods: ['GET'] },
    { url: '/api/health', methods: ['GET'] }
  ];
  
  // URL 패턴 매칭 (정확한 매치 또는 부분 매치)
  for (const contract of validContracts) {
    if (apiUrl === contract.url || apiUrl.includes(contract.url) || contract.url.includes(apiUrl.split('?')[0])) {
      if (contract.methods.includes(method) || method === 'FETCH' || method === 'AXIOS') {
        return true;
      }
    }
  }
  
  // 일반적인 RESTful 패턴 검증
  const restfulPatterns = [
    /^\/api\/\w+$/, // /api/resource
    /^\/api\/\w+\/\d+$/, // /api/resource/123
    /^\/api\/\w+\/\w+$/, // /api/resource/action
    /^https?:\/\/\w+\.\w+\/api\/\w+/ // external API
  ];
  
  return restfulPatterns.some(pattern => pattern.test(apiUrl));
}

/**
 * 경로 매칭 (파라미터 고려)
 * @param {string} backendPath - 백엔드 경로
 * @param {string} frontendPath - 프론트엔드 경로
 * @returns {boolean} 매칭 여부
 */
function pathsMatch(backendPath, frontendPath) {
  // 정확히 일치
  if (backendPath === frontendPath) return true;
  
  // 파라미터 패턴 변환
  const pattern = backendPath
    .replace(/:[^/]+/g, '[^/]+')  // :id -> [^/]+
    .replace(/\*/g, '.*');         // * -> .*
    
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(frontendPath);
}

module.exports = {
  getApiMethod,
  checkApiContract,
  pathsMatch
};