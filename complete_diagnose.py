#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Project Diagnostic Tool - HTML Report Generation
Windows Compatible Version
"""

import os
import re
import json
import ast
import subprocess
import sys
import platform
import argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import mimetypes
import html

class CompleteProjectDiagnostic:
    def __init__(self, target_dir=None):
        self.base_dir = Path(target_dir) if target_dir else Path(__file__).parent
        self.errors = []
        self.warnings = []
        self.info = []
        self.file_stats = defaultdict(int)
        self.all_imports = set()
        self.all_api_endpoints = []
        self.all_api_calls = []
        self.file_tree = {}
        self.data_sources = defaultdict(list)
        self.html_content = []
        self.workflow_mismatches = []
        self.system_info = self.get_system_info()
        
    def get_system_info(self):
        """Get system information"""
        return {
            'platform': platform.system(),
            'platform_version': platform.release(),
            'python_version': sys.version,
            'architecture': platform.architecture()[0],
            'processor': platform.processor(),
            'node_version': self.get_node_version()
        }
    
    def get_node_version(self):
        """Check Node.js version"""
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
            return result.stdout.strip() if result.returncode == 0 else 'Not installed'
        except:
            return 'Not installed'
    
    def add_html(self, content):
        """Add HTML content"""
        self.html_content.append(content)
        
    def run_complete_diagnostic(self):
        """Run complete diagnostic - no time limit"""
        start_time = datetime.now()
        
        print("🔍 Starting complete project diagnostic (no time limit)...")
        print(f"📁 Base directory: {self.base_dir}")
        
        # HTML header
        self.add_html(f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Diagnostic Report - {self.base_dir.name}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        h1, h2, h3 {{
            color: #2c3e50;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .section {{
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .success {{
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin: 5px 0;
        }}
        .warning {{
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 5px 0;
        }}
        .error {{
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin: 5px 0;
        }}
        .info {{
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 10px;
            border-radius: 5px;
            margin: 5px 0;
        }}
        .code {{
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }}
        .stat-item {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }}
        .stat-number {{
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }}
        .progress-bar {{
            width: 100%;
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s ease;
        }}
        .file-tree {{
            font-family: monospace;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
        }}
        .expandable {{
            cursor: pointer;
            user-select: none;
        }}
        .expandable:hover {{
            background-color: #e9ecef;
        }}
        .hidden {{
            display: none;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .table th, .table td {{
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: left;
        }}
        .table th {{
            background-color: #f8f9fa;
            font-weight: 600;
        }}
        .table tr:nth-child(even) {{
            background-color: #f8f9fa;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            border-radius: 4px;
            text-transform: uppercase;
        }}
        .badge-success {{
            background-color: #d4edda;
            color: #155724;
        }}
        .badge-warning {{
            background-color: #fff3cd;
            color: #856404;
        }}
        .badge-error {{
            background-color: #f8d7da;
            color: #721c24;
        }}
        .collapsible {{
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            margin: 10px 0;
        }}
        .collapsible-header {{
            padding: 15px;
            cursor: pointer;
            border-bottom: 1px solid #dee2e6;
            font-weight: 600;
        }}
        .collapsible-content {{
            padding: 15px;
            display: none;
        }}
        .collapsible.active .collapsible-content {{
            display: block;
        }}
        .timeline {{
            position: relative;
            padding-left: 30px;
        }}
        .timeline::before {{
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #667eea;
        }}
        .timeline-item {{
            position: relative;
            margin-bottom: 20px;
        }}
        .timeline-item::before {{
            content: '';
            position: absolute;
            left: -24px;
            top: 5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #667eea;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Project Diagnostic Report</h1>
        <p><strong>Project:</strong> {self.base_dir.name}</p>
        <p><strong>Location:</strong> {self.base_dir}</p>
        <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p><strong>System:</strong> {self.system_info['platform']} {self.system_info['platform_version']}</p>
    </div>
""")

        # Step 1: Project structure analysis
        print("📊 Step 1: Analyzing project structure...")
        self.analyze_project_structure()
        
        # Step 2: Workflow consistency check
        print("🔄 Step 2: Checking workflow consistency...")
        self.check_workflow_consistency()
        
        # Step 3: Dependency analysis
        print("🔗 Step 3: Analyzing dependencies...")
        self.analyze_dependencies()
        
        # Step 4: Type checking
        print("🔍 Step 4: Running type checks...")
        type_results = self.run_type_checks()
        if not type_results['success'] and type_results['errors']:
            print("⚠️  TypeScript type checking found issues")
        
        # Step 5: File system analysis
        print("📁 Step 5: Analyzing file system...")
        self.analyze_file_system()
        
        # Step 6: API analysis
        print("🌐 Step 6: Analyzing API endpoints...")
        self.analyze_api_endpoints()
        
        # Step 7: Generate summary
        print("📋 Step 7: Generating summary...")
        self.generate_summary()
        
        # Close HTML
        self.add_html("""
    <div class="footer">
        <p>Generated by Workflow Visualizer Diagnostic Tool</p>
        <p>Report generated on """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
    </div>
    
    <script>
        // Add interactivity
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', function() {
                this.parentElement.classList.toggle('active');
            });
        });
        
        document.querySelectorAll('.expandable').forEach(item => {
            item.addEventListener('click', function() {
                const target = this.nextElementSibling;
                if (target) {
                    target.classList.toggle('hidden');
                }
            });
        });
    </script>
