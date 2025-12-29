#!/usr/bin/env python3
import subprocess
import os
import shutil

os.chdir('/Users/ob/Documents/react/antiman')

print("Killing vim processes...")
subprocess.run(['pkill', '-9', 'vim'], stderr=subprocess.DEVNULL)
subprocess.run(['pkill', '-9', 'vi'], stderr=subprocess.DEVNULL)

print("Removing .git directory...")
if os.path.exists('.git'):
    shutil.rmtree('.git')

print("Initializing new git repository...")
subprocess.run(['git', 'init'], check=True)

print("Adding all files...")
subprocess.run(['git', 'add', '.'], check=True)

print("Creating commit...")
result = subprocess.run(
    ['git', 'commit', '-m', 'Hummane HR System with Security Enhancements\n\n- Password hashing with bcryptjs\n- Input sanitization and XSS protection\n- Zod validation for all forms\n- Error boundaries and comprehensive error handling\n- Enhanced password requirements\n- Real-time form validation\n- Comprehensive documentation'],
    capture_output=True,
    text=True
)
print(result.stdout)
print(result.stderr)

print("Adding remote...")
subprocess.run(['git', 'remote', 'add', 'origin', 'https://github.com/bangasho83/hummane.git'], stderr=subprocess.DEVNULL)

print("Setting branch to main...")
subprocess.run(['git', 'branch', '-M', 'main'], check=True)

print("Force pushing to GitHub...")
result = subprocess.run(
    ['git', 'push', '-u', 'origin', 'main', '--force'],
    capture_output=True,
    text=True,
    timeout=60
)

print("\n=== PUSH OUTPUT ===")
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)

if result.returncode == 0:
    print("\n✅ Successfully pushed to GitHub!")
else:
    print("\n❌ Push failed with return code:", result.returncode)

