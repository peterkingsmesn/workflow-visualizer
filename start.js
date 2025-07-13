#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Workflow Visualizer 시작 중...\n');

// 서버와 클라이언트 프로세스 관리
let serverProcess = null;
let clientProcess = null;

// 프로세스 종료 처리
const cleanup = () => {
  console.log('\n🛑 서버 종료 중...');
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  
  if (clientProcess) {
    clientProcess.kill('SIGTERM');
  }
  
  process.exit(0);
};

// 신호 처리
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 서버 시작
const startServer = () => {
  console.log('📡 백엔드 서버 시작...');
  
  serverProcess = spawn('node', ['server/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });
  
  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(`[서버] ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(`[서버 오류] ${data}`);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`\n❌ 서버 프로세스가 종료됨 (코드: ${code})`);
    if (code !== 0) {
      console.log('⏱️  5초 후 서버 재시작...');
      setTimeout(startServer, 5000);
    }
  });
};

// 클라이언트 시작
const startClient = () => {
  console.log('🌐 프론트엔드 서버 시작...');
  
  clientProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });
  
  clientProcess.stdout.on('data', (data) => {
    process.stdout.write(`[클라이언트] ${data}`);
  });
  
  clientProcess.stderr.on('data', (data) => {
    process.stderr.write(`[클라이언트 오류] ${data}`);
  });
  
  clientProcess.on('exit', (code) => {
    console.log(`\n❌ 클라이언트 프로세스가 종료됨 (코드: ${code})`);
    if (code !== 0) {
      console.log('⏱️  5초 후 클라이언트 재시작...');
      setTimeout(startClient, 5000);
    }
  });
};

// 순차적으로 시작
console.log('🔧 환경 설정 확인 중...');

// 서버 먼저 시작
startServer();

// 2초 후 클라이언트 시작
setTimeout(() => {
  startClient();
}, 2000);

console.log(`
✅ 개발 환경이 시작되었습니다!

🌐 프론트엔드: http://localhost:3000
📡 백엔드: http://localhost:3001
🔍 헬스체크: http://localhost:3001/health

종료하려면 Ctrl+C를 누르세요.
`);