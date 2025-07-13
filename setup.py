"""
Halo Workflow 패키지 설정
"""

from setuptools import setup, find_packages
from pathlib import Path

# README 읽기
readme_file = Path(__file__).parent / "README.md"
if readme_file.exists():
    long_description = readme_file.read_text(encoding='utf-8')
else:
    long_description = """
# Halo Workflow

AI 코딩 실패율을 90%에서 10%로 줄이는 워크플로우 시각화 도구

## 주요 기능
- 하드코딩 탐지
- 더미 데이터 검출
- 중복 코드 찾기
- API 흐름 분석
- 시각화 보고서 생성

## 설치
```bash
pip install halo-workflow
```

## 사용법
```bash
halo-workflow analyze .
```
"""

setup(
    name="halo-workflow",
    version="0.1.0",
    author="Halo Workflow Team",
    author_email="support@halo-workflow.com",
    description="AI 코딩 실패율을 90%에서 10%로 줄이는 워크플로우 시각화 도구",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/halo-workflow/halo-workflow",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Quality Assurance",
        "Topic :: Software Development :: Testing",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
        "click>=8.0.0",
        "colorama>=0.4.4",
        "jinja2>=3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "flake8>=5.0.0",
            "mypy>=0.990",
        ],
    },
    entry_points={
        "console_scripts": [
            "halo-workflow=halo_workflow.cli.main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "halo_workflow": ["templates/*.html", "static/*"],
    },
    zip_safe=False,
)