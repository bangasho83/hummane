#!/bin/bash
set -e
cd /Users/ob/Documents/react/antiman

# Kill any vim processes
pkill -9 vim 2>/dev/null || true
pkill -9 vi 2>/dev/null || true

# Abort any merge in progress
git merge --abort 2>/dev/null || true

# Reset to our local state
git reset --hard HEAD

# Force push to remote
git push -u origin main --force

echo "Push completed successfully!"

