#!/bin/bash
# Cleanup Script for nself-chat v0.9.1
# Removes temporary artifacts while preserving production-critical files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Options
DRY_RUN=false
BACKUP=true
BACKUP_DIR="${PROJECT_ROOT}/.cleanup-backup-$(date +%Y%m%d-%H%M%S)"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-backup)
      BACKUP=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--dry-run] [--no-backup]"
      exit 1
      ;;
  esac
done

# Print header
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   nself-chat Artifact Cleanup Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Mode: ${YELLOW}$([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")${NC}"
echo -e "Backup: ${YELLOW}$([ "$BACKUP" = true ] && echo "ENABLED" || echo "DISABLED")${NC}"
echo ""

# File categories to remove
declare -a CATEGORIES=(
  "Root Temporary Files"
  "Task Reports (docs/)"
  "QA Session Reports"
  "Implementation Summaries"
  "Completion Reports"
  "Phase Reports"
  "Old Session Files"
  "Verification Reports"
  "Evidence Files"
  "Backend Artifacts"
)

# Initialize counters
TOTAL_FILES=0
TOTAL_SIZE=0

# Function to add file to removal list
remove_file() {
  local file=$1
  local category=$2

  if [ -f "$file" ]; then
    local size=$(stat -f%z "$file" 2>/dev/null || echo 0)
    TOTAL_FILES=$((TOTAL_FILES + 1))
    TOTAL_SIZE=$((TOTAL_SIZE + size))

    if [ "$DRY_RUN" = true ]; then
      echo -e "  ${YELLOW}[DRY RUN]${NC} Would remove: $file"
    else
      # Backup if enabled
      if [ "$BACKUP" = true ]; then
        local rel_path="${file#$PROJECT_ROOT/}"
        local backup_file="${BACKUP_DIR}/${rel_path}"
        mkdir -p "$(dirname "$backup_file")"
        cp "$file" "$backup_file"
      fi

      rm "$file"
      echo -e "  ${GREEN}✓${NC} Removed: $file"
    fi
  fi
}

# Function to format size
format_size() {
  local size=$1
  if [ $size -lt 1024 ]; then
    echo "${size}B"
  elif [ $size -lt 1048576 ]; then
    echo "$((size / 1024))KB"
  else
    echo "$((size / 1048576))MB"
  fi
}

# Category 1: Root Temporary Files
echo -e "\n${BLUE}1. Root Temporary Files${NC}"
remove_file "${PROJECT_ROOT}/TASK-139-EVIDENCE.md" "Root Temporary"
remove_file "${PROJECT_ROOT}/TASK-140-COMPLETION-SUMMARY.md" "Root Temporary"
remove_file "${PROJECT_ROOT}/TASK-141-EVIDENCE.md" "Root Temporary"

# Category 2: Task Reports in docs/
echo -e "\n${BLUE}2. Task Reports (docs/)${NC}"
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "TASK-*-VERIFICATION.md" -type f | while read file; do
  remove_file "$file" "Task Reports"
done
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "TASK-*-REPORT.md" -type f | while read file; do
  remove_file "$file" "Task Reports"
done
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "TASK-*-SUMMARY.md" -type f | while read file; do
  remove_file "$file" "Task Reports"
done

# Category 3: QA Session Reports
echo -e "\n${BLUE}3. QA Session Reports${NC}"
remove_file "${PROJECT_ROOT}/docs/QA/COMPLETE-SESSION-SUMMARY.md" "QA Reports"
remove_file "${PROJECT_ROOT}/docs/QA/FINAL-QA-SUMMARY.md" "QA Reports"
remove_file "${PROJECT_ROOT}/docs/QA/FINAL-SESSION-SUMMARY.md" "QA Reports"
remove_file "${PROJECT_ROOT}/docs/QA/FINAL-VERIFICATION-REPORT.md" "QA Reports"
remove_file "${PROJECT_ROOT}/docs/QA/VERIFICATION-SUMMARY.md" "QA Reports"
find "${PROJECT_ROOT}/docs/QA" -name "TASK-*-REPORT.md" -type f | while read file; do
  remove_file "$file" "QA Task Reports"
done

# Category 4: Implementation Summaries
echo -e "\n${BLUE}4. Implementation Summaries${NC}"
find "${PROJECT_ROOT}/docs" -name "*-IMPLEMENTATION-SUMMARY.md" -type f | while read file; do
  remove_file "$file" "Implementation Summaries"
done
find "${PROJECT_ROOT}/docs" -name "*IMPLEMENTATION_SUMMARY.md" -type f | while read file; do
  remove_file "$file" "Implementation Summaries"
done

# Category 5: Completion Reports
echo -e "\n${BLUE}5. Completion Reports${NC}"
find "${PROJECT_ROOT}/docs" -name "*-COMPLETION-REPORT.md" -type f | while read file; do
  remove_file "$file" "Completion Reports"
done
find "${PROJECT_ROOT}/docs" -name "*-COMPLETION.md" -type f | while read file; do
  remove_file "$file" "Completion Reports"
done
remove_file "${PROJECT_ROOT}/docs/releases/v0.9.1/reports/V0.9.1-FINAL-COMPLETION-REPORT.md" "Completion Reports"

# Category 6: Phase Reports
echo -e "\n${BLUE}6. Phase Reports${NC}"
find "${PROJECT_ROOT}/docs" -name "PHASE-*-SUMMARY.md" -type f | while read file; do
  remove_file "$file" "Phase Reports"
done
find "${PROJECT_ROOT}/docs" -name "PHASE-*-COMPLETION*.md" -type f | while read file; do
  remove_file "$file" "Phase Reports"
done

# Category 7: Old Session Files
echo -e "\n${BLUE}7. Old Session Files${NC}"
find "${PROJECT_ROOT}/.claude/reports" -name "TASK-*-REPORT.md" -type f 2>/dev/null | while read file; do
  remove_file "$file" "Session Files"
done
find "${PROJECT_ROOT}/.claude/reports" -name "TASK-*-COMPLETION*.md" -type f 2>/dev/null | while read file; do
  remove_file "$file" "Session Files"
done

# Category 8: Evidence Files
echo -e "\n${BLUE}8. Evidence Files${NC}"
find "${PROJECT_ROOT}" -maxdepth 3 -name "*-EVIDENCE.md" -type f | grep -v node_modules | while read file; do
  remove_file "$file" "Evidence Files"
done

# Category 9: Backend Artifacts
echo -e "\n${BLUE}9. Backend Artifacts${NC}"
remove_file "${PROJECT_ROOT}/.backend/MEDIA-SERVER-SETUP-SUMMARY.md" "Backend Artifacts"
remove_file "${PROJECT_ROOT}/.backend/migrations/MIGRATION_SUMMARY.md" "Backend Artifacts"
remove_file "${PROJECT_ROOT}/.backend/migrations/VALIDATION_REPORT.md" "Backend Artifacts"

# Category 10: Deployment Summaries
echo -e "\n${BLUE}10. Deployment Summaries${NC}"
remove_file "${PROJECT_ROOT}/deploy/DEPLOYMENT-SUMMARY.md" "Deployment Summaries"
find "${PROJECT_ROOT}/docs/guides/deployment" -name "*-SUMMARY.md" -type f | while read file; do
  remove_file "$file" "Deployment Summaries"
done

# Category 11: Redundant Documentation (broad sweep)
echo -e "\n${BLUE}11. Redundant Documentation${NC}"
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "*-REPORT*.md" -type f | while read file; do
  remove_file "$file" "Redundant Docs"
done
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "*-SUMMARY*.md" -type f | while read file; do
  remove_file "$file" "Redundant Docs"
done
find "${PROJECT_ROOT}/docs" -maxdepth 1 -name "*COMPLETION*.md" -type f | while read file; do
  remove_file "$file" "Redundant Docs"
done

# Category 12: Archive Redundancies (all reports/summaries)
echo -e "\n${BLUE}12. Archive Redundancies${NC}"
find "${PROJECT_ROOT}/docs/archive" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" -o -name "*-COMPLETION*.md" \) | while read file; do
  remove_file "$file" "Archive Redundancies"
done

# Category 13: About Redundancies (all reports/summaries)
echo -e "\n${BLUE}13. About Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/about" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" -o -name "*-COMPLETION*.md" \) | while read file; do
  remove_file "$file" "About Redundancies"
done

# Category 14: Releases Redundancies (reports in subdirs)
echo -e "\n${BLUE}14. Releases Reports Cleanup${NC}"
find "${PROJECT_ROOT}/docs/releases" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" -o -name "*-COMPLETION*.md" \) | while read file; do
  # Keep the main quality and implementation reports
  if [[ ! "$file" =~ "V0.9.1-QUALITY-REPORT.md" ]] && [[ ! "$file" =~ "IMPLEMENTATION-REPORT-V0.9.1.md" ]]; then
    remove_file "$file" "Releases Redundancies"
  fi
done

# Category 15: Features Redundancies
echo -e "\n${BLUE}15. Features Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/features" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" \) | while read file; do
  remove_file "$file" "Features Redundancies"
done

# Category 16: Security Redundancies
echo -e "\n${BLUE}16. Security Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/security" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" \) | while read file; do
  remove_file "$file" "Security Redundancies"
done

# Category 17: Plugins Redundancies
echo -e "\n${BLUE}17. Plugins Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/plugins" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" -o -name "*-COMPLETION*.md" \) | while read file; do
  remove_file "$file" "Plugins Redundancies"
done

# Category 18: Ops Redundancies
echo -e "\n${BLUE}18. Ops Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/ops" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" \) | while read file; do
  remove_file "$file" "Ops Redundancies"
done

# Category 19: Guides Redundancies
echo -e "\n${BLUE}19. Guides Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/guides" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" \) | while read file; do
  remove_file "$file" "Guides Redundancies"
done

# Category 20: Observability Redundancies
echo -e "\n${BLUE}20. Observability Directory Cleanup${NC}"
find "${PROJECT_ROOT}/docs/observability" -type f \( -name "*-SUMMARY*.md" -o -name "*-REPORT*.md" \) | while read file; do
  remove_file "$file" "Observability Redundancies"
done

# Category 21: Platform Summaries
echo -e "\n${BLUE}21. Platform Summaries${NC}"
remove_file "${PROJECT_ROOT}/platforms/MOBILE-APPS-SUMMARY.md" "Platform Summaries"

# Category 22: Redundant Planning Files (redundant - info in .claude/)
echo -e "\n${BLUE}22. Redundant Planning Files${NC}"
remove_file "${PROJECT_ROOT}/docs/TASK-DEPENDENCY-GRAPH.md" "Planning Redundancies"

# Category 23: Additional Root docs/ Cleanup
echo -e "\n${BLUE}23. Additional Root docs/ Cleanup${NC}"
remove_file "${PROJECT_ROOT}/docs/TASK-60-ADVANCED-SERVICES-COMPLETE.md" "Root docs cleanup"
remove_file "${PROJECT_ROOT}/docs/AUTONOMOUS-WORK-SESSION-SUMMARY.md" "Root docs cleanup"
remove_file "${PROJECT_ROOT}/docs/TASK-140-EVIDENCE.md" "Root docs cleanup"

# Print summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Cleanup Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total files: ${GREEN}${TOTAL_FILES}${NC}"
echo -e "Total size: ${GREEN}$(format_size $TOTAL_SIZE)${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}⚠ DRY RUN MODE - No files were actually removed${NC}"
  echo -e "Run without ${YELLOW}--dry-run${NC} to perform actual cleanup"
else
  if [ "$BACKUP" = true ]; then
    echo -e "${GREEN}✓${NC} Backup created at: ${BACKUP_DIR}"
  fi
  echo -e "${GREEN}✓${NC} Cleanup completed successfully"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
