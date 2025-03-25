#!/bin/bash

# Setup Git Auto-Push Cron Job
# This script sets up a cron job to automatically push to GitHub

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the absolute path to the git-auto-push.sh script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_PUSH_SCRIPT="${SCRIPT_DIR}/git-auto-push.sh"

# Make the scripts executable
chmod +x "$AUTO_PUSH_SCRIPT"
chmod +x "${SCRIPT_DIR}/setup-git-cron.sh"

# Create a temporary crontab file
TEMP_CRONTAB=$(mktemp)

# Export existing crontab to the temporary file
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "# MediTrack Cron Jobs" > "$TEMP_CRONTAB"

# Check if the cron job already exists
if grep -q "git-auto-push.sh" "$TEMP_CRONTAB"; then
    echo -e "${YELLOW}Auto-push cron job already exists.${NC}"
else
    # Add the new cron job to run every hour
    echo "# Run git auto-push every hour" >> "$TEMP_CRONTAB"
    echo "0 * * * * $AUTO_PUSH_SCRIPT >> ${SCRIPT_DIR}/git-auto-push.log 2>&1" >> "$TEMP_CRONTAB"
    
    # Install the updated crontab
    crontab "$TEMP_CRONTAB"
    echo -e "${GREEN}Git auto-push cron job has been set up to run every hour.${NC}"
fi

# Clean up the temporary file
rm "$TEMP_CRONTAB"

echo -e "${GREEN}You can manually run ${SCRIPT_DIR}/git-auto-push.sh at any time to push changes.${NC}"