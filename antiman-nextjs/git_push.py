#!/usr/bin/env python3
import subprocess
import os
import signal
import time

os.chdir('/Users/ob/Documents/react/antiman')

# Kill any vim processes
try:
    subprocess.run(['pkill', '-9', 'vim'], stderr=subprocess.DEVNULL)
    subprocess.run(['pkill', '-9', 'vi'], stderr=subprocess.DEVNULL)
    time.sleep(1)
except:
    pass

# Abort any merge
try:
    subprocess.run(['git', 'merge', '--abort'], stderr=subprocess.DEVNULL)
except:
    pass

# Reset to clean state
try:
    subprocess.run(['git', 'reset', '--hard', 'HEAD'], check=True)
    print("Reset to HEAD successfully")
except Exception as e:
    print(f"Reset failed: {e}")

# Force push
try:
    result = subprocess.run(
        ['git', 'push', '-u', 'origin', 'main', '--force'],
        capture_output=True,
        text=True,
        timeout=60
    )
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    print("Return code:", result.returncode)
    
    if result.returncode == 0:
        print("\n✅ Successfully pushed to GitHub!")
    else:
        print("\n❌ Push failed")
except Exception as e:
    print(f"Error during push: {e}")

