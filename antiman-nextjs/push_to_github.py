#!/usr/bin/env python3
import subprocess
import os
import shutil
import sys

os.chdir('/Users/ob/Documents/react/antiman')

log_file = open('/tmp/git_push_log.txt', 'w')

def log(msg):
    print(msg)
    log_file.write(msg + '\n')
    log_file.flush()

try:
    log("=== Starting Git Push Process ===")
    
    log("Step 1: Killing vim processes...")
    subprocess.run(['pkill', '-9', 'vim'], stderr=subprocess.DEVNULL)
    subprocess.run(['pkill', '-9', 'vi'], stderr=subprocess.DEVNULL)
    log("Done")
    
    log("\nStep 2: Removing .git directory...")
    if os.path.exists('.git'):
        # Use rm -rf to forcefully remove
        result = subprocess.run(['rm', '-rf', '.git'], capture_output=True, text=True)
        log(f"Removed .git directory - Output: {result.stdout}, Error: {result.stderr}")
    else:
        log(".git directory not found")
    
    log("\nStep 3: Initializing new git repository...")
    result = subprocess.run(['git', 'init'], capture_output=True, text=True)
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    
    log("\nStep 4: Adding all files...")
    result = subprocess.run(['git', 'add', '.'], capture_output=True, text=True)
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    
    log("\nStep 5: Creating commit...")
    result = subprocess.run(
        ['git', 'commit', '-m', 'Hummane HR System with Security Enhancements'],
        capture_output=True,
        text=True
    )
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    log(f"Return code: {result.returncode}")
    
    log("\nStep 6: Adding remote...")
    result = subprocess.run(
        ['git', 'remote', 'add', 'origin', 'https://github.com/bangasho83/hummane.git'],
        capture_output=True,
        text=True
    )
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    
    log("\nStep 7: Setting branch to main...")
    result = subprocess.run(['git', 'branch', '-M', 'main'], capture_output=True, text=True)
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    
    log("\nStep 8: Force pushing to GitHub...")
    result = subprocess.run(
        ['git', 'push', '-u', 'origin', 'main', '--force'],
        capture_output=True,
        text=True,
        timeout=60
    )
    log(f"STDOUT: {result.stdout}")
    log(f"STDERR: {result.stderr}")
    log(f"Return code: {result.returncode}")
    
    if result.returncode == 0:
        log("\n✅ SUCCESS: Pushed to GitHub!")
    else:
        log(f"\n❌ FAILED: Push failed with return code {result.returncode}")
        
except Exception as e:
    log(f"\n❌ EXCEPTION: {str(e)}")
    import traceback
    log(traceback.format_exc())

finally:
    log("\n=== Process Complete ===")
    log_file.close()
    print("\nLog written to /tmp/git_push_log.txt")

