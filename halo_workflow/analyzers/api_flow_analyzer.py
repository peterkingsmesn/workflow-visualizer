"""
API 흐름 분석기
"""

import re
import ast
from pathlib import Path
from typing import Dict, List, Any, Optional
from collections import defaultdict


class APIFlowAnalyzer:
    """API 호출 패턴 및 흐름 분석"""
    
    def __init__(self):
        # API 호출 패턴
        self.api_patterns = {
            'python': {
                'requests': [
                    r'requests\.(get|post|put|delete|patch)\s*\(',
                    r'urllib\.request\.urlopen\s*\(',
                    r'http\.client\.HTTPConnection\s*\(',
                ],
                'async': [
                    r'aiohttp\.(get|post|put|delete|patch)\s*\(',
                    r'httpx\.(get|post|put|delete|patch)\s*\(',
                ],
            },
            'javascript': {
                'fetch': [
                    r'fetch\s*\(',
                    r'axios\.(get|post|put|delete|patch)\s*\(',
                    r'\$\.ajax\s*\(',
                ],
                'node': [
                    r'http\.request\s*\(',
                    r'https\.request\s*\(',
                ],
            },
            'typescript': {
                'fetch': [
                    r'fetch\s*\(',
                    r'axios\.(get|post|put|delete|patch)\s*\(',
                ],
            }
        }
        
        self.endpoint_pattern = r'["\']([/][\w/\-{}:]+)["\']'
        self.url_pattern = r'["\']https?://[^"\']+["\']'
    
    def analyze_file(self, content: str, file_path: Path) -> Optional[Dict[str, Any]]:
        """파일 내 API 호출 분석"""
        file_ext = file_path.suffix.lower()
        
        if file_ext == '.py':
            return self._analyze_python(content)
        elif file_ext in ['.js', '.jsx']:
            return self._analyze_javascript(content)
        elif file_ext in ['.ts', '.tsx']:
            return self._analyze_typescript(content)
        
        return None
    
    def analyze_flows(self, api_flows: Dict[str, Any]) -> List[Dict[str, Any]]:
        """전체 API 흐름 분석"""
        issues = []
        
        # 엔드포인트별 호출 통계
        endpoint_stats = self._collect_endpoint_stats(api_flows)
        
        # 문제 패턴 감지
        # 1. 중복 엔드포인트
        for endpoint, files in endpoint_stats.items():
            if len(files) > 3:
                issues.append({
                    'type': 'api_flow',
                    'severity': 'warning',
                    'message': f"엔드포인트 '{endpoint}'가 {len(files)}개 파일에서 호출됨",
                    'files': files
                })
        
        # 2. 에러 처리 부재
        for file_path, api_info in api_flows.items():
            for call in api_info.get('calls', []):
                if not call.get('has_error_handling'):
                    issues.append({
                        'type': 'api_flow',
                        'severity': 'warning',
                        'file': file_path,
                        'line': call.get('line', 0),
                        'message': "API 호출에 에러 처리가 없습니다"
                    })
        
        return issues
    
    def _analyze_python(self, content: str) -> Dict[str, Any]:
        """Python 파일 분석"""
        api_info = {
            'language': 'python',
            'endpoints': [],
            'calls': []
        }
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # API 호출 패턴 검사
            for pattern_type, patterns in self.api_patterns['python'].items():
                for pattern in patterns:
                    if re.search(pattern, line):
                        # 엔드포인트 추출
                        endpoint_match = re.search(self.endpoint_pattern, line)
                        url_match = re.search(self.url_pattern, line)
                        
                        call_info = {
                            'line': i,
                            'type': pattern_type,
                            'method': self._extract_method(line),
                            'endpoint': endpoint_match.group(1) if endpoint_match else None,
                            'url': url_match.group(0).strip('"\'') if url_match else None,
                            'has_error_handling': self._check_error_handling(lines, i)
                        }
                        
                        api_info['calls'].append(call_info)
                        
                        if endpoint_match:
                            api_info['endpoints'].append(endpoint_match.group(1))
        
        return api_info if api_info['calls'] else None
    
    def _analyze_javascript(self, content: str) -> Dict[str, Any]:
        """JavaScript 파일 분석"""
        api_info = {
            'language': 'javascript',
            'endpoints': [],
            'calls': []
        }
        
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # API 호출 패턴 검사
            for pattern_type, patterns in self.api_patterns['javascript'].items():
                for pattern in patterns:
                    if re.search(pattern, line):
                        # 엔드포인트 추출
                        endpoint_match = re.search(self.endpoint_pattern, line)
                        url_match = re.search(self.url_pattern, line)
                        
                        call_info = {
                            'line': i,
                            'type': pattern_type,
                            'method': self._extract_method(line),
                            'endpoint': endpoint_match.group(1) if endpoint_match else None,
                            'url': url_match.group(0).strip('"\'') if url_match else None,
                            'has_error_handling': self._check_js_error_handling(lines, i)
                        }
                        
                        api_info['calls'].append(call_info)
                        
                        if endpoint_match:
                            api_info['endpoints'].append(endpoint_match.group(1))
        
        return api_info if api_info['calls'] else None
    
    def _analyze_typescript(self, content: str) -> Dict[str, Any]:
        """TypeScript 파일 분석"""
        # JavaScript와 동일한 패턴 사용
        return self._analyze_javascript(content)
    
    def _extract_method(self, line: str) -> Optional[str]:
        """HTTP 메서드 추출"""
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
        
        for method in methods:
            if method.lower() in line.lower():
                return method
        
        return None
    
    def _check_error_handling(self, lines: List[str], line_num: int) -> bool:
        """Python 에러 처리 확인"""
        # 간단한 휴리스틱: try-except 블록 내에 있는지 확인
        indent_level = len(lines[line_num - 1]) - len(lines[line_num - 1].lstrip())
        
        # 위로 검색
        for i in range(line_num - 2, max(0, line_num - 20), -1):
            line = lines[i]
            if line.strip().startswith('try:'):
                return True
            if line.strip() and len(line) - len(line.lstrip()) < indent_level:
                break
        
        # 아래로 검색 (catch 블록)
        for i in range(line_num, min(len(lines), line_num + 10)):
            line = lines[i]
            if line.strip().startswith('except'):
                return True
            if line.strip() and len(line) - len(line.lstrip()) < indent_level:
                break
        
        return False
    
    def _check_js_error_handling(self, lines: List[str], line_num: int) -> bool:
        """JavaScript 에러 처리 확인"""
        # .catch() 또는 try-catch 확인
        line_text = ' '.join(lines[line_num - 1:min(len(lines), line_num + 5)])
        
        return '.catch(' in line_text or 'try {' in line_text
    
    def _collect_endpoint_stats(self, api_flows: Dict[str, Any]) -> Dict[str, List[str]]:
        """엔드포인트별 통계 수집"""
        stats = defaultdict(list)
        
        for file_path, api_info in api_flows.items():
            if api_info:
                for endpoint in api_info.get('endpoints', []):
                    stats[endpoint].append(file_path)
        
        return dict(stats)