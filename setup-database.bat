@echo off
echo ======================================
echo 워크플로우 시각화 도구 - 데이터베이스 설정
echo ======================================
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo Node.js를 설치한 후 다시 실행해주세요.
    echo https://nodejs.org/
    pause
    exit /b 1
)

REM npm 패키지 설치 확인
if not exist "node_modules" (
    echo [정보] npm 패키지를 설치합니다...
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] npm 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
)

REM .env 파일 확인
if not exist ".env" (
    if exist ".env.example" (
        echo [정보] .env 파일을 생성합니다...
        copy ".env.example" ".env" >nul
        echo.
        echo [중요] .env 파일이 생성되었습니다.
        echo        메모장으로 .env 파일을 열어 DATABASE_URL을 수정해주세요.
        echo.
        notepad ".env"
        echo.
        set /p continue="데이터베이스 연결 정보를 수정하셨나요? (Y/N): "
        if /i not "%continue%"=="Y" (
            echo [정보] 설정이 취소되었습니다.
            pause
            exit /b 0
        )
    ) else (
        echo [오류] .env.example 파일이 없습니다.
        pause
        exit /b 1
    )
)

echo.
echo [1/3] Prisma 클라이언트 생성 중...
call npm run db:generate
if %errorlevel% neq 0 (
    echo [오류] Prisma 클라이언트 생성에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo [2/3] 데이터베이스 스키마 적용 중...
echo.
echo 개발 환경에서는 db:push를 사용하는 것을 권장합니다.
echo 프로덕션 환경에서는 마이그레이션을 사용하세요.
echo.
set /p migrate="마이그레이션을 사용하시겠습니까? (Y/N, 기본값: N): "
if /i "%migrate%"=="Y" (
    call npm run db:migrate:dev
) else (
    call npm run db:push
)
if %errorlevel% neq 0 (
    echo [오류] 데이터베이스 스키마 적용에 실패했습니다.
    echo.
    echo 문제 해결:
    echo 1. PostgreSQL이 실행 중인지 확인하세요
    echo 2. .env 파일의 DATABASE_URL이 올바른지 확인하세요
    echo 3. 데이터베이스가 존재하는지 확인하세요
    pause
    exit /b 1
)

echo.
set /p seed="시드 데이터를 생성하시겠습니까? (Y/N, 기본값: Y): "
if /i not "%seed%"=="N" (
    echo [3/3] 시드 데이터 생성 중...
    call npm run db:seed
    if %errorlevel% neq 0 (
        echo [경고] 시드 데이터 생성에 실패했습니다.
        echo        이미 데이터가 존재하거나 다른 문제가 있을 수 있습니다.
    )
)

echo.
echo ======================================
echo 데이터베이스 설정이 완료되었습니다!
echo ======================================
echo.
echo 생성된 테스트 계정:
echo   관리자: admin@workflow-visualizer.com / admin123!@#
echo   일반 사용자: test@example.com / test123!@#
echo   프로 사용자: pro@example.com / pro123!@#
echo.
echo Prisma Studio 실행: npm run db:studio
echo 서버 실행: npm run server:dev
echo.
pause