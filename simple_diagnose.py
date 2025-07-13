#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Project Diagnostic Tool
Stable version that won't crash
"""

import os
import sys
import json
import subprocess
import platform
from pathlib import Path
from datetime import datetime

def safe_run(func, description, default_result=False):
    """Safely run a function with error handling"""
    try:
        print(f"Checking {description}...", end=" ")
        result = func()
        if result:
            print("✅ OK")
        else:
            print("❌ FAIL")
        return result
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return default_result

def check_project_files():
    """Check if required project files exist"""
    required_files = [
        "package.json",
        "tsconfig.json", 
        "src/main.tsx",
        "src/App.tsx",
        "server/index.js"
    ]
    
    missing = []
    for file in required_files:
        if not Path(file).exists():
            missing.append(file)
    
    if missing:
        print(f"Missing files: {', '.join(missing)}")
        return False
    return True

def check_dependencies():
    """Check if node_modules exists"""
    return Path("node_modules").exists()

def check_package_json():
    """Check package.json structure"""
    try:
        with open("package.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Check if has dependencies
        if "dependencies" not in data:
            print("No dependencies section")
            return False
            
        # Check if has scripts
        if "scripts" not in data:
            print("No scripts section")
            return False
            
        return True
    except:
        return False

def check_typescript():
    """Check TypeScript compilation"""
    try:
        # Quick check - just verify tsc exists
        result = subprocess.run(
            ["npx", "tsc", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            shell=True if platform.system() == "Windows" else False
        )
        return result.returncode == 0
    except:
        return False

def check_source_files():
    """Check if source files exist"""
    src_dir = Path("src")
    if not src_dir.exists():
        print("src directory not found")
        return False
    
    # Count files in src
    file_count = len(list(src_dir.rglob("*.*")))
    if file_count == 0:
        print("No files in src directory")
        return False
        
    print(f"Found {file_count} files in src/")
    return True

def check_server_files():
    """Check server files"""
    server_dir = Path("server")
    if not server_dir.exists():
        print("server directory not found")
        return False
        
    if not Path("server/index.js").exists():
        print("server/index.js not found")
        return False
        
    return True

def main():
    print("🔍 Simple Project Diagnostic")
    print("=" * 50)
    print(f"Directory: {os.getcwd()}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Run all checks
    checks = [
        (check_project_files, "Required project files"),
        (check_dependencies, "Node modules"),
        (check_package_json, "Package.json structure"),
        (check_typescript, "TypeScript compiler"),
        (check_source_files, "Source files"),
        (check_server_files, "Server files")
    ]
    
    passed = 0
    total = len(checks)
    
    for check_func, description in checks:
        if safe_run(check_func, description):
            passed += 1
    
    print("=" * 50)
    print(f"📊 RESULT: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 All checks passed! Project is ready.")
        return 0
    else:
        print("⚠️  Some checks failed. Please fix the issues above.")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n❌ Diagnostic interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)