"""
로깅 설정
"""

import logging
import sys
from pathlib import Path


def setup_logger(name: str) -> logging.Logger:
    """로거 설정"""
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        # 콘솔 핸들러
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        
        # 포맷터
        formatter = logging.Formatter(
            '%(levelname)s: %(message)s'
        )
        console_handler.setFormatter(formatter)
        
        # 로거에 핸들러 추가
        logger.addHandler(console_handler)
        logger.setLevel(logging.INFO)
    
    return logger