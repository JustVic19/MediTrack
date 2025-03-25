#!/bin/bash

# Run this script to initiate an automatic GitHub push
# This is useful for manual updates or to be called from an external scheduler

# Colors for terminal output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${GREEN}Running Git auto-push script...${NC}"

# Execute the auto-push script
"$SCRIPT_DIR/git-auto-push.sh"