#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { logger, logError, logInfo, logDebug, logWarn } = require('../server/utils/logger');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupDatabase() {
  logInfo('워크플로우 시각화 도구 - 데이터베이스 설정 시작');

  // .env 파일 존재 확인
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    logWarn('.env 파일이 없습니다. .env.example을 복사합니다...');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      logInfo('.env 파일이 생성되었습니다.');
      logInfo('.env 파일을 열어 데이터베이스 연결 정보를 수정해주세요.');
      
      const proceed = await question('데이터베이스 연결 정보를 수정하셨나요? (y/N): ');
      if (proceed.toLowerCase() !== 'y') {
        logWarn('설정이 취소되었습니다. .env 파일을 수정 후 다시 실행해주세요.');
        process.exit(0);
      }
    } else {
      logError(new Error('.env.example 파일도 없습니다. 환경 설정 파일을 확인해주세요.'));
      process.exit(1);
    }
  }

  logInfo('데이터베이스 설정을 시작합니다...');

  try {
    // 1. Prisma 클라이언트 생성
    logInfo('Prisma 클라이언트 생성 중...');
    execSync('npm run db:generate', { stdio: 'inherit' });
    logInfo('Prisma 클라이언트 생성 완료');

    // 2. 데이터베이스 스키마 적용
    logInfo('데이터베이스 스키마 적용 중...');
    const migrate = await question('마이그레이션을 사용하시겠습니까? (개발 환경에서는 db:push 권장) (y/N): ');
    
    if (migrate.toLowerCase() === 'y') {
      execSync('npm run db:migrate:dev', { stdio: 'inherit' });
    } else {
      execSync('npm run db:push', { stdio: 'inherit' });
    }
    logInfo('데이터베이스 스키마 적용 완료');

    // 3. 시드 데이터 생성
    const seed = await question('시드 데이터를 생성하시겠습니까? (Y/n): ');
    if (seed.toLowerCase() !== 'n') {
      logInfo('시드 데이터 생성 중...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      logInfo('시드 데이터 생성 완료');
    }

    logInfo('데이터베이스 설정이 완료되었습니다!');
    logInfo('다음 명령어로 Prisma Studio를 열어 데이터를 확인할 수 있습니다: npm run db:studio');
    logInfo('서버를 시작하려면: npm run server:dev');

  } catch (error) {
    logError(error, { context: 'Database setup failed' });
    logInfo('문제 해결 방법:');
    logInfo('1. PostgreSQL이 실행 중인지 확인하세요');
    logInfo('2. .env 파일의 DATABASE_URL이 올바른지 확인하세요');
    logInfo('3. 데이터베이스 사용자 권한을 확인하세요');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 메인 함수 실행
setupDatabase();