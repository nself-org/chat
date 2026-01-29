'use client';

import * as React from 'react';
import { useState } from 'react';
import { Check, Download, Loader2, Pause, Play, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppDirectoryStore } from '@/stores/app-directory-store';
import { AppPermissions } from './AppPermissions';
import type { App, PermissionScope } from '@/lib/app-directory/app-types';
import { getRequiredPermissions, getOptionalPermissions } from '@/lib/app-directory/app-permissions';
import Link from 'next/link';

interface AppInstallButtonProps {
  app: App;
  variant?: 'default' | 'compact';
  className?: string;
}

export function AppInstallButton({
  app,
  variant = 'default',
  className,
}: AppInstallButtonProps) {
  const { isAppInstalled, getInstallation, installApp, uninstallApp, isInstalling, error } =
    useAppDirectoryStore();

  const isInstalled = isAppInstalled(app.id);
  const installation = getInstallation(app.id);
  const isCurrentlyInstalling = isInstalling === app.id;

  const [showPermissions, setShowPermissions] = useState(false);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionScope[]>([]);

  // Prepare permissions when dialog opens
  const handleInstallClick = () => {
    const required = getRequiredPermissions(app.permissions).map((p) => p.scope);
    const optional = getOptionalPermissions(app.permissions).map((p) => p.scope);
    setSelectedPermissions([...required, ...optional]);
    setShowPermissions(true);
  };

  const handleConfirmInstall = async () => {
    await installApp(app.id, {
      appId: app.id,
      permissions: selectedPermissions,
    });
    setShowPermissions(false);
  };

  const handleUninstall = async () => {
    await uninstallApp(app.id);
    setShowUninstallConfirm(false);
  };

  // Installed state with dropdown menu
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          disabled={isCurrentlyInstalling}
        >
          {isCurrentlyInstalling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-green-500" />
          )}
          Installed
        </Button>
      );
    }

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn('gap-2', className)}
              disabled={isCurrentlyInstalling}
            >
              {isCurrentlyInstalling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 text-green-500" />
              )}
              Installed
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/apps/${app.slug}/settings`}>
                <Settings className="w-4 h-4 mr-2" />
                App Settings
              </Link>
            </DropdownMenuItem>
            {installation?.status === 'paused' ? (
              <DropdownMenuItem>
                <Play className="w-4 h-4 mr-2" />
                Resume App
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Pause className="w-4 h-4 mr-2" />
                Pause App
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowUninstallConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Uninstall
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Uninstall Confirmation */}
        <AlertDialog open={showUninstallConfirm} onOpenChange={setShowUninstallConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Uninstall {app.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the app and all its settings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUninstall}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isCurrentlyInstalling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Uninstall
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Not installed state
  return (
    <>
      <Button
        onClick={handleInstallClick}
        disabled={isCurrentlyInstalling}
        className={cn('gap-2', className)}
        size={variant === 'compact' ? 'sm' : 'default'}
      >
        {isCurrentlyInstalling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {isCurrentlyInstalling ? 'Installing...' : 'Install'}
      </Button>

      {/* Permissions Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Install {app.name}</DialogTitle>
            <DialogDescription>
              Review the permissions this app needs to work properly.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <AppPermissions
              permissions={app.permissions}
              interactive
              selectedPermissions={selectedPermissions}
              onPermissionToggle={(scope, selected) => {
                if (selected) {
                  setSelectedPermissions([...selectedPermissions, scope]);
                } else {
                  setSelectedPermissions(selectedPermissions.filter((p) => p !== scope));
                }
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissions(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmInstall} disabled={isCurrentlyInstalling}>
              {isCurrentlyInstalling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
