"""
하드코딩 탐지기
"""

import re
from pathlib import Path
from typing import List, Dict, Any


class HardcodingDetector:
    """하드코딩된 값 탐지"""
    
    def __init__(self):
        # 하드코딩 패턴 정의
        self.patterns = {
            'api_key': [
                r'api[_-]?key\s*=\s*["\'][\w\-]{20,}["\']',
                r'secret[_-]?key\s*=\s*["\'][\w\-]{20,}["\']',
                r'access[_-]?token\s*=\s*["\'][\w\-]{20,}["\']',
            ],
            'password': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'pwd\s*=\s*["\'][^"\']+["\']',
                r'pass\s*=\s*["\'][^"\']+["\']',
            ],
            'url': [
                r'https?://[^\s"\',;]+',
                r'localhost:\d+',
                r'127\.0\.0\.1:\d+',
            ],
            'path': [
                r'["\'][/\\](?:home|users|var|etc|usr)[/\\][^"\']+["\']',
                r'["\']C:\\[^"\']+["\']',
                r'["\']D:\\[^"\']+["\']',
            ],
            'port': [
                r'port\s*=\s*\d{2,5}',
                r'PORT\s*=\s*\d{2,5}',
            ],
            'database': [
                r'mongodb://[^"\s]+',
                r'mysql://[^"\s]+',
                r'postgresql://[^"\s]+',
                r'redis://[^"\s]+',
            ],
            'email': [
                r'["\'][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}["\']',
            ]
        }
        
        # 예외 패턴 (하드코딩으로 간주하지 않음)
        self.exceptions = [
            r'example\.com',
            r'test@example\.com',
            r'localhost',
            r'127\.0\.0\.1',
            r'0\.0\.0\.0',
            r'placeholder',
            r'your[_-]?api[_-]?key',
            r'your[_-]?secret',
            r'TODO',
            r'FIXME',
        ]
    
    def detect(self, content: str, file_path: Path) -> List[Dict[str, Any]]:
        """하드코딩 탐지"""
        issues = []
        lines = content.split('\n')
        
        # 파일 확장자별 처리
        if file_path.suffix in ['.env', '.env.example', '.env.sample']:
            # 환경 변수 파일은 검사하지 않음
            return issues
        
        for line_num, line in enumerate(lines, 1):
            # 주석 라인 스킵
            if self._is_comment(line, file_path):
                continue
            
            # 각 패턴 타입별 검사
            for pattern_type, patterns in self.patterns.items():
                for pattern in patterns:
                    matches = re.finditer(pattern, line, re.IGNORECASE)
                    
                    for match in matches:
                        # 예외 체크
                        if self._is_exception(match.group(0)):
                            continue
                        
                        issue = {
                            'line': line_num,
                            'column': match.start(),
                            'type': pattern_type,
                            'value': match.group(0)[:50] + '...' if len(match.group(0)) > 50 else match.group(0),
                            'message': f"하드코딩된 {pattern_type} 발견",
                            'severity': 'error' if pattern_type in ['api_key', 'password'] else 'warning'
                        }
                        issues.append(issue)
        
        return issues
    
    def _is_comment(self, line: str, file_path: Path) -> bool:
        """주석 라인인지 확인"""
        line = line.strip()
        
        # 언어별 주석 패턴
        if file_path.suffix in ['.py']:
            return line.startswith('#')
        elif file_path.suffix in ['.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp']:
            return line.startswith('//') or line.startswith('/*')
        elif file_path.suffix in ['.rb']:
            return line.startswith('#')
        elif file_path.suffix in ['.php']:
            return line.startswith('//') or line.startswith('#')
        
        return False
    
    def _is_exception(self, value: str) -> bool:
        """예외 패턴인지 확인"""
        for exception in self.exceptions:
            if re.search(exception, value, re.IGNORECASE):
                return True
        return False