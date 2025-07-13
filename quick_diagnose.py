#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Project Diagnostic Tool
Fast diagnostic for immediate feedback
"""

import os
import sys
import platform
import subprocess
import json
from pathlib import Path
from datetime import datetime

class QuickDiagnostic:
    def __init__(self, target_dir=None):
        self.base_dir = Path(target_dir) if target_dir else Path(__file__).parent
        self.issues = []
        self.success = []
        
    def run_quick_diagnostic(self):
        """Run quick diagnostic checks"""
        print("🚀 Quick Project Diagnostic")
        print("=" * 50)
        
        # Check 1: Project structure
        print("1. Project Structure...", end=" ")
        if self.check_project_structure():
            print("✅ OK")
        else:
            print("❌ FAIL")
            
        # Check 2: Dependencies
        print("2. Dependencies...", end=" ")
        if self.check_dependencies():
            print("✅ OK")
        else:
            print("❌ FAIL")
            
        # Check 3: TypeScript
        print("3. TypeScript...", end=" ")
        if self.check_typescript():
            print("✅ OK")
        else:
            print("❌ FAIL")
            
        # Check 4: Build
        print("4. Build Test...", end=" ")
        if self.check_build():
            print("✅ OK")
        else:
            print("❌ FAIL")
            
        # Summary
        print("\n" + "=" * 50)
        print("📊 SUMMARY")
        print("=" * 50)
        
        if self.issues:
            print("❌ Issues Found:")
            for issue in self.issues:
                print(f"  • {issue}")
        
        if self.success:
            print("✅ Success:")
            for item in self.success:
                print(f"  • {item}")
                
        if not self.issues:
            print("🎉 All checks passed!")
            
        return len(self.issues) == 0
        
    def check_project_structure(self):
        """Check basic project structure"""
        required_files = [
            'package.json',
            'tsconfig.json',
            'src/main.tsx',
            'src/App.tsx'
        ]
        
        missing = []
        for file in required_files:
            if not (self.base_dir / file).exists():
                missing.append(file)
                
        if missing:
            self.issues.append(f"Missing files: {', '.join(missing)}")
            return False
        else:
            self.success.append("Project structure is complete")
            return True
            
    def check_dependencies(self):
        """Check if dependencies are installed"""
        node_modules = self.base_dir / 'node_modules'
        if not node_modules.exists():
            self.issues.append("node_modules not found - run 'npm install'")
            return False
        
        # Check package.json
        package_json = self.base_dir / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                deps = data.get('dependencies', {})
                if 'react' not in deps:
                    self.issues.append("React dependency missing")
                    return False
                    
            except Exception as e:
                self.issues.append(f"Failed to read package.json: {e}")
                return False
        
        self.success.append("Dependencies are installed")
        return True
        
    def check_typescript(self):
        """Check TypeScript compilation"""
        try:
            result = subprocess.run(
                ['npx', 'tsc', '--noEmit'],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=30,
                shell=True if platform.system() == 'Windows' else False
            )
            
            if result.returncode == 0:
                self.success.append("TypeScript compilation successful")
                return True
            else:
                error_count = result.stdout.count('error TS')
                self.issues.append(f"TypeScript errors found: {error_count} errors")
                return False
                
        except subprocess.TimeoutExpired:
            self.issues.append("TypeScript check timed out")
            return False
        except Exception as e:
            self.issues.append(f"TypeScript check failed: {e}")
            return False
            
    def check_build(self):
        """Check if build works"""
        try:
            result = subprocess.run(
                ['npm', 'run', 'build'],
                cwd=self.base_dir,
                capture_output=True,
                text=True,
                timeout=60,
                shell=True if platform.system() == 'Windows' else False
            )
            
            if result.returncode == 0:
                self.success.append("Build successful")
                return True
            else:
                self.issues.append("Build failed")
                return False
                
        except subprocess.TimeoutExpired:
            self.issues.append("Build timed out")
            return False
        except Exception as e:
            self.issues.append(f"Build check failed: {e}")
            return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Quick Project Diagnostic')
    parser.add_argument('--dir', '-d', help='Target directory', default='.')
    
    args = parser.parse_args()
    
    diagnostic = QuickDiagnostic(args.dir)
    success = diagnostic.run_quick_diagnostic()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()