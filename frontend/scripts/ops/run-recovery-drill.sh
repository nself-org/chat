#!/bin/bash
# Automated recovery drill execution
# Simulates failures and executes recovery procedures

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DRILL_DIR="/tmp/recovery-drill-$(date +%Y%m%d-%H%M%S)"
TIMELINE_FILE="$DRILL_DIR/timeline.txt"
METRICS_FILE="$DRILL_DIR/metrics.json"

# Ensure running in test environment
if [ -z "$DRILL_MODE" ]; then
  echo -e "${RED}ERROR: Must set DRILL_MODE=test to run drills${NC}"
  echo "This prevents accidental execution on production"
  echo ""
  echo "To run a drill:"
  echo "  export DRILL_MODE=test"
  echo "  $0 [scenario]"
  exit 1
fi

# Create drill directory
mkdir -p "$DRILL_DIR"
echo "Drill directory: $DRILL_DIR"

# Log function
log_event() {
  local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
  local event="$1"
  echo "[$timestamp] $event" | tee -a "$TIMELINE_FILE"
}

# Metric tracking
record_metric() {
  local metric_name="$1"
  local metric_value="$2"
  local timestamp=$(date +%s)
  echo "{\"metric\": \"$metric_name\", \"value\": $metric_value, \"timestamp\": $timestamp}" >> "$METRICS_FILE"
}

# Parse arguments
SCENARIO=${1:-"service-outage"}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          DISASTER RECOVERY DRILL - $SCENARIO                    ${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_event "Drill started - Scenario: $SCENARIO"

case $SCENARIO in
  "service-outage")
    # Scenario: Complete service outage
    echo "Scenario: Complete Service Outage"
    echo "Target RTO: 15 minutes"
    echo "Target RPO: 0 (no data loss)"
    echo ""

    # Capture baseline
    log_event "Capturing baseline state"
    ./scripts/ops/capture-system-state.sh > "$DRILL_DIR/baseline-state.txt"

    # Simulate outage
    log_event "Simulating complete service outage"
    DRILL_START=$(date +%s)
    record_metric "drill_start_time" "$DRILL_START"

    echo "Stopping all containers..."
    docker stop $(docker ps -q) 2>/dev/null || true

    sleep 5

    # Detection phase
    log_event "Detection: All services down"
    DETECTION_TIME=$(date +%s)
    MTTD=$((DETECTION_TIME - DRILL_START))
    record_metric "mttd" "$MTTD"
    echo "MTTD (Mean Time To Detect): ${MTTD}s"

    # Recovery phase
    log_event "Starting recovery procedure"
    RECOVERY_START=$(date +%s)

    ./scripts/ops/start-services-ordered.sh

    RECOVERY_END=$(date +%s)
    MTTR=$((RECOVERY_END - RECOVERY_START))
    record_metric "mttr" "$MTTR"

    log_event "Recovery complete"

    # Verification phase
    log_event "Starting verification"
    ./scripts/ops/verify-system-health.sh

    if [ $? -eq 0 ]; then
      log_event "Health verification PASSED"
    else
      log_event "Health verification FAILED"
    fi

    # Data integrity check
    ./scripts/ops/verify-data-integrity.sh

    if [ $? -eq 0 ]; then
      log_event "Data integrity verification PASSED"
    else
      log_event "Data integrity verification FAILED"
    fi

    DRILL_END=$(date +%s)
    TOTAL_RTO=$((DRILL_END - DRILL_START))
    record_metric "total_rto" "$TOTAL_RTO"

    ;;

  "database-corruption")
    # Scenario: Database corruption requiring restore
    echo "Scenario: Database Corruption"
    echo "Target RTO: 30 minutes"
    echo "Target RPO: 5 minutes"
    echo ""

    # This is a more complex scenario that requires careful setup
    echo -e "${YELLOW}This scenario requires manual execution due to data risks${NC}"
    echo "Please follow: docs/ops/RECOVERY-DRILL-SCENARIOS.md#scenario-1"
    exit 0
    ;;

  "data-loss")
    # Scenario: Accidental data deletion
    echo "Scenario: Data Loss (PITR Recovery)"
    echo "Target RTO: 60 minutes"
    echo "Target RPO: <1 minute"
    echo ""

    echo -e "${YELLOW}This scenario requires manual execution due to data risks${NC}"
    echo "Please follow: docs/ops/RECOVERY-DRILL-SCENARIOS.md#scenario-4"
    exit 0
    ;;

  "cascade-failure")
    # Scenario: Cascading failure (Redis OOM → Auth failure)
    echo "Scenario: Cascading Failure"
    echo "Target RTO: 20 minutes"
    echo "Target RPO: Session loss acceptable"
    echo ""

    DRILL_START=$(date +%s)
    log_event "Simulating Redis memory exhaustion"

    # Limit Redis memory
    docker update --memory 100m nself-redis

    # Wait for cascade
    sleep 30

    log_event "Cascade detected - Auth service failing"

    # Recovery
    log_event "Starting recovery"
    docker update --memory 512m nself-redis
    docker restart nself-redis nself-auth

    sleep 20

    # Verification
    log_event "Verifying recovery"
    ./scripts/ops/verify-system-health.sh

    DRILL_END=$(date +%s)
    TOTAL_RTO=$((DRILL_END - DRILL_START))
    record_metric "total_rto" "$TOTAL_RTO"

    ;;

  *)
    echo -e "${RED}Unknown scenario: $SCENARIO${NC}"
    echo ""
    echo "Available scenarios:"
    echo "  - service-outage      Complete system down"
    echo "  - database-corruption Database recovery needed"
    echo "  - data-loss          PITR recovery"
    echo "  - cascade-failure    Cascading service failures"
    exit 1
    ;;
