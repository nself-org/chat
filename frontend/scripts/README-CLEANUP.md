# Artifact Cleanup Script

**Script:** `cleanup-artifacts.sh`
**Purpose:** Remove temporary project artifacts while preserving production documentation
**Created:** February 9, 2026 (Task 148)

---

## Quick Start

```bash
# Preview what will be removed (safe)
./scripts/cleanup-artifacts.sh --dry-run

# Execute cleanup with automatic backup
./scripts/cleanup-artifacts.sh

# Execute without backup (not recommended)
./scripts/cleanup-artifacts.sh --no-backup
```

---

## What Gets Removed

### ✅ Safe to Remove (Temporary Artifacts)

1. **Task Reports** - `TASK-*-REPORT.md`, `TASK-*-VERIFICATION.md`
2. **Session Summaries** - `*-SESSION-SUMMARY.md`
3. **Completion Reports** - `*-COMPLETION-REPORT.md`, `*-COMPLETION.md`
4. **Evidence Files** - `*-EVIDENCE.md`
5. **Implementation Summaries** - `*-IMPLEMENTATION-SUMMARY.md`
6. **Phase Reports** - `PHASE-*-SUMMARY.md`, `PHASE-*-REPORT.md`
7. **QA Reports** - Old QA session documentation
8. **Backend Artifacts** - Temporary backend setup files

### ❌ Never Removed (Production Critical)

1. **Core Documentation**
   - `docs/README.md`
   - `docs/Features-Complete.md`
   - `docs/Roadmap.md`
   - `docs/PARITY-MATRIX-v091.md`
   - `docs/TEST-POLICY.md`

2. **API Documentation**
   - All `docs/api/**` files

3. **Guides**
   - All `docs/guides/**` files
   - User guides, tutorials, how-tos

4. **Architecture**
   - All `docs/architecture/**` files
   - System design, ADRs

5. **Plugin System**
   - `docs/plugins/api-reference.md`
   - `docs/plugins/getting-started.md`
   - `docs/plugins/*.md` (core docs)

6. **Quality Reports (Release)**
   - `docs/releases/v*/reports/*-QUALITY-REPORT.md`
   - `docs/releases/v*/reports/IMPLEMENTATION-REPORT-*.md`

---

## Usage Examples

### Safe Preview (Recommended First Step)

```bash
# See what would be removed without actually removing
./scripts/cleanup-artifacts.sh --dry-run

# Count files that would be removed
./scripts/cleanup-artifacts.sh --dry-run | grep "Would remove:" | wc -l
```

### Standard Cleanup with Backup

```bash
# Execute cleanup (creates backup automatically)
./scripts/cleanup-artifacts.sh

# Backup location shown in output:
# .cleanup-backup-YYYYMMDD-HHMMSS/
```

### Verify After Cleanup

```bash
# Verify build still works
pnpm build

# Count remaining files
find . -name "*.md" -type f | grep -v node_modules | wc -l

# Check backup
ls -la .cleanup-backup-*/
```

---

## Script Features

### 1. Dry-Run Mode (Safe Testing)

```bash
./scripts/cleanup-artifacts.sh --dry-run
```

- Shows what will be removed
- No files actually deleted
- Safe to run anytime
- Calculates total size

### 2. Automatic Backup

```bash
./scripts/cleanup-artifacts.sh
```

- Creates timestamped backup
- Preserves directory structure
- Easy restoration if needed
- Located: `.cleanup-backup-YYYYMMDD-HHMMSS/`

### 3. Categorized Removal

Script processes 23 categories:
1. Root temporary files
2. Task verification reports
3. QA session reports
4. Implementation summaries
5. Completion reports
6. Phase reports
7. Old session files
8. Evidence files
9. Backend artifacts
10. Deployment summaries
11. Redundant documentation
12. Archive redundancies
13. About directory cleanup
14. Releases reports
15. Features redundancies
16. Security redundancies
17. Plugins redundancies
18. Ops redundancies
19. Guides redundancies
20. Observability redundancies
21. Platform summaries
22. Planning redundancies
23. Additional root cleanup

