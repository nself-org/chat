#!/bin/bash
#
# Post-removal script for Linux packages (deb/rpm)
# Runs after package uninstallation to clean up
#

set -e

# Remove symlink
if [ -L /usr/local/bin/nchat ]; then
    rm -f /usr/local/bin/nchat || true
fi

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

# Optionally remove user data (commented out to preserve user data)
# rm -rf ~/.config/nchat || true

echo "nchat uninstallation complete!"
exit 0
