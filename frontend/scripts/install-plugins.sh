#!/bin/bash

###############################################################################
# ɳChat Plugin Installation Script
# Version: 0.9.1
# Date: 2026-02-03
#
# This script automates the installation of all required ɳPlugins
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
        echo "Install from: https://github.com/nself-org/cli"
        exit 1
    fi
    print_success "nself CLI found: $(nself --version | head -1)"

    # Check if Docker is running
    if ! docker ps &> /dev/null; then
        print_error "Docker is not running"
        echo "Start Docker Desktop and try again"
        exit 1
    fi
    print_success "Docker is running"

    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    print_success "Backend directory found"

    echo ""
}

###############################################################################
# Plugin Configuration
###############################################################################

setup_plugin_config() {
    print_header "Setting up Plugin Configuration"

    cd "$BACKEND_DIR"

    # Check if .env.plugins exists
    if [ ! -f ".env.plugins" ]; then
        print_info "Creating .env.plugins from example"
        if [ -f "$PROJECT_ROOT/.backend/.env.plugins.example" ]; then
            cp "$PROJECT_ROOT/.backend/.env.plugins.example" .env.plugins
            print_success "Created .env.plugins"
        else
            print_warning ".env.plugins.example not found, creating minimal config"
            cat > .env.plugins <<EOF
# ɳPlugins Configuration
# Generated: $(date)

# Realtime Plugin
REALTIME_ENABLED=true
REALTIME_PORT=3101

# Notifications Plugin
NOTIFICATIONS_ENABLED=true
NOTIFICATIONS_PORT=3102

# Jobs Plugin
JOBS_ENABLED=true
JOBS_PORT=3105

# File Processing Plugin
FILE_PROCESSING_ENABLED=true
FILE_PROCESSING_PORT=3104
EOF
            print_success "Created minimal .env.plugins"
        fi
    else
        print_success ".env.plugins already exists"
    fi

    echo ""
}

###############################################################################
# Core Plugins (Phase 1)
###############################################################################

install_realtime_plugin() {
    print_header "Installing Realtime Plugin"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install realtime; then
        print_success "Realtime plugin installed"
    else
        print_error "Failed to install realtime plugin"
        return 1
    fi

    echo ""
}

install_notifications_plugin() {
    print_header "Installing Notifications Plugin"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install notifications; then
        print_success "Notifications plugin installed"
    else
        print_error "Failed to install notifications plugin"
        return 1
    fi

    echo ""
}

install_jobs_plugin() {
    print_header "Installing Jobs Plugin"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install jobs; then
        print_success "Jobs plugin installed"
    else
        print_error "Failed to install jobs plugin"
        return 1
    fi

    echo ""
}

install_file_processing_plugin() {
    print_header "Installing File Processing Plugin"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install file-processing; then
        print_success "File processing plugin installed"
    else
        print_error "Failed to install file-processing plugin"
        return 1
    fi

    echo ""
}

###############################################################################
# Auth Plugins (Phase 2)
###############################################################################

install_idme_plugin() {
    print_header "Installing ID.me Plugin"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install idme; then
        print_success "ID.me plugin installed"
        print_warning "Configure IDME_CLIENT_ID and IDME_CLIENT_SECRET in .env.plugins"
    else
        print_error "Failed to install idme plugin"
        return 1
    fi

    echo ""
}

###############################################################################
# Integration Plugins (Phase 3)
###############################################################################

install_stripe_plugin() {
    print_header "Installing Stripe Plugin (Optional)"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install stripe; then
        print_success "Stripe plugin installed"
        print_warning "Configure STRIPE_SECRET_KEY in .env.plugins"
    else
        print_error "Failed to install stripe plugin"
        return 1
    fi

    echo ""
}

install_github_plugin() {
    print_header "Installing GitHub Plugin (Optional)"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install github; then
        print_success "GitHub plugin installed"
        print_warning "Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.plugins"
    else
        print_error "Failed to install github plugin"
        return 1
    fi

    echo ""
}

install_shopify_plugin() {
    print_header "Installing Shopify Plugin (Optional)"

    cd "$BACKEND_DIR"

    print_info "Installing plugin..."
    if nself plugin install shopify; then
        print_success "Shopify plugin installed"
        print_warning "Configure SHOPIFY_API_KEY and SHOPIFY_API_SECRET in .env.plugins"
    else
        print_error "Failed to install shopify plugin"
        return 1
    fi

    echo ""
}

###############################################################################
# Service Management
###############################################################################

restart_services() {
    print_header "Restarting Backend Services"

    cd "$BACKEND_DIR"

    print_info "Restarting services to load plugins..."
    if nself restart; then
        print_success "Services restarted"
    else
        print_error "Failed to restart services"
        return 1
    fi

    echo ""
}

verify_plugins() {
    print_header "Verifying Plugin Installation"

    cd "$BACKEND_DIR"

    print_info "Checking installed plugins..."
    nself plugin list --installed

    echo ""
    print_info "Checking plugin status..."
    nself plugin status

    echo ""
}

###############################################################################
# Main Installation Flow
###############################################################################

main() {
    print_header "ɳChat Plugin Installation"
    echo ""

    # Parse arguments
    INSTALL_PHASE="all"
    SKIP_RESTART=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --core-only)
                INSTALL_PHASE="core"
                shift
                ;;
            --with-auth)
                INSTALL_PHASE="with-auth"
                shift
                ;;
            --skip-restart)
                SKIP_RESTART=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --core-only     Install only core plugins (realtime, notifications, jobs, file-processing)"
                echo "  --with-auth     Install core + auth plugins (ID.me)"
                echo "  --skip-restart  Don't restart services after installation"
                echo "  --help          Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run pre-flight checks
    check_prerequisites

    # Setup configuration
    setup_plugin_config

    # Phase 1: Core Plugins (REQUIRED)
    print_info "Installing Phase 1: Core Plugins"
    install_realtime_plugin
    install_notifications_plugin
    install_jobs_plugin
    install_file_processing_plugin

    # Phase 2: Auth Plugins (OPTIONAL)
    if [ "$INSTALL_PHASE" == "with-auth" ] || [ "$INSTALL_PHASE" == "all" ]; then
        print_info "Installing Phase 2: Auth Plugins"
        install_idme_plugin
    fi

    # Phase 3: Integration Plugins (OPTIONAL)
    if [ "$INSTALL_PHASE" == "all" ]; then
        print_info "Installing Phase 3: Integration Plugins (Optional)"
        read -p "Install Stripe plugin? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_stripe_plugin
        fi

        read -p "Install GitHub plugin? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_github_plugin
        fi

        read -p "Install Shopify plugin? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_shopify_plugin
        fi
    fi

    # Restart services
    if [ "$SKIP_RESTART" = false ]; then
        restart_services
    else
        print_warning "Skipping service restart (--skip-restart flag)"
        print_info "Run 'nself restart' manually to load plugins"
    fi

    # Verify installation
    verify_plugins

    # Success message
    print_header "Installation Complete"
    print_success "All requested plugins have been installed"
    echo ""
    print_info "Next steps:"
    echo "  1. Configure plugin environment variables in backend/.env.plugins"
    echo "  2. Update frontend environment variables in .env.local"
    echo "  3. Create API routes for plugin integration"
    echo "  4. Run integration tests"
    echo ""
    print_info "Documentation:"
    echo "  - Installation: docs/plugins/INSTALLATION-GUIDE.md"
    echo "  - Integration: docs/plugins/INTEGRATION-GUIDE.md"
    echo "  - Inventory: docs/PLUGIN-INVENTORY.md"
    echo ""
}

# Run main function
main "$@"
