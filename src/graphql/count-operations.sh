#!/bin/bash

echo "================================"
echo "GraphQL Operations Summary"
echo "================================"
echo ""

count_operations() {
    local file=$1
    local name=$2
    
    queries=$(grep -c "export const GET_\|export const SEARCH_\|export const CHECK_" "$file" 2>/dev/null || echo "0")
    mutations=$(grep -c "export const CREATE_\|export const UPDATE_\|export const DELETE_\|export const SEND_\|export const MARK_\|export const ADD_\|export const REMOVE_\|export const UPLOAD_\|export const ARCHIVE_\|export const UNARCHIVE_\|export const LEAVE_\|export const TRANSFER_\|export const MUTE_\|export const UNMUTE_\|export const PIN_\|export const UNPIN_\|export const SET_\|export const CLEAR_\|export const REGISTER_\|export const UNREGISTER_\|export const CONFIRM_\|export const GENERATE_\|export const BULK_\|export const RESOLVE_\|export const ESCALATE_\|export const REPORT_\|export const BLOCK_\|export const UNBLOCK_\|export const REQUEST_\|export const DEACTIVATE_\|export const REACTIVATE_" "$file" 2>/dev/null || echo "0")
    subscriptions=$(grep -c "_SUBSCRIPTION\|_STREAM_SUBSCRIPTION" "$file" 2>/dev/null || echo "0")
    
    total=$((queries + mutations + subscriptions))
    
    if [ $total -gt 0 ]; then
        printf "%-20s: Queries: %2d | Mutations: %2d | Subscriptions: %2d | Total: %3d\n" "$name" "$queries" "$mutations" "$subscriptions" "$total"
    fi
}

# Count operations in each file
count_operations "users.ts" "Users"
count_operations "dms.ts" "Direct Messages"
count_operations "files.ts" "Files"
count_operations "notifications.ts" "Notifications"
count_operations "reports.ts" "Reports"
count_operations "channels.ts" "Channels"
count_operations "messages.ts" "Messages"
count_operations "threads.ts" "Threads"
count_operations "reactions.ts" "Reactions"
count_operations "attachments.ts" "Attachments"
count_operations "moderation.ts" "Moderation"

echo ""
echo "================================"

# Count total
total_queries=0
total_mutations=0
total_subscriptions=0

for file in *.ts; do
    if [ "$file" != "index.ts" ] && [ "$file" != "fragments.ts" ]; then
        queries=$(grep -c "export const GET_\|export const SEARCH_\|export const CHECK_" "$file" 2>/dev/null || echo "0")
        mutations=$(grep -c "export const CREATE_\|export const UPDATE_\|export const DELETE_\|export const SEND_\|export const MARK_\|export const ADD_\|export const REMOVE_\|export const UPLOAD_\|export const ARCHIVE_\|export const UNARCHIVE_\|export const LEAVE_\|export const TRANSFER_\|export const MUTE_\|export const UNMUTE_\|export const PIN_\|export const UNPIN_\|export const SET_\|export const CLEAR_\|export const REGISTER_\|export const UNREGISTER_\|export const CONFIRM_\|export const GENERATE_\|export const BULK_\|export const RESOLVE_\|export const ESCALATE_\|export const REPORT_\|export const BLOCK_\|export const UNBLOCK_\|export const REQUEST_\|export const DEACTIVATE_\|export const REACTIVATE_" "$file" 2>/dev/null || echo "0")
        subscriptions=$(grep -c "_SUBSCRIPTION\|_STREAM_SUBSCRIPTION" "$file" 2>/dev/null || echo "0")
        
        total_queries=$((total_queries + queries))
        total_mutations=$((total_mutations + mutations))
        total_subscriptions=$((total_subscriptions + subscriptions))
    fi
done

grand_total=$((total_queries + total_mutations + total_subscriptions))

echo "GRAND TOTAL         : Queries: $total_queries | Mutations: $total_mutations | Subscriptions: $total_subscriptions | Total: $grand_total"
echo "================================"