### 4. Detailed Logging

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   nself-chat Artifact Cleanup Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode: LIVE
Backup: ENABLED

1. Root Temporary Files
  ✓ Removed: /path/to/TASK-139-EVIDENCE.md
  ✓ Removed: /path/to/TASK-140-COMPLETION-SUMMARY.md
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Cleanup Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total files: 134
Total size: 280KB

✓ Backup created at: .cleanup-backup-20260209-130938
✓ Cleanup completed successfully
```

---

## Restoration

### Restore All Files

```bash
# Full restoration from backup
cp -r .cleanup-backup-YYYYMMDD-HHMMSS/* .
```

### Restore Specific File

```bash
# Restore single file
cp .cleanup-backup-YYYYMMDD-HHMMSS/docs/TASK-139-EVIDENCE.md docs/
```

### Restore Specific Directory

```bash
# Restore entire directory
cp -r .cleanup-backup-YYYYMMDD-HHMMSS/docs/QA docs/
```

---

## Best Practices

### Before Running

1. ✅ **Always run dry-run first**
   ```bash
   ./scripts/cleanup-artifacts.sh --dry-run
   ```

2. ✅ **Verify repository is clean**
   ```bash
   git status
   ```

3. ✅ **Ensure builds are passing**
   ```bash
   pnpm build
   ```

### After Running

1. ✅ **Verify build still works**
   ```bash
   pnpm build
   ```

2. ✅ **Check file counts**
   ```bash
   find . -name "*.md" | wc -l
   ```

3. ✅ **Keep backup for 30 days**
   - Don't delete backup immediately
   - Verify everything works first

### Scheduled Maintenance

Run cleanup before each minor release:

```bash
# v0.9.1 preparation
./scripts/cleanup-artifacts.sh --dry-run
./scripts/cleanup-artifacts.sh
pnpm build
git add .
git commit -m "chore: cleanup temporary artifacts for v0.9.1"
```

---

## Troubleshooting

### Script Fails to Run

```bash
# Make executable
chmod +x scripts/cleanup-artifacts.sh

# Check syntax
bash -n scripts/cleanup-artifacts.sh
```

### Files Not Removed

```bash
# Check file permissions
ls -la docs/TASK-*

# Run with verbose output
bash -x scripts/cleanup-artifacts.sh --dry-run
```

### Need to Undo Cleanup

```bash
# Restore from backup (within 30 days)
ls -la .cleanup-backup-*/
cp -r .cleanup-backup-YYYYMMDD-HHMMSS/* .
```

---

## Maintenance

### Update Script

To add new patterns to clean:

```bash
# Edit script
vim scripts/cleanup-artifacts.sh

# Add new category before final summary:
echo -e "\n${BLUE}24. New Category${NC}"
find "${PROJECT_ROOT}/docs" -name "*-NEW-PATTERN.md" -type f | while read file; do
  remove_file "$file" "New Category"
done
```

### Quarterly Cleanup

Add to calendar:
- Week before each minor release
- Review docs/ for new temporary files
- Run cleanup script
- Verify builds
- Commit changes

---

## Statistics (Task 148 - Feb 9, 2026)

**Cleanup Results:**
- Files removed: 134
- Size saved: 280KB
- Reduction: 17.8%
- Time taken: ~5 seconds
- Backup size: 280KB
- Status: ✅ Success

**Categories Cleaned:**
- Task reports: 48 files
- QA reports: 11 files
- Implementation summaries: 11 files
- Completion reports: 18 files
- Phase reports: 7 files
- Other: 39 files

---

## Support

### Issues

If you encounter issues:

1. Run dry-run mode first
2. Check file permissions
3. Verify backup was created
4. Check script syntax
5. Report issues with full output

### Questions

For questions about:
- What gets removed: See "What Gets Removed" section
- How to restore: See "Restoration" section
- Best practices: See "Best Practices" section
- Script errors: See "Troubleshooting" section

---

**Script Version:** 1.0
**Created:** February 9, 2026 (Task 148)
**Maintained By:** Development Team
**Last Cleanup:** February 9, 2026 (134 files removed)
