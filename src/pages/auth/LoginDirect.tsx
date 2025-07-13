import React from 'react';
import { Navigate } from 'react-router-dom';

// 보안상의 이유로 자동 로그인 기능을 비활성화했습니다
// 개발 환경에서도 정상적인 로그인 프로세스를 사용하세요
const LoginDirect: React.FC = () => {
  return <Navigate to="/auth/login" replace />;
};

export default LoginDirect;