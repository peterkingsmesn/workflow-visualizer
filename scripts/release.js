#!/usr/bin/env node
// 🚀 릴리스 자동화 스크립트

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 설정
const MAIN_PACKAGE = path.join(__dirname, '../package.json');
const DESKTOP_PACKAGE = path.join(__dirname, '../desktop/package.json');

// 📋 명령행 인자 파싱
const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Invalid version type. Use: patch, minor, or major');
  process.exit(1);
}

console.log(`🚀 Starting ${versionType} release...`);

try {
  // 1. 현재 버전 확인
  const mainPkg = JSON.parse(fs.readFileSync(MAIN_PACKAGE, 'utf8'));
  const currentVersion = mainPkg.version;
  console.log(`📋 Current version: ${currentVersion}`);

  // 2. 새 버전 계산
  const versionParts = currentVersion.split('.').map(Number);
  switch (versionType) {
    case 'major':
      versionParts[0]++;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case 'minor':
      versionParts[1]++;
      versionParts[2] = 0;
      break;
    case 'patch':
      versionParts[2]++;
      break;
  }
  
  const newVersion = versionParts.join('.');
  console.log(`📈 New version: ${newVersion}`);

  // 3. Git 상태 확인
  console.log('🔍 Checking git status...');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      console.error('❌ Working directory is not clean. Please commit or stash your changes.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Git status check failed:', error.message);
    process.exit(1);
  }

  // 4. 테스트 실행
  console.log('🧪 Running tests...');
  try {
    execSync('npm run test', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Tests failed. Release aborted.');
    process.exit(1);
  }

  // 5. 타입 체크
  console.log('🔎 Running type check...');
  try {
    execSync('npm run typecheck', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Type check failed. Release aborted.');
    process.exit(1);
  }

  // 6. 린트 체크
  console.log('🔧 Running linter...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️ Linter warnings found, but continuing...');
  }

  // 7. 메인 프로젝트 버전 업데이트
  console.log('📝 Updating main package version...');
  mainPkg.version = newVersion;
  fs.writeFileSync(MAIN_PACKAGE, JSON.stringify(mainPkg, null, 2) + '\n');

  // 8. 데스크톱 프로젝트 버전 업데이트
  console.log('📝 Updating desktop package version...');
  const desktopPkg = JSON.parse(fs.readFileSync(DESKTOP_PACKAGE, 'utf8'));
  desktopPkg.version = newVersion;
  fs.writeFileSync(DESKTOP_PACKAGE, JSON.stringify(desktopPkg, null, 2) + '\n');

  // 9. 빌드 실행
  console.log('🔨 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed. Release aborted.');
    process.exit(1);
  }

  // 10. 변경사항 커밋
  console.log('💾 Committing changes...');
  execSync('git add package.json desktop/package.json');
  execSync(`git commit -m "chore: bump version to ${newVersion}"`);

  // 11. 태그 생성
  console.log('🏷️ Creating git tag...');
  const tagName = `v${newVersion}`;
  execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);

  // 12. 변경로그 생성
  console.log('📄 Generating changelog...');
  generateChangelog(newVersion);

  // 13. GitHub 푸시
  console.log('📤 Pushing to GitHub...');
  execSync('git push origin main');
  execSync(`git push origin ${tagName}`);

  // 14. GitHub 릴리스 트리거
  console.log('🚀 Triggering GitHub release workflow...');
  try {
    execSync('gh workflow run auto-release.yml', { stdio: 'inherit' });
    console.log('✅ GitHub workflow triggered successfully!');
  } catch (error) {
    console.log('ℹ️ GitHub CLI not available or workflow trigger failed. Release will be created by push trigger.');
  }

  console.log(`\n🎉 Release ${newVersion} completed successfully!`);
  console.log(`📋 Next steps:`);
  console.log(`   1. Wait for GitHub Actions to build the apps`);
  console.log(`   2. Check the release at: https://github.com/peterkingsmesn/workflow-visualizer/releases`);
  console.log(`   3. Test the built applications`);
  console.log(`   4. Update any documentation if needed`);

} catch (error) {
  console.error('❌ Release failed:', error.message);
  process.exit(1);
}

/**
 * 📄 변경로그 생성
 */
function generateChangelog(version) {
  const changelogPath = path.join(__dirname, '../CHANGELOG.md');
  
  try {
    // 마지막 태그 찾기
    let lastTag;
    try {
      lastTag = execSync('git describe --tags --abbrev=0 HEAD~1', { encoding: 'utf8' }).trim();
    } catch {
      lastTag = ''; // 첫 번째 릴리스인 경우
    }

    // 커밋 로그 생성
    const gitLogCmd = lastTag ? 
      `git log ${lastTag}..HEAD --pretty=format:"- %s (%h)"` :
      `git log --pretty=format:"- %s (%h)"`;
    
    const commits = execSync(gitLogCmd, { encoding: 'utf8' });
    
    // 현재 날짜
    const today = new Date().toISOString().split('T')[0];
    
    // 새 변경로그 엔트리
    const newEntry = `## [${version}] - ${today}

### Added
- New features and enhancements

### Changed
${commits || '- No specific changes documented'}

### Fixed
- Bug fixes and improvements

---

`;

    // 기존 변경로그 읽기
    let existingChangelog = '';
    if (fs.existsSync(changelogPath)) {
      existingChangelog = fs.readFileSync(changelogPath, 'utf8');
    } else {
      existingChangelog = `# Changelog

All notable changes to Workflow Visualizer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
    }

    // 변경로그 업데이트
    const updatedChangelog = existingChangelog.replace(
      /# Changelog\n\n.*?\n\n/s,
      `# Changelog

All notable changes to Workflow Visualizer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${newEntry}`
    );

    fs.writeFileSync(changelogPath, updatedChangelog);
    
    // 변경로그도 커밋에 포함
    execSync('git add CHANGELOG.md');
    execSync(`git commit --amend --no-edit`);
    
    console.log('📄 Changelog updated');
  } catch (error) {
    console.warn('⚠️ Changelog generation failed:', error.message);
  }
}