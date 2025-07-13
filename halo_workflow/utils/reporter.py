"""
보고서 생성기
"""

import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime


class HTMLReporter:
    """HTML 보고서 생성"""
    
    def generate(self, results: Dict[str, Any], output_file: str):
        """HTML 보고서 생성"""
        html_content = self._generate_html(results)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
    
    def _generate_html(self, results: Dict[str, Any]) -> str:
        """HTML 콘텐츠 생성"""
        summary = results.get('summary', {})
        errors = results.get('errors', [])
        warnings = results.get('warnings', [])
        suggestions = results.get('suggestions', [])
        
        html = f"""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halo Workflow 분석 보고서</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .summary-card {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }}
        .summary-card h3 {{
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
        }}
        .summary-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }}
        .summary-card.error {{
            border-top: 4px solid #e53e3e;
        }}
        .summary-card.warning {{
            border-top: 4px solid #dd6b20;
        }}
        .summary-card.success {{
            border-top: 4px solid #38a169;
        }}
        .section {{
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }}
        .section h2 {{
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }}
        .issue {{
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid;
        }}
        .issue.error {{
            background-color: #fee;
            border-color: #e53e3e;
        }}
        .issue.warning {{
            background-color: #fffaf0;
            border-color: #dd6b20;
        }}
        .issue-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
        }}
        .issue-file {{
            font-weight: bold;
            color: #2d3748;
        }}
        .issue-line {{
            color: #666;
            font-size: 0.9em;
        }}
        .issue-message {{
            color: #4a5568;
        }}
        .suggestion {{
            padding: 15px;
            margin-bottom: 10px;
            background-color: #f0f9ff;
            border-left: 4px solid #3182ce;
            border-radius: 5px;
        }}
        .footer {{
            text-align: center;
            margin-top: 50px;
            color: #666;
            font-size: 0.9em;
        }}
        .chart {{
            margin: 20px 0;
        }}
        .bar {{
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }}
        .bar-label {{
            width: 100px;
            text-align: right;
            margin-right: 10px;
            font-size: 0.9em;
        }}
        .bar-container {{
            flex: 1;
            background: #eee;
            border-radius: 5px;
            height: 20px;
            position: relative;
        }}
        .bar-fill {{
            background: #667eea;
            height: 100%;
            border-radius: 5px;
            transition: width 0.3s ease;
        }}
        .bar-value {{
            position: absolute;
            right: 5px;
            top: 0;
            line-height: 20px;
            font-size: 0.8em;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Halo Workflow 분석 보고서</h1>
        <p>생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p>프로젝트: {results.get('project_path', 'Unknown')}</p>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>분석된 파일</h3>
            <div class="value">{summary.get('total_files', 0)}</div>
        </div>
        <div class="summary-card error">
            <h3>오류</h3>
            <div class="value">{summary.get('error_count', 0)}</div>
        </div>
        <div class="summary-card warning">
            <h3>경고</h3>
            <div class="value">{summary.get('warning_count', 0)}</div>
        </div>
        <div class="summary-card success">
            <h3>총 문제</h3>
            <div class="value">{summary.get('total_issues', 0)}</div>
        </div>
    </div>
"""
        
        # 문제 타입별 차트
        if summary.get('issue_types'):
            html += """
    <div class="section">
        <h2>📊 문제 유형별 분석</h2>
        <div class="chart">
"""
            total_issues = sum(summary['issue_types'].values())
            for issue_type, count in sorted(summary['issue_types'].items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total_issues * 100) if total_issues > 0 else 0
                html += f"""
            <div class="bar">
                <div class="bar-label">{issue_type}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: {percentage}%"></div>
                    <div class="bar-value">{count}</div>
                </div>
            </div>
"""
            html += """
        </div>
    </div>
"""
        
        # 오류 섹션
        if errors:
            html += f"""
    <div class="section">
        <h2>❌ 오류 ({len(errors)}개)</h2>
"""
            for error in errors[:20]:  # 최대 20개만 표시
                html += f"""
        <div class="issue error">
            <div class="issue-header">
                <span class="issue-file">{error.get('file', 'Unknown')}</span>
                <span class="issue-line">Line {error.get('line', '?')}</span>
            </div>
            <div class="issue-message">{error.get('message', '')}</div>
        </div>
"""
            if len(errors) > 20:
                html += f"""
        <div style="text-align: center; margin-top: 20px; color: #666;">
            ... 그 외 {len(errors) - 20}개의 오류
        </div>
"""
            html += """
    </div>
"""
        
        # 경고 섹션
        if warnings:
            html += f"""
    <div class="section">
        <h2>⚠️ 경고 ({len(warnings)}개)</h2>
"""
            for warning in warnings[:20]:  # 최대 20개만 표시
                html += f"""
        <div class="issue warning">
            <div class="issue-header">
                <span class="issue-file">{warning.get('file', 'Unknown')}</span>
                <span class="issue-line">Line {warning.get('line', '?')}</span>
            </div>
            <div class="issue-message">{warning.get('message', '')}</div>
        </div>
"""
            if len(warnings) > 20:
                html += f"""
        <div style="text-align: center; margin-top: 20px; color: #666;">
            ... 그 외 {len(warnings) - 20}개의 경고
        </div>
"""
            html += """
    </div>
"""
        
        # 개선 제안 섹션
        if suggestions:
            html += """
    <div class="section">
        <h2>💡 개선 제안</h2>
"""
            for suggestion in suggestions:
                html += f"""
        <div class="suggestion">
            {suggestion}
        </div>
"""
            html += """
    </div>
"""
        
        # 푸터
        html += """
    <div class="footer">
        <p>Halo Workflow v0.1.0 - AI 코딩 실패율을 90%에서 10%로</p>
        <p><a href="https://halo-workflow.com" style="color: #667eea;">https://halo-workflow.com</a></p>
    </div>
</body>
</html>
"""
        
        return html


class JSONReporter:
    """JSON 보고서 생성"""
    
    def generate(self, results: Dict[str, Any], output_file: str):
        """JSON 보고서 생성"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False, default=str)