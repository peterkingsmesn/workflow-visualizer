"""
중복 코드 탐지기
"""

import hashlib
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict


class DuplicateDetector:
    """중복 코드 및 파일 탐지"""
    
    def __init__(self, min_lines: int = 10, similarity_threshold: float = 0.9):
        self.min_lines = min_lines
        self.similarity_threshold = similarity_threshold
        self.file_hashes = defaultdict(list)
        self.code_blocks = defaultdict(list)
    
    def add_file(self, file_path: Path, content: str):
        """파일 추가"""
        # 전체 파일 해시
        file_hash = self._hash_content(content)
        self.file_hashes[file_hash].append(str(file_path))
        
        # 코드 블록 추출 및 저장
        blocks = self._extract_code_blocks(content)
        for block in blocks:
            block_hash = self._hash_content(block['content'])
            self.code_blocks[block_hash].append({
                'file': str(file_path),
                'start_line': block['start_line'],
                'end_line': block['end_line'],
                'content': block['content']
            })
    
    def find_duplicates(self) -> List[Dict[str, Any]]:
        """중복 찾기"""
        duplicates = []
        
        # 완전 중복 파일
        for file_hash, files in self.file_hashes.items():
            if len(files) > 1:
                duplicates.append({
                    'type': 'file_duplicate',
                    'files': files,
                    'similarity': 100,
                    'message': f"{len(files)}개의 완전히 동일한 파일"
                })
        
        # 중복 코드 블록
        for block_hash, blocks in self.code_blocks.items():
            if len(blocks) > 1:
                # 같은 파일 내 중복은 제외
                unique_files = set(b['file'] for b in blocks)
                if len(unique_files) > 1:
                    duplicates.append({
                        'type': 'code_duplicate',
                        'blocks': blocks,
                        'files': list(unique_files),
                        'similarity': 100,
                        'message': f"{len(blocks)}개의 중복 코드 블록 발견"
                    })
        
        return duplicates
    
    def _hash_content(self, content: str) -> str:
        """콘텐츠 해시 생성"""
        # 공백 정규화
        normalized = ' '.join(content.split())
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _extract_code_blocks(self, content: str) -> List[Dict[str, Any]]:
        """코드 블록 추출"""
        blocks = []
        lines = content.split('\n')
        
        # 함수/클래스 단위로 블록 추출 (간단한 버전)
        current_block = []
        start_line = 0
        indent_level = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # 빈 줄이나 주석은 스킵
            if not stripped or stripped.startswith('#') or stripped.startswith('//'):
                continue
            
            # 함수/클래스 시작 감지
            if any(keyword in stripped for keyword in ['def ', 'class ', 'function ', 'const ', 'var ', 'let ']):
                # 이전 블록 저장
                if len(current_block) >= self.min_lines:
                    blocks.append({
                        'content': '\n'.join(current_block),
                        'start_line': start_line,
                        'end_line': i
                    })
                
                # 새 블록 시작
                current_block = [line]
                start_line = i
                indent_level = len(line) - len(line.lstrip())
            elif current_block:
                # 현재 블록에 추가
                current_line_indent = len(line) - len(line.lstrip())
                if current_line_indent > indent_level or not stripped:
                    current_block.append(line)
                else:
                    # 블록 종료
                    if len(current_block) >= self.min_lines:
                        blocks.append({
                            'content': '\n'.join(current_block),
                            'start_line': start_line,
                            'end_line': i
                        })
                    current_block = []
        
        # 마지막 블록 처리
        if len(current_block) >= self.min_lines:
            blocks.append({
                'content': '\n'.join(current_block),
                'start_line': start_line,
                'end_line': len(lines)
            })
        
        return blocks