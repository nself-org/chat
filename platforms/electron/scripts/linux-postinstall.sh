#!/bin/bash
#
# Post-installation script for Linux packages (deb/rpm)
# Runs after package installation to set up desktop integration
#

set -e

# Update desktop database
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || true
fi

# Update MIME database
if command -v update-mime-database > /dev/null 2>&1; then
    update-mime-database /usr/share/mime || true
fi

# Update icon cache
if command -v gtk-update-icon-cache > /dev/null 2>&1; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi

# Register protocol handler (nchat://)
if command -v xdg-mime > /dev/null 2>&1; then
    xdg-mime default nchat.desktop x-scheme-handler/nchat || true
fi

# Set executable permissions
chmod +x /opt/nchat/nchat || true

# Create symlink in /usr/local/bin if it doesn't exist
if [ ! -e /usr/local/bin/nchat ]; then
    ln -sf /opt/nchat/nchat /usr/local/bin/nchat || true
fi

echo "nchat installation complete!"
exit 0
