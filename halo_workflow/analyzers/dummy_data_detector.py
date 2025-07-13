"""
더미 데이터 탐지기
"""

import re
from pathlib import Path
from typing import List, Dict, Any


class DummyDataDetector:
    """의미 없는 더미 데이터 탐지"""
    
    def __init__(self):
        # 더미 데이터 패턴
        self.dummy_patterns = [
            r'\b(foo|bar|baz|qux|quux)\b',
            r'\b(test|temp|tmp|dummy|sample)\b',
            r'\b(asdf|qwer|zxcv|1234|abcd)\b',
            r'\b(aaa+|bbb+|xxx+|zzz+)\b',
            r'\btest\d+\b',
            r'\buser\d+\b',
            r'\bitem\d+\b',
            r'\bthing\d*\b',
            r'\bstuff\d*\b',
            r'["\']lorem ipsum["\']',
        ]
        
        # 컨텍스트별 허용 패턴
        self.allowed_contexts = {
            'test_files': [r'test_', r'_test\.', r'spec\.', r'\.spec\.'],
            'example_files': [r'example', r'sample', r'demo'],
            'documentation': [r'\.md$', r'\.rst$', r'\.txt$'],
        }
    
    def detect(self, content: str, file_path: Path) -> List[Dict[str, Any]]:
        """더미 데이터 탐지"""
        issues = []
        
        # 테스트 파일이나 예제 파일은 검사하지 않음
        if self._is_allowed_file(file_path):
            return issues
        
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # 주석은 스킵
            if self._is_comment(line, file_path):
                continue
            
            for pattern in self.dummy_patterns:
                matches = re.finditer(pattern, line, re.IGNORECASE)
                
                for match in matches:
                    # 문자열 내부에 있는지 확인
                    if self._is_in_string(line, match.start(), match.end()):
                        issue = {
                            'line': line_num,
                            'column': match.start(),
                            'type': 'dummy_data',
                            'value': match.group(0),
                            'message': f"의미 없는 더미 데이터 '{match.group(0)}' 사용",
                            'severity': 'warning'
                        }
                        issues.append(issue)
        
        return issues
    
    def _is_allowed_file(self, file_path: Path) -> bool:
        """허용된 파일 타입인지 확인"""
        path_str = str(file_path).lower()
        
        for context, patterns in self.allowed_contexts.items():
            for pattern in patterns:
                if re.search(pattern, path_str):
                    return True
        
        return False
    
    def _is_comment(self, line: str, file_path: Path) -> bool:
        """주석 라인인지 확인"""
        line = line.strip()
        
        if file_path.suffix in ['.py']:
            return line.startswith('#')
        elif file_path.suffix in ['.js', '.ts', '.jsx', '.tsx']:
            return line.startswith('//') or line.startswith('/*')
        
        return False
    
    def _is_in_string(self, line: str, start: int, end: int) -> bool:
        """매치가 문자열 내부에 있는지 확인"""
        # 간단한 문자열 검사 (완벽하지 않음)
        before = line[:start]
        quote_count = before.count('"') + before.count("'")
        
        # 홀수면 문자열 내부
        return quote_count % 2 == 1