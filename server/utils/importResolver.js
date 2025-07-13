const path = require('path');
const fs = require('fs');

/**
 * Import 경로를 해석하여 정규화된 경로를 반환
 * @param {string} sourcePath - 소스 파일 경로
 * @param {string} importPath - import 경로
 * @returns {string} 정규화된 경로
 */
function resolveImportPath(sourcePath, importPath) {
  // 정규화된 경로 생성
  const sourceDir = path.dirname(sourcePath);
  const resolved = path.resolve(sourceDir, importPath);
  
  // Windows 경로를 Unix 스타일로 변환
  return resolved.replace(/\\/g, '/');
}

/**
 * 파일 시스템 기반 import 경로 해석 (확장자 추가)
 * @param {string} importPath - import 경로
 * @param {string} fromFile - 소스 파일
 * @returns {string|null} 해석된 경로 또는 null
 */
function resolveImportPathWithFS(importPath, fromFile) {
  if (importPath.startsWith('.')) {
    const dir = path.dirname(fromFile);
    let resolved = path.resolve(dir, importPath);
    
    // 확장자 추가 시도
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        return resolved + ext;
      }
    }
    
    // index 파일 확인
    const indexPath = path.join(resolved, 'index');
    for (const ext of extensions) {
      if (fs.existsSync(indexPath + ext)) {
        return indexPath + ext;
      }
    }
  }
  
  return null;
}

/**
 * 타겟 파일 찾기
 * @param {Array} files - 파일 목록
 * @param {string} resolvedPath - 해석된 경로
 * @returns {Object|null} 찾은 파일 또는 null
 */
function findTargetFile(files, resolvedPath) {
  console.log(`🔍 Looking for target file: ${resolvedPath}`);
  
  if (!resolvedPath) {
    console.log(`⚠️ Resolved path is null`);
    return null;
  }
  
  // 가능한 확장자들
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  
  // 정확한 경로 매치
  let targetFile = files.find(f => f.path === resolvedPath);
  if (targetFile) {
    console.log(`✅ Found exact match: ${targetFile.path}`);
    return targetFile;
  }
  
  // 확장자 추가해서 찾기
  for (const ext of extensions) {
    targetFile = files.find(f => f.path === resolvedPath + ext);
    if (targetFile) {
      console.log(`✅ Found with extension: ${targetFile.path}`);
      return targetFile;
    }
  }
  
  // index 파일 찾기
  for (const ext of extensions) {
    targetFile = files.find(f => f.path === resolvedPath + '/index' + ext);
    if (targetFile) {
      console.log(`✅ Found index file: ${targetFile.path}`);
      return targetFile;
    }
  }
  
  // 더 유연한 매칭 - 파일명만으로도 찾기
  const fileName = resolvedPath.split('/').pop();
  for (const ext of extensions) {
    targetFile = files.find(f => {
      const fName = f.path.split('/').pop();
      return fName === fileName + ext || fName === fileName;
    });
    if (targetFile) {
      console.log(`✅ Found by filename: ${targetFile.path}`);
      return targetFile;
    }
  }
  
  console.log(`❌ Target file not found for: ${resolvedPath}`);
  return null;
}

module.exports = {
  resolveImportPath,
  resolveImportPathWithFS,
  findTargetFile
};