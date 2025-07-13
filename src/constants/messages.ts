// 시스템 메시지 상수들
export const ANALYSIS_MESSAGES = {
  PREPARING: '프로젝트 분석 준비 중...',
  FILE_STRUCTURE: '파일 구조 분석 중...',
  WORKFLOW_GENERATING: '워크플로우 생성 중...',
  ANALYSIS_COMPLETE: '분석 완료!',
  ANALYSIS_ERROR: '분석 중 오류 발생'
} as const;

export const UI_MESSAGES = {
  LOGIN_REQUIRED: '로그인이 필요합니다.',
  SAVE_SUCCESS: '워크플로우가 저장되었습니다!',
  SAVE_ERROR: '저장 중 오류가 발생했습니다.',
  SAVE_FAILED: '저장 실패'
} as const;

export const COMPONENT_LABELS = {
  WORKFLOW: '워크플로우',
  DIAGNOSE: '진단',
  WORKFLOW_VISUALIZER: 'Workflow Visualizer',
  FOLDER_SELECT: '폴더 선택',
  JSON_EXPORT: 'JSON 내보내기',
  SAVE: '저장'
} as const;

export const API_MESSAGES = {
  UNAUTHORIZED: '로그인이 필요합니다.',
  SAVE_SUCCESS: '워크플로우가 저장되었습니다!',
  SAVE_ERROR: '저장 중 오류가 발생했습니다.'
} as const;

// 타입 정의
export type AnalysisMessage = typeof ANALYSIS_MESSAGES[keyof typeof ANALYSIS_MESSAGES];
export type UIMessage = typeof UI_MESSAGES[keyof typeof UI_MESSAGES];
export type ComponentLabel = typeof COMPONENT_LABELS[keyof typeof COMPONENT_LABELS];
export type APIMessage = typeof API_MESSAGES[keyof typeof API_MESSAGES];