import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Github, Mail } from 'lucide-react';

export const LoginRequired: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <LogIn size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            로그인이 필요합니다
          </h1>
          <p className="text-gray-400">
            워크플로우 시각화 기능을 사용하려면 로그인하세요
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Mail className="mr-2" size={20} />
              이메일로 로그인
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">또는</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Github className="mr-2" size={20} />
              GitHub으로 계속하기
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">계정이 없으신가요? </span>
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-500 hover:text-blue-400 font-semibold"
            >
              회원가입
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};