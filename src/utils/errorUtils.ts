/**
 * 에러 처리를 위한 유틸리티 함수들
 */

/**
 * unknown 타입의 에러를 Error 객체로 변환
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  
  return new Error('Unknown error occurred');
}

/**
 * 에러 메시지를 안전하게 추출
 */
export function getErrorMessage(error: unknown): string {
  return toError(error).message;
}

/**
 * 에러가 특정 타입인지 확인
 */
export function isErrorWithCode(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

/**
 * 에러가 특정 이름인지 확인
 */
export function isErrorWithName(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}