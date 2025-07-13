#!/usr/bin/env python3
"""
Halo Workflow CLI - 메인 엔트리 포인트
"""

import os
import sys
import argparse
import json
from pathlib import Path
from typing import Optional

from ..core.analyzer import WorkflowAnalyzer
from ..core.license_manager import LicenseManager
from ..utils.logger import setup_logger
from ..utils.reporter import HTMLReporter, JSONReporter

logger = setup_logger(__name__)


def create_parser():
    """CLI 파서 생성"""
    parser = argparse.ArgumentParser(
        prog='halo-workflow',
        description='AI 코딩 실패율을 90%에서 10%로 줄이는 워크플로우 시각화 도구',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  halo-workflow analyze .                    # 현재 디렉토리 분석
  halo-workflow analyze ./src --output html  # src 폴더 분석 후 HTML 보고서 생성
  halo-workflow report --format json         # JSON 형식으로 보고서 출력
  halo-workflow activate LICENSE-KEY         # 라이선스 활성화
        """
    )
    
    parser.add_argument('--version', action='version', version='%(prog)s 0.1.0')
    
    subparsers = parser.add_subparsers(dest='command', help='사용 가능한 명령어')
    
    # analyze 명령어
    analyze_parser = subparsers.add_parser('analyze', help='프로젝트 분석')
    analyze_parser.add_argument('path', nargs='?', default='.', help='분석할 프로젝트 경로 (기본값: 현재 디렉토리)')
    analyze_parser.add_argument('--output', '-o', choices=['console', 'html', 'json'], default='console', help='출력 형식')
    analyze_parser.add_argument('--output-file', '-f', help='출력 파일 경로')
    analyze_parser.add_argument('--max-files', type=int, help='최대 파일 수 제한')
    analyze_parser.add_argument('--ignore', nargs='*', help='무시할 파일/폴더 패턴')
    analyze_parser.add_argument('--fix', action='store_true', help='자동 수정 시도 (프리미엄 기능)')
    analyze_parser.add_argument('--ci', action='store_true', help='CI/CD 모드 (종료 코드 반환)')
    
    # report 명령어
    report_parser = subparsers.add_parser('report', help='보고서 생성')
    report_parser.add_argument('--format', choices=['html', 'json', 'markdown'], default='html', help='보고서 형식')
    report_parser.add_argument('--output', '-o', help='출력 파일 경로')
    report_parser.add_argument('--open', action='store_true', help='생성 후 자동으로 열기')
    
    # activate 명령어
    activate_parser = subparsers.add_parser('activate', help='라이선스 활성화')
    activate_parser.add_argument('license_key', help='라이선스 키')
    
    # status 명령어
    status_parser = subparsers.add_parser('status', help='라이선스 상태 확인')
    
    return parser


def analyze_command(args):
    """프로젝트 분석 실행"""
    project_path = Path(args.path).resolve()
    
    if not project_path.exists():
        logger.error(f"경로를 찾을 수 없습니다: {project_path}")
        return 1
    
    # 라이선스 확인
    license_manager = LicenseManager()
    is_premium = license_manager.is_premium()
    
    # 무료 버전 파일 수 제한
    max_files = args.max_files
    if not is_premium and not max_files:
        max_files = 100
        logger.info("무료 버전: 최대 100개 파일까지 분석합니다.")
    
    # 분석기 생성
    analyzer = WorkflowAnalyzer(
        max_files=max_files,
        ignore_patterns=args.ignore or [],
        premium_features=is_premium
    )
    
    try:
        logger.info(f"프로젝트 분석 시작: {project_path}")
        
        # 분석 실행
        results = analyzer.analyze(project_path)
        
        # 자동 수정 (프리미엄 기능)
        if args.fix:
            if not is_premium:
                logger.warning("자동 수정은 프리미엄 기능입니다.")
            else:
                logger.info("문제 자동 수정 중...")
                fixed_count = analyzer.auto_fix(results)
                logger.info(f"{fixed_count}개 문제를 자동으로 수정했습니다.")
        
        # 결과 출력
        if args.output == 'console':
            print_results(results)
        elif args.output == 'html':
            output_file = args.output_file or 'halo-report.html'
            reporter = HTMLReporter()
            reporter.generate(results, output_file)
            logger.info(f"HTML 보고서 생성: {output_file}")
        elif args.output == 'json':
            output_file = args.output_file or 'halo-report.json'
            reporter = JSONReporter()
            reporter.generate(results, output_file)
            logger.info(f"JSON 보고서 생성: {output_file}")
        
        # CI 모드: 문제가 있으면 1 반환
        if args.ci:
            error_count = len(results.get('errors', []))
            warning_count = len(results.get('warnings', []))
            if error_count > 0:
                return 1
            elif warning_count > 0:
                return 2
        
        return 0
        
    except Exception as e:
        logger.error(f"분석 중 오류 발생: {e}")
        return 1


def print_results(results):
    """콘솔에 결과 출력"""
    print("\n🔍 Halo Workflow 분석 결과")
    print("=" * 50)
    
    # 요약
    summary = results.get('summary', {})
    print(f"\n📊 요약:")
    print(f"  - 분석된 파일: {summary.get('total_files', 0)}개")
    print(f"  - 발견된 문제: {summary.get('total_issues', 0)}개")
    print(f"  - 오류: {summary.get('error_count', 0)}개")
    print(f"  - 경고: {summary.get('warning_count', 0)}개")
    
    # 주요 문제
    errors = results.get('errors', [])
    if errors:
        print(f"\n❌ 오류 ({len(errors)}개):")
        for i, error in enumerate(errors[:5], 1):
            print(f"  {i}. {error['file']}: {error['message']}")
        if len(errors) > 5:
            print(f"  ... 그 외 {len(errors) - 5}개")
    
    warnings = results.get('warnings', [])
    if warnings:
        print(f"\n⚠️  경고 ({len(warnings)}개):")
        for i, warning in enumerate(warnings[:5], 1):
            print(f"  {i}. {warning['file']}: {warning['message']}")
        if len(warnings) > 5:
            print(f"  ... 그 외 {len(warnings) - 5}개")
    
    # 개선 제안
    suggestions = results.get('suggestions', [])
    if suggestions:
        print(f"\n💡 개선 제안:")
        for suggestion in suggestions[:3]:
            print(f"  - {suggestion}")
    
    print("\n" + "=" * 50)


def report_command(args):
    """보고서 생성"""
    # 최근 분석 결과 로드
    results_file = Path.home() / '.halo-workflow' / 'last-analysis.json'
    
    if not results_file.exists():
        logger.error("분석 결과가 없습니다. 먼저 'halo-workflow analyze'를 실행하세요.")
        return 1
    
    with open(results_file) as f:
        results = json.load(f)
    
    # 보고서 생성
    output_file = args.output
    if args.format == 'html':
        output_file = output_file or 'halo-report.html'
        reporter = HTMLReporter()
        reporter.generate(results, output_file)
    elif args.format == 'json':
        output_file = output_file or 'halo-report.json'
        reporter = JSONReporter()
        reporter.generate(results, output_file)
    elif args.format == 'markdown':
        output_file = output_file or 'halo-report.md'
        # TODO: Markdown reporter 구현
        logger.error("Markdown 형식은 아직 지원되지 않습니다.")
        return 1
    
    logger.info(f"{args.format.upper()} 보고서 생성: {output_file}")
    
    # 자동으로 열기
    if args.open and args.format == 'html':
        import webbrowser
        webbrowser.open(f"file://{Path(output_file).resolve()}")
    
    return 0


def activate_command(args):
    """라이선스 활성화"""
    license_manager = LicenseManager()
    
    try:
        success = license_manager.activate(args.license_key)
        
        if success:
            logger.info("✅ 라이선스가 성공적으로 활성화되었습니다!")
            logger.info("프리미엄 기능을 사용할 수 있습니다.")
        else:
            logger.error("❌ 라이선스 활성화에 실패했습니다.")
            logger.error("라이선스 키를 확인하고 다시 시도하세요.")
            return 1
            
    except Exception as e:
        logger.error(f"라이선스 활성화 중 오류: {e}")
        return 1
    
    return 0


def status_command(args):
    """라이선스 상태 확인"""
    license_manager = LicenseManager()
    
    status = license_manager.get_status()
    
    print("\n📋 Halo Workflow 라이선스 상태")
    print("=" * 40)
    
    if status['is_premium']:
        print(f"✅ 프리미엄 버전")
        print(f"   라이선스 키: {status['license_key'][:8]}...")
        print(f"   만료일: {status['expire_date']}")
    else:
        print(f"🆓 무료 버전")
        print(f"   제한: 파일 100개까지 분석")
        print(f"\n프리미엄 업그레이드: https://halo-workflow.com/pricing")
    
    print("=" * 40)
    return 0


def main():
    """메인 엔트리 포인트"""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 0
    
    # 명령어별 처리
    if args.command == 'analyze':
        return analyze_command(args)
    elif args.command == 'report':
        return report_command(args)
    elif args.command == 'activate':
        return activate_command(args)
    elif args.command == 'status':
        return status_command(args)
    else:
        parser.print_help()
        return 1


if __name__ == '__main__':
    sys.exit(main())