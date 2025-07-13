"""
핵심 분석 엔진
"""

import os
import ast
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict

from ..analyzers.hardcoding_detector import HardcodingDetector
from ..analyzers.dummy_data_detector import DummyDataDetector
from ..analyzers.duplicate_detector import DuplicateDetector
from ..analyzers.api_flow_analyzer import APIFlowAnalyzer
from ..utils.logger import setup_logger

logger = setup_logger(__name__)


class WorkflowAnalyzer:
    """워크플로우 분석기"""
    
    def __init__(self, max_files: Optional[int] = None, 
                 ignore_patterns: List[str] = None,
                 premium_features: bool = False):
        self.max_files = max_files
        self.ignore_patterns = ignore_patterns or []
        self.premium_features = premium_features
        self.file_count = 0
        
        # 분석기 초기화
        self.hardcoding_detector = HardcodingDetector()
        self.dummy_data_detector = DummyDataDetector()
        self.duplicate_detector = DuplicateDetector()
        self.api_flow_analyzer = APIFlowAnalyzer()
        
        # 기본 무시 패턴
        self.default_ignore = [
            'node_modules', '__pycache__', '.git', '.svn',
            '*.pyc', '*.pyo', '*.pyd', '.DS_Store', 'dist',
            'build', '*.egg-info', '.venv', 'venv', '.env'
        ]
    
    def analyze(self, project_path: Path) -> Dict[str, Any]:
        """프로젝트 분석 실행"""
        results = {
            'project_path': str(project_path),
            'summary': {},
            'errors': [],
            'warnings': [],
            'info': [],
            'files': {},
            'dependencies': {},
            'api_flows': {},
            'suggestions': []
        }
        
        # 파일 수집
        files = self._collect_files(project_path)
        
        # 파일 수 제한 체크
        if self.max_files and len(files) > self.max_files:
            logger.warning(f"파일 수 제한: {len(files)}개 중 {self.max_files}개만 분석합니다.")
            files = files[:self.max_files]
        
        # 파일별 분석
        for file_path in files:
            self._analyze_file(file_path, results)
        
        # 전체 프로젝트 분석
        self._analyze_project_wide(results)
        
        # 요약 생성
        self._generate_summary(results)
        
        # 개선 제안 생성
        self._generate_suggestions(results)
        
        # 결과 저장 (나중에 report 명령에서 사용)
        self._save_results(results)
        
        return results
    
    def _collect_files(self, project_path: Path) -> List[Path]:
        """분석할 파일 수집"""
        files = []
        
        for root, dirs, filenames in os.walk(project_path):
            # 무시할 디렉토리 제거
            dirs[:] = [d for d in dirs if not self._should_ignore(d)]
            
            for filename in filenames:
                if self._should_ignore(filename):
                    continue
                
                file_path = Path(root) / filename
                
                # 분석 가능한 파일만 추가
                if self._is_analyzable(file_path):
                    files.append(file_path)
        
        return files
    
    def _should_ignore(self, name: str) -> bool:
        """파일/폴더 무시 여부 확인"""
        # 기본 무시 패턴
        for pattern in self.default_ignore + self.ignore_patterns:
            if pattern.startswith('*'):
                if name.endswith(pattern[1:]):
                    return True
            elif pattern in name:
                return True
        return False
    
    def _is_analyzable(self, file_path: Path) -> bool:
        """분석 가능한 파일인지 확인"""
        analyzable_extensions = [
            '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c',
            '.cs', '.go', '.rb', '.php', '.swift', '.kt', '.rs',
            '.json', '.yaml', '.yml', '.xml', '.env', '.config'
        ]
        
        return file_path.suffix.lower() in analyzable_extensions
    
    def _analyze_file(self, file_path: Path, results: Dict[str, Any]):
        """개별 파일 분석"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            relative_path = file_path.relative_to(results['project_path'])
            file_key = str(relative_path)
            
            file_results = {
                'path': file_key,
                'size': len(content),
                'lines': content.count('\n') + 1,
                'issues': []
            }
            
            # 하드코딩 검사
            hardcoding_issues = self.hardcoding_detector.detect(content, file_path)
            for issue in hardcoding_issues:
                file_results['issues'].append(issue)
                if issue['severity'] == 'error':
                    results['errors'].append({
                        'file': file_key,
                        'line': issue['line'],
                        'message': issue['message'],
                        'type': 'hardcoding'
                    })
                else:
                    results['warnings'].append({
                        'file': file_key,
                        'line': issue['line'],
                        'message': issue['message'],
                        'type': 'hardcoding'
                    })
            
            # 더미 데이터 검사
            dummy_issues = self.dummy_data_detector.detect(content, file_path)
            for issue in dummy_issues:
                file_results['issues'].append(issue)
                results['warnings'].append({
                    'file': file_key,
                    'line': issue['line'],
                    'message': issue['message'],
                    'type': 'dummy_data'
                })
            
            # 중복 검사 (나중에 프로젝트 전체 분석에서)
            self.duplicate_detector.add_file(file_path, content)
            
            # API 분석
            if file_path.suffix in ['.py', '.js', '.ts']:
                api_info = self.api_flow_analyzer.analyze_file(content, file_path)
                if api_info:
                    results['api_flows'][file_key] = api_info
            
            results['files'][file_key] = file_results
            
        except Exception as e:
            logger.error(f"파일 분석 오류 {file_path}: {e}")
    
    def _analyze_project_wide(self, results: Dict[str, Any]):
        """프로젝트 전체 분석"""
        # 중복 검사
        duplicates = self.duplicate_detector.find_duplicates()
        for dup_group in duplicates:
            results['warnings'].append({
                'files': dup_group['files'],
                'message': f"중복 코드 발견: {dup_group['similarity']}% 유사",
                'type': 'duplicate'
            })
        
        # API 흐름 분석
        api_issues = self.api_flow_analyzer.analyze_flows(results['api_flows'])
        for issue in api_issues:
            results['warnings'].append(issue)
    
    def _generate_summary(self, results: Dict[str, Any]):
        """요약 생성"""
        results['summary'] = {
            'total_files': len(results['files']),
            'total_issues': len(results['errors']) + len(results['warnings']),
            'error_count': len(results['errors']),
            'warning_count': len(results['warnings']),
            'file_types': self._count_file_types(results['files']),
            'issue_types': self._count_issue_types(results)
        }
    
    def _count_file_types(self, files: Dict[str, Any]) -> Dict[str, int]:
        """파일 타입별 개수"""
        types = defaultdict(int)
        for file_path in files:
            ext = Path(file_path).suffix or 'no_extension'
            types[ext] += 1
        return dict(types)
    
    def _count_issue_types(self, results: Dict[str, Any]) -> Dict[str, int]:
        """문제 타입별 개수"""
        types = defaultdict(int)
        
        for error in results['errors']:
            types[error.get('type', 'unknown')] += 1
        
        for warning in results['warnings']:
            types[warning.get('type', 'unknown')] += 1
        
        return dict(types)
    
    def _generate_suggestions(self, results: Dict[str, Any]):
        """개선 제안 생성"""
        suggestions = []
        
        # 하드코딩이 많은 경우
        hardcoding_count = results['summary']['issue_types'].get('hardcoding', 0)
        if hardcoding_count > 5:
            suggestions.append(
                "환경 변수나 설정 파일을 사용하여 하드코딩된 값들을 분리하세요."
            )
        
        # 더미 데이터가 있는 경우
        dummy_count = results['summary']['issue_types'].get('dummy_data', 0)
        if dummy_count > 0:
            suggestions.append(
                "테스트 데이터는 별도의 fixture 파일로 관리하고, 의미 있는 예제 데이터를 사용하세요."
            )
        
        # 중복이 많은 경우
        duplicate_count = results['summary']['issue_types'].get('duplicate', 0)
        if duplicate_count > 3:
            suggestions.append(
                "중복 코드를 공통 모듈로 추출하여 코드 재사용성을 높이세요."
            )
        
        # API 관련 문제
        api_issues = [w for w in results['warnings'] if w.get('type') == 'api_flow']
        if len(api_issues) > 0:
            suggestions.append(
                "API 호출 패턴을 표준화하고, 에러 처리를 일관성 있게 구현하세요."
            )
        
        results['suggestions'] = suggestions
    
    def _save_results(self, results: Dict[str, Any]):
        """결과 저장"""
        save_dir = Path.home() / '.halo-workflow'
        save_dir.mkdir(exist_ok=True)
        
        with open(save_dir / 'last-analysis.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
    
    def auto_fix(self, results: Dict[str, Any]) -> int:
        """자동 수정 (프리미엄 기능)"""
        if not self.premium_features:
            logger.warning("자동 수정은 프리미엄 기능입니다.")
            return 0
        
        fixed_count = 0
        
        # TODO: 자동 수정 로직 구현
        # - 하드코딩을 환경 변수로 변경
        # - 중복 코드를 함수로 추출
        # - import 정리
        
        logger.info(f"자동 수정 완료: {fixed_count}개 문제 해결")
        return fixed_count