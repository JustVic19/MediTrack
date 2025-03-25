#!/bin/bash

# Auto GitHub Push Script
# This script automatically commits and pushes changes to GitHub

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if there are any changes
if [[ -z $(git status -s) ]]; then
    echo -e "${BLUE}No changes detected. Nothing to commit.${NC}"
    exit 0
fi

# Get current timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes
echo -e "${GREEN}Adding changes...${NC}"
git add .

# Commit with timestamp
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "Auto update: ${TIMESTAMP}"

# Push to GitHub
echo -e "${GREEN}Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}Update completed successfully!${NC}"