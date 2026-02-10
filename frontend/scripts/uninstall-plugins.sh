#!/bin/bash

###############################################################################
# ɳChat Plugin Uninstallation Script
# Version: 0.9.1
# Date: 2026-02-03
#
# This script automates the removal of ɳPlugins
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

###############################################################################
# Pre-flight Checks
###############################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if nself CLI is installed
    if ! command -v nself &> /dev/null; then
        print_error "nself CLI not found"
        exit 1
    fi
    print_success "nself CLI found: $(nself --version | head -1)"

    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    print_success "Backend directory found"

    echo ""
}

###############################################################################
# Uninstall Functions
###############################################################################

uninstall_plugin() {
    local plugin_name=$1
    local keep_data=${2:-false}

    print_info "Uninstalling $plugin_name plugin..."

    cd "$BACKEND_DIR"

    local opts=""
    if [ "$keep_data" = true ]; then
        opts="--keep-data"
        print_warning "Database tables will be preserved"
    fi

    if nself plugin remove "$plugin_name" $opts; then
        print_success "$plugin_name plugin uninstalled"
        return 0
    else
        print_error "Failed to uninstall $plugin_name plugin"
        return 1
    fi
}

###############################################################################
# List and Confirm
###############################################################################

list_installed_plugins() {
    print_header "Installed Plugins"

    cd "$BACKEND_DIR"

    print_info "Currently installed plugins:"
    nself plugin list --installed || true

    echo ""
}

confirm_uninstall() {
    local plugin_name=$1

    echo -e "${YELLOW}⚠ WARNING:${NC} You are about to uninstall the $plugin_name plugin"
    echo "This will:"
    echo "  • Stop the plugin service"
    echo "  • Remove plugin configuration"
    echo "  • Delete plugin database tables (unless --keep-data)"
    echo ""

    read -p "Are you sure? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Uninstall cancelled"
        return 1
    fi

    return 0
}

###############################################################################
# Batch Operations
###############################################################################

uninstall_core_plugins() {
    local keep_data=$1

    print_header "Uninstalling Core Plugins"

    if ! confirm_uninstall "ALL CORE PLUGINS"; then
        return 1
    fi

    uninstall_plugin "realtime" "$keep_data"
    uninstall_plugin "notifications" "$keep_data"
    uninstall_plugin "jobs" "$keep_data"
    uninstall_plugin "file-processing" "$keep_data"

    echo ""
}

uninstall_auth_plugins() {
    local keep_data=$1

    print_header "Uninstalling Auth Plugins"

    if ! confirm_uninstall "ALL AUTH PLUGINS"; then
        return 1
    fi

    uninstall_plugin "idme" "$keep_data"

    echo ""
}

uninstall_integration_plugins() {
    local keep_data=$1

    print_header "Uninstalling Integration Plugins"

    if ! confirm_uninstall "ALL INTEGRATION PLUGINS"; then
        return 1
    fi

    uninstall_plugin "stripe" "$keep_data" || true
    uninstall_plugin "github" "$keep_data" || true
    uninstall_plugin "shopify" "$keep_data" || true

    echo ""
}

uninstall_all_plugins() {
    local keep_data=$1

    print_header "Uninstalling ALL Plugins"

    if ! confirm_uninstall "ALL PLUGINS"; then
        return 1
    fi

    cd "$BACKEND_DIR"

    # Get list of installed plugins
    local plugins=$(nself plugin list --installed 2>/dev/null | grep -E '^\w+' | awk '{print $1}' || true)

    if [ -z "$plugins" ]; then
        print_warning "No plugins installed"
        return 0
    fi

    for plugin in $plugins; do
        uninstall_plugin "$plugin" "$keep_data"
    done

    echo ""
}

###############################################################################
# Service Management
###############################################################################

restart_services() {
    print_header "Restarting Backend Services"

    cd "$BACKEND_DIR"

    print_info "Restarting services..."
    if nself restart; then
        print_success "Services restarted"
    else
        print_error "Failed to restart services"
        return 1
    fi

    echo ""
}

verify_uninstall() {
    print_header "Verifying Uninstallation"

    cd "$BACKEND_DIR"

    print_info "Remaining plugins:"
    nself plugin list --installed || true

    echo ""
}

###############################################################################
# Main
###############################################################################

show_help() {
    echo "Usage: $0 [OPTIONS] [PLUGIN_NAME]"
    echo ""
    echo "Uninstall ɳPlugins from ɳChat"
    echo ""
    echo "Options:"
    echo "  --all           Uninstall all plugins"
    echo "  --core          Uninstall core plugins (realtime, notifications, jobs, file-processing)"
    echo "  --auth          Uninstall auth plugins (idme)"
    echo "  --integrations  Uninstall integration plugins (stripe, github, shopify)"
    echo "  --keep-data     Preserve database tables when uninstalling"
    echo "  --skip-restart  Don't restart services after uninstall"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 realtime                    # Uninstall realtime plugin"
    echo "  $0 --core --keep-data          # Uninstall core plugins, keep data"
    echo "  $0 --all                       # Uninstall all plugins"
    echo ""
}

main() {
    print_header "ɳChat Plugin Uninstallation"
    echo ""

    # Parse arguments
    local UNINSTALL_MODE="single"
    local PLUGIN_NAME=""
    local KEEP_DATA=false
    local SKIP_RESTART=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                UNINSTALL_MODE="all"
                shift
                ;;
            --core)
                UNINSTALL_MODE="core"
                shift
                ;;
            --auth)
                UNINSTALL_MODE="auth"
                shift
                ;;
            --integrations)
                UNINSTALL_MODE="integrations"
                shift
                ;;
            --keep-data)
                KEEP_DATA=true
                shift
                ;;
            --skip-restart)
                SKIP_RESTART=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            -*)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
            *)
                PLUGIN_NAME=$1
                shift
                ;;
        esac
    done

    # Run pre-flight checks
    check_prerequisites

    # List installed plugins
    list_installed_plugins

    # Execute based on mode
    case $UNINSTALL_MODE in
        all)
            uninstall_all_plugins "$KEEP_DATA"
            ;;
        core)
            uninstall_core_plugins "$KEEP_DATA"
            ;;
        auth)
            uninstall_auth_plugins "$KEEP_DATA"
            ;;
        integrations)
            uninstall_integration_plugins "$KEEP_DATA"
            ;;
        single)
            if [ -z "$PLUGIN_NAME" ]; then
                print_error "No plugin name specified"
                echo "Use --help for usage information"
                exit 1
            fi

            if ! confirm_uninstall "$PLUGIN_NAME"; then
                exit 0
            fi

            uninstall_plugin "$PLUGIN_NAME" "$KEEP_DATA"
            ;;
    esac

    # Restart services
    if [ "$SKIP_RESTART" = false ]; then
        restart_services
    else
        print_warning "Skipping service restart (--skip-restart flag)"
        print_info "Run 'nself restart' manually to apply changes"
    fi

    # Verify uninstall
    verify_uninstall

    # Success message
    print_header "Uninstallation Complete"
    print_success "Plugin(s) have been uninstalled"
    echo ""

    if [ "$KEEP_DATA" = true ]; then
        print_info "Database tables were preserved"
        print_info "To remove data, use: nself db clean"
    fi

    echo ""
}

# Run main function
main "$@"