esac

# Generate report
echo ""
echo "=== DRILL REPORT ==="
echo ""

cat <<EOF > "$DRILL_DIR/report.md"
# Recovery Drill Report

**Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Scenario**: $SCENARIO
**Drill ID**: $(basename $DRILL_DIR)

## Timeline

$(cat $TIMELINE_FILE)

## Metrics

\`\`\`json
$(cat $METRICS_FILE)
\`\`\`

## RTO Analysis

- **Target RTO**: varies by scenario
- **Actual RTO**: ${TOTAL_RTO}s ($(($TOTAL_RTO / 60))m $(($TOTAL_RTO % 60))s)

## Status

EOF

if [ $TOTAL_RTO -le 900 ]; then
  echo "✅ **PASSED** - RTO within acceptable limits" >> "$DRILL_DIR/report.md"
  echo -e "${GREEN}✓ DRILL PASSED${NC}"
else
  echo "⚠️ **NEEDS IMPROVEMENT** - RTO exceeded target" >> "$DRILL_DIR/report.md"
  echo -e "${YELLOW}⚠ DRILL NEEDS IMPROVEMENT${NC}"
fi

cat <<EOF >> "$DRILL_DIR/report.md"

## Action Items

- [ ] Review timeline for optimization opportunities
- [ ] Update runbooks based on findings
- [ ] Schedule follow-up drill
- [ ] Document lessons learned

## Files

- Timeline: \`$(basename $TIMELINE_FILE)\`
- Metrics: \`$(basename $METRICS_FILE)\`
- Baseline: \`baseline-state.txt\`

---

**Next Steps:**

1. Review this report with the team
2. Create action items in issue tracker
3. Update disaster recovery procedures
4. Schedule next drill
EOF

echo ""
echo "Full report: $DRILL_DIR/report.md"
echo "Timeline: $TIMELINE_FILE"
echo "Metrics: $METRICS_FILE"
echo ""

log_event "Drill completed"

# Archive drill results
ARCHIVE_DIR="/tmp/drill-archives"
mkdir -p "$ARCHIVE_DIR"
tar -czf "$ARCHIVE_DIR/drill-$(date +%Y%m%d-%H%M%S)-$SCENARIO.tar.gz" -C $(dirname $DRILL_DIR) $(basename $DRILL_DIR)

echo "Drill archived to: $ARCHIVE_DIR/drill-$(date +%Y%m%d-%H%M%S)-$SCENARIO.tar.gz"
echo ""
echo -e "${GREEN}Drill execution complete!${NC}"
