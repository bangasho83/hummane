#!/usr/bin/env python3
import subprocess
import os

os.chdir('/Users/ob/Documents/react/antiman')

log_file = open('/tmp/simple_push_log.txt', 'w')

def log(msg):
    print(msg)
    log_file.write(msg + '\n')
    log_file.flush()

try:
    log("=== Pushing to GitHub ===")
    
    log("\nStep 1: Killing vim processes...")
    subprocess.run(['pkill', '-9', 'vim'], stderr=subprocess.DEVNULL)
    subprocess.run(['pkill', '-9', 'vi'], stderr=subprocess.DEVNULL)
    log("Done")
    
    log("\nStep 2: Aborting any merge...")
    result = subprocess.run(['git', 'merge', '--abort'], capture_output=True, text=True)
    log(f"Output: {result.stdout}")
    log(f"Error: {result.stderr}")
    
    log("\nStep 3: Checking git status...")
    result = subprocess.run(['git', 'status'], capture_output=True, text=True)
    log(f"Status:\n{result.stdout}")
    
    log("\nStep 4: Force pushing to GitHub...")
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
        log("\n✅ SUCCESS: Code pushed to GitHub!")
    else:
        log(f"\n❌ FAILED: Push failed with return code {result.returncode}")
        
except Exception as e:
    log(f"\n❌ EXCEPTION: {str(e)}")
    import traceback
    log(traceback.format_exc())

finally:
    log("\n=== Done ===")
    log_file.close()