</body>
</html>
        """)
        
        # Save report
        report_path = self.base_dir / "diagnostic_report.html"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(''.join(self.html_content))
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print(f"✅ Diagnostic completed in {duration.total_seconds():.2f} seconds")
        print(f"📄 Report saved to: {report_path}")
        
        return report_path

    def analyze_project_structure(self):
        """Analyze project structure"""
        structure_info = {
            'total_files': 0,
            'total_directories': 0,
            'file_types': defaultdict(int),
            'largest_files': [],
            'empty_files': []
        }
        
        try:
            for item in self.base_dir.rglob('*'):
                if item.is_file():
                    structure_info['total_files'] += 1
                    suffix = item.suffix.lower()
                    structure_info['file_types'][suffix] += 1
                    
                    # Check file size
                    size = item.stat().st_size
                    if size == 0:
                        structure_info['empty_files'].append(str(item.relative_to(self.base_dir)))
                    else:
                        structure_info['largest_files'].append((str(item.relative_to(self.base_dir)), size))
                        
                elif item.is_dir():
                    structure_info['total_directories'] += 1
            
            # Sort largest files
            structure_info['largest_files'].sort(key=lambda x: x[1], reverse=True)
            structure_info['largest_files'] = structure_info['largest_files'][:10]
            
        except Exception as e:
            self.errors.append(f"Project structure analysis failed: {str(e)}")
        
        # Generate HTML for structure analysis
        self.add_html(f"""
    <div class="section">
        <h2>📊 Project Structure Analysis</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">{structure_info['total_files']}</div>
                <div>Total Files</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{structure_info['total_directories']}</div>
                <div>Total Directories</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{len(structure_info['file_types'])}</div>
                <div>File Types</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{len(structure_info['empty_files'])}</div>
                <div>Empty Files</div>
            </div>
        </div>
        
        <h3>File Type Distribution</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>File Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
        """)
        
        for ext, count in sorted(structure_info['file_types'].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / structure_info['total_files']) * 100
            self.add_html(f"""
                <tr>
                    <td>{ext or 'No extension'}</td>
                    <td>{count}</td>
                    <td>{percentage:.1f}%</td>
                </tr>
            """)
        
        self.add_html("""
            </tbody>
        </table>
        """)
        
        if structure_info['largest_files']:
            self.add_html("<h3>Largest Files</h3><ul>")
            for filename, size in structure_info['largest_files']:
                self.add_html(f"<li>{filename} ({self.format_size(size)})</li>")
            self.add_html("</ul>")
        
        if structure_info['empty_files']:
            self.add_html("<h3>Empty Files</h3><ul>")
            for filename in structure_info['empty_files'][:20]:  # Show first 20
                self.add_html(f"<li>{filename}</li>")
            self.add_html("</ul>")
        
        self.add_html("</div>")

    def check_workflow_consistency(self):
        """Check workflow consistency"""
        consistency_issues = []
        
        # Check for common workflow files
        workflow_files = [
            'package.json',
            'tsconfig.json',
            'src/main.tsx',
            'src/App.tsx',
            'server/index.js'
        ]
        
        missing_files = []
        for file in workflow_files:
            file_path = self.base_dir / file
            if not file_path.exists():
                missing_files.append(file)
        
        if missing_files:
            consistency_issues.append(f"Missing workflow files: {', '.join(missing_files)}")
        
        # Check package.json dependencies
        package_json_path = self.base_dir / 'package.json'
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    
                dependencies = package_data.get('dependencies', {})
                dev_dependencies = package_data.get('devDependencies', {})
                
                # Check for common React dependencies
                required_deps = ['react', 'react-dom']
                missing_deps = [dep for dep in required_deps if dep not in dependencies]
                
                if missing_deps:
                    consistency_issues.append(f"Missing required dependencies: {', '.join(missing_deps)}")
                    
            except Exception as e:
                consistency_issues.append(f"Failed to analyze package.json: {str(e)}")
        
        # Generate HTML for workflow consistency
        self.add_html(f"""
    <div class="section">
        <h2>🔄 Workflow Consistency Check</h2>
        """)
        
        if consistency_issues:
            self.add_html("<h3>Issues Found</h3>")
            for issue in consistency_issues:
                self.add_html(f'<div class="warning">⚠️ {issue}</div>')
        else:
            self.add_html('<div class="success">✅ No workflow consistency issues found</div>')
        
        self.add_html("</div>")

    def analyze_dependencies(self):
        """Analyze project dependencies"""
        dependencies_info = {
            'package_dependencies': [],
            'import_dependencies': [],
            'circular_dependencies': []
        }
        
        # Analyze package.json
        package_json_path = self.base_dir / 'package.json'
        if package_json_path.exists():
            try:
                with open(package_json_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    
                deps = package_data.get('dependencies', {})
                dev_deps = package_data.get('devDependencies', {})
                
                for name, version in deps.items():
                    dependencies_info['package_dependencies'].append({
                        'name': name,
                        'version': version,
                        'type': 'production'
                    })
                
                for name, version in dev_deps.items():
                    dependencies_info['package_dependencies'].append({
                        'name': name,
                        'version': version,
                        'type': 'development'
                    })
                    
            except Exception as e:
                self.errors.append(f"Failed to analyze package.json: {str(e)}")
        
        # Analyze import statements (limit to src directory for performance)
        try:
            src_dir = self.base_dir / 'src'
            if src_dir.exists():
                for file_path in src_dir.rglob('*.{ts,tsx,js,jsx}'):
                    if file_path.is_file():
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                content = f.read()
                                
                            # Find import statements
                            import_pattern = r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]'
                            imports = re.findall(import_pattern, content)
                            
                            for imp in imports:
                                dependencies_info['import_dependencies'].append({
                                    'file': str(file_path.relative_to(self.base_dir)),
                                    'import': imp
                                })
                                
                        except Exception as e:
                            continue
                            
        except Exception as e:
            self.errors.append(f"Failed to analyze imports: {str(e)}")
        
        # Generate HTML for dependencies
        self.add_html(f"""
    <div class="section">
        <h2>🔗 Dependencies Analysis</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">{len([d for d in dependencies_info['package_dependencies'] if d['type'] == 'production'])}</div>
                <div>Production Dependencies</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{len([d for d in dependencies_info['package_dependencies'] if d['type'] == 'development'])}</div>
                <div>Development Dependencies</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">{len(set(d['import'] for d in dependencies_info['import_dependencies']))}</div>
                <div>Unique Imports</div>
            </div>
        </div>
        
        <div class="collapsible">
            <div class="collapsible-header">📦 Package Dependencies</div>
            <div class="collapsible-content">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Package</th>
                            <th>Version</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
        """)
        
        for dep in dependencies_info['package_dependencies']:
            badge_class = 'badge-success' if dep['type'] == 'production' else 'badge-warning'
            self.add_html(f"""
                <tr>
                    <td>{dep['name']}</td>
                    <td>{dep['version']}</td>
                    <td><span class="badge {badge_class}">{dep['type']}</span></td>
                </tr>
            """)
        
        self.add_html("""
                    </tbody>
                </table>
            </div>
        </div>
        </div>
        """)

    def run_type_checks(self):
        """Run TypeScript type checking"""
        type_check_results = {
            'success': False,
            'errors': [],
            'warnings': []
        }
        
        tsconfig_path = self.base_dir / 'tsconfig.json'
        if tsconfig_path.exists():
            try:
                # Check if node_modules exists
                node_modules_path = self.base_dir / 'node_modules'
                if not node_modules_path.exists():
                    type_check_results['warnings'].append("node_modules not found. Run 'npm install' first.")
                    return type_check_results
                
                # Run TypeScript type checking
                print("  Running: npx tsc --noEmit")
                result = subprocess.run(
                    ['npx', 'tsc', '--noEmit'],
                    cwd=self.base_dir,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    shell=True if platform.system() == 'Windows' else False
                )
                print(f"  Exit code: {result.returncode}")
                
                if result.returncode == 0:
                    type_check_results['success'] = True
                    if result.stdout.strip():
                        type_check_results['warnings'].append(result.stdout)
                else:
                    # Combine stdout and stderr for better error reporting
                    error_output = result.stdout + result.stderr
                    if error_output.strip():
                        type_check_results['errors'] = [line for line in error_output.split('\n') if line.strip()]
                    else:
                        type_check_results['errors'].append("TypeScript compilation failed with no output")
                    
            except subprocess.TimeoutExpired:
                type_check_results['errors'].append("TypeScript check timed out (120 seconds)")
            except FileNotFoundError:
                type_check_results['errors'].append("TypeScript compiler not found. Install with: npm install -g typescript")
            except Exception as e:
                type_check_results['errors'].append(f"TypeScript check failed: {str(e)}")
        else:
            type_check_results['warnings'].append("No tsconfig.json found")
        
        # Generate HTML for type checking
        self.add_html(f"""
    <div class="section">
        <h2>🔍 TypeScript Type Checking</h2>
        """)
        
        if type_check_results['success']:
            self.add_html('<div class="success">✅ TypeScript type checking passed successfully</div>')
        elif type_check_results['errors']:
            self.add_html('<div class="error">❌ TypeScript type checking failed</div>')
            self.add_html('<div class="collapsible">')
            self.add_html('<div class="collapsible-header">Type Errors Details</div>')
            self.add_html('<div class="collapsible-content">')
            self.add_html('<div class="code">')
            for error in type_check_results['errors']:
                if error.strip():
                    self.add_html(html.escape(error) + '\n')
            self.add_html('</div>')
            self.add_html('</div>')
            self.add_html('</div>')
        else:
            self.add_html('<div class="info">ℹ️ TypeScript type checking was skipped</div>')
        
        for warning in type_check_results['warnings']:
            self.add_html(f'<div class="warning">⚠️ {warning}</div>')
        
        # Add type checking tips
        self.add_html(f"""
        <div class="collapsible">
            <div class="collapsible-header">💡 Type Checking Tips</div>
            <div class="collapsible-content">
                <ul>
                    <li>Run <code>npm install</code> to install dependencies</li>
                    <li>Check <code>tsconfig.json</code> configuration</li>
                    <li>Use <code>npx tsc --noEmit</code> for manual type checking</li>
                    <li>Enable strict mode for better type safety</li>
                    <li>Use <code>// @ts-ignore</code> sparingly for quick fixes</li>
                </ul>
            </div>
        </div>
        """)
        
        self.add_html("</div>")
        
        return type_check_results

    def analyze_file_system(self):
        """Analyze file system structure"""
        fs_info = {
            'src_structure': {},
            'server_structure': {},
            'config_files': []
        }
        
        # Analyze src directory
        src_path = self.base_dir / 'src'
        if src_path.exists():
            fs_info['src_structure'] = self.build_directory_tree(src_path)
        
        # Analyze server directory
        server_path = self.base_dir / 'server'
        if server_path.exists():
            fs_info['server_structure'] = self.build_directory_tree(server_path)
        
        # Find config files
        config_extensions = ['.json', '.js', '.ts', '.config.js', '.config.ts']
        config_names = ['package.json', 'tsconfig.json', 'vite.config.js', 'vite.config.ts']
        
        for item in self.base_dir.iterdir():
            if item.is_file():
                if item.name in config_names or any(item.name.endswith(ext) for ext in config_extensions):
                    fs_info['config_files'].append(item.name)
        
        # Generate HTML for file system
        self.add_html(f"""
    <div class="section">
        <h2>📁 File System Analysis</h2>
        
        <h3>Configuration Files</h3>
        <ul>
        """)
        
        for config_file in fs_info['config_files']:
            self.add_html(f"<li>{config_file}</li>")
        
        self.add_html("</ul>")
        
        if fs_info['src_structure']:
            self.add_html("<h3>Source Structure</h3>")
            self.add_html('<div class="file-tree">')
            self.render_directory_tree(fs_info['src_structure'], 'src')
            self.add_html('</div>')
        
        if fs_info['server_structure']:
            self.add_html("<h3>Server Structure</h3>")
            self.add_html('<div class="file-tree">')
            self.render_directory_tree(fs_info['server_structure'], 'server')
            self.add_html('</div>')
        
        self.add_html("</div>")

    def analyze_api_endpoints(self):
        """Analyze API endpoints"""
        api_info = {
            'endpoints': [],
            'routes': [],
            'middleware': []
        }
        
        # Analyze server files for API endpoints
        server_path = self.base_dir / 'server'
        if server_path.exists():
            for file_path in server_path.rglob('*.js'):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Find API routes
                    route_patterns = [
                        r'app\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
                        r'router\.(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"]',
                        r'\.route\([\'"]([^\'"]+)[\'"][^.]*\.(get|post|put|delete|patch)'
                    ]
                    
                    for pattern in route_patterns:
                        matches = re.findall(pattern, content)
                        for match in matches:
                            if len(match) == 2:
                                method, route = match
                                api_info['endpoints'].append({
                                    'method': method.upper(),
                                    'route': route,
                                    'file': str(file_path.relative_to(self.base_dir))
                                })
                                
                except Exception as e:
                    continue
        
        # Generate HTML for API analysis
        self.add_html(f"""
    <div class="section">
        <h2>🌐 API Endpoints Analysis</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">{len(api_info['endpoints'])}</div>
                <div>API Endpoints</div>
            </div>
        </div>
        
        <table class="table">
            <thead>
                <tr>
                    <th>Method</th>
                    <th>Route</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody>
        """)
        
        for endpoint in api_info['endpoints']:
            method_class = {
                'GET': 'badge-success',
                'POST': 'badge-warning',
                'PUT': 'badge-warning',
                'DELETE': 'badge-error',
                'PATCH': 'badge-warning'
            }.get(endpoint['method'], 'badge-info')
            
            self.add_html(f"""
                <tr>
                    <td><span class="badge {method_class}">{endpoint['method']}</span></td>
                    <td>{endpoint['route']}</td>
                    <td>{endpoint['file']}</td>
                </tr>
            """)
        
        self.add_html("""
            </tbody>
        </table>
        </div>
        """)

    def generate_summary(self):
        """Generate diagnostic summary"""
        total_errors = len(self.errors)
        total_warnings = len(self.warnings)
        
        self.add_html(f"""
    <div class="section">
        <h2>📋 Diagnostic Summary</h2>
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" style="color: #dc3545;">{total_errors}</div>
                <div>Errors</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #ffc107;">{total_warnings}</div>
                <div>Warnings</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" style="color: #28a745;">{len(self.info)}</div>
                <div>Information</div>
            </div>
        </div>
        """)
        
        if self.errors:
            self.add_html("<h3>Errors</h3>")
            for error in self.errors:
                self.add_html(f'<div class="error">❌ {error}</div>')
        
        if self.warnings:
            self.add_html("<h3>Warnings</h3>")
            for warning in self.warnings:
                self.add_html(f'<div class="warning">⚠️ {warning}</div>')
        
        if self.info:
            self.add_html("<h3>Information</h3>")
            for info in self.info:
                self.add_html(f'<div class="info">ℹ️ {info}</div>')
        
        self.add_html("</div>")

    def build_directory_tree(self, path, max_depth=3, current_depth=0):
        """Build directory tree structure"""
        if current_depth >= max_depth:
            return {}
        
        tree = {}
        try:
            for item in path.iterdir():
                if item.is_dir():
                    tree[item.name] = {
                        'type': 'directory',
                        'children': self.build_directory_tree(item, max_depth, current_depth + 1)
                    }
                else:
                    tree[item.name] = {
                        'type': 'file',
                        'size': item.stat().st_size
                    }
        except PermissionError:
            tree['<Permission Denied>'] = {'type': 'error'}
        
        return tree

    def render_directory_tree(self, tree, name, indent=0):
        """Render directory tree as HTML"""
        indent_str = "  " * indent
        
        if not tree:
            return
        
        self.add_html(f"{indent_str}{name}/\n")
        
        for key, value in tree.items():
            if value['type'] == 'directory':
                self.render_directory_tree(value.get('children', {}), key, indent + 1)
            elif value['type'] == 'file':
                size_str = self.format_size(value['size'])
                self.add_html(f"{indent_str}  {key} ({size_str})\n")
            else:
                self.add_html(f"{indent_str}  {key}\n")

    def format_size(self, size):
        """Format file size in human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

def main():
    parser = argparse.ArgumentParser(description='Complete Project Diagnostic Tool')
    parser.add_argument('--dir', '-d', help='Target directory to analyze', default='.')
    parser.add_argument('--output', '-o', help='Output HTML file path')
    parser.add_argument('--open', action='store_true', help='Open report in browser after generation')
    
    args = parser.parse_args()
    
    # Create diagnostic instance
    diagnostic = CompleteProjectDiagnostic(args.dir)
    
    try:
        # Run complete diagnostic
        report_path = diagnostic.run_complete_diagnostic()
        
        print(f"\n✅ Diagnostic completed successfully!")
        print(f"📄 Report location: {report_path}")
        
        # Open report if requested
        if args.open:
            import webbrowser
            webbrowser.open(f"file://{report_path.absolute()}")
            
    except KeyboardInterrupt:
        print("\n❌ Diagnostic interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Diagnostic failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()