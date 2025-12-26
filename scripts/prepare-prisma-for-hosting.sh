#!/bin/bash

# Script to prepare Prisma Client for hosting
# This script generates Prisma Client locally and creates a tar.gz file for upload

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Prisma Client Preparation for Hosting${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found!${NC}"
    echo -e "${YELLOW}Please run this script from the backend directory${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found!${NC}"
    echo -e "${YELLOW}Make sure DATABASE_URL is set in .env file${NC}\n"
fi

# Step 1: Generate Prisma Client
echo -e "${CYAN}Step 1: Generating Prisma Client...${NC}"
if npm run prisma:generate; then
    echo -e "${GREEN}✓ Prisma Client generated successfully${NC}\n"
else
    echo -e "${RED}✗ Error generating Prisma Client${NC}"
    exit 1
fi

# Step 2: Check if generated files exist
if [ ! -d "node_modules/.prisma/client" ]; then
    echo -e "${RED}Error: Prisma Client files not found!${NC}"
    echo -e "${YELLOW}Please check if prisma:generate completed successfully${NC}"
    exit 1
fi

# Step 3: Create tar.gz file
echo -e "${CYAN}Step 2: Creating archive...${NC}"
OUTPUT_FILE="prisma-client-$(date +%Y%m%d-%H%M%S).tar.gz"

if tar -czf "$OUTPUT_FILE" node_modules/.prisma node_modules/@prisma/client; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✓ Archive created: ${OUTPUT_FILE} (${FILE_SIZE})${NC}\n"
else
    echo -e "${RED}✗ Error creating archive${NC}"
    exit 1
fi

# Step 4: Instructions
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Success!${NC}"
echo -e "${CYAN}========================================${NC}\n"
echo -e "Next steps:"
echo -e "1. Upload ${YELLOW}${OUTPUT_FILE}${NC} to your hosting server"
echo -e "2. On hosting server, extract it:"
echo -e "   ${CYAN}tar -xzf ${OUTPUT_FILE}${NC}"
echo -e "3. Run migrations:"
echo -e "   ${CYAN}npm run migrate:only${NC}\n"

