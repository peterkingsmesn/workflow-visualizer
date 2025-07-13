"""
Halo Workflow - AI 코딩 실패율을 90%에서 10%로 줄이는 워크플로우 시각화 도구
"""

__version__ = "0.1.0"
__author__ = "Halo Workflow Team"
__license__ = "MIT"

from .core.analyzer import WorkflowAnalyzer
from .cli.main import main

__all__ = ["WorkflowAnalyzer", "main"]