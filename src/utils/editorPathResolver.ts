/**
 * Import 경로를 실제 파일 경로로 해석하는 유틸리티
 */
export function resolveImportPath(
  importPath: string,
  fromFile: string,
  allFiles: string[]
): string | null {
  if (importPath.startsWith('.')) {
    const dir = fromFile.substring(0, fromFile.lastIndexOf('/'));
    let resolved = dir + '/' + importPath;
    
    // 경로 정규화
    resolved = resolved.split('/').reduce((acc, part) => {
      if (part === '..') {
        acc.pop();
      } else if (part !== '.') {
        acc.push(part);
      }
      return acc;
    }, [] as string[]).join('/');
    
    // 확장자 추가 시도
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (allFiles.includes(withExt)) {
        return withExt;
      }
    }
    
    // index 파일 확인
    for (const ext of extensions) {
      const indexPath = resolved + '/index' + ext;
      if (allFiles.includes(indexPath)) {
        return indexPath;
      }
    }
    
    return resolved;
  }
  return null;
}