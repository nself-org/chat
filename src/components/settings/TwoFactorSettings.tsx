'use client';

import { useState } from 'react';
import { SettingsSection } from './settings-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Smartphone, Key, Check, AlertCircle, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TwoFactorSettingsProps {
  className?: string;
}

/**
 * TwoFactorSettings - 2FA setup and management
 */
export function TwoFactorSettings({ className }: TwoFactorSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Mock QR code secret
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockBackupCodes = [
    'A1B2C3D4',
    'E5F6G7H8',
    'I9J0K1L2',
    'M3N4O5P6',
    'Q7R8S9T0',
    'U1V2W3X4',
    'Y5Z6A7B8',
    'C9D0E1F2',
  ];

  const handleEnable = async () => {
    setSetupOpen(true);
    setStep('qr');
    setVerifyCode('');
    setError(null);
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate code format
      if (!/^\d{6}$/.test(verifyCode)) {
        throw new Error('Please enter a valid 6-digit code');
      }

      // TODO: Implement actual 2FA verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBackupCodes(mockBackupCodes);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setEnabled(true);
    setSetupOpen(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Implement actual 2FA disable
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEnabled(false);
      setDisableOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SettingsSection
      title="Two-Factor Authentication"
      description="Add an extra layer of security to your account"
      className={className}
    >
      <div className="space-y-4">
        {/* Status Card */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg border p-4',
            enabled && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                enabled
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-muted'
              )}
            >
              {enabled ? (
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {enabled ? 'Two-factor authentication is enabled' : 'Authenticator App'}
              </p>
              <p className="text-sm text-muted-foreground">
                {enabled
                  ? 'Your account is protected with 2FA'
                  : 'Use an authenticator app to generate verification codes'}
              </p>
            </div>
          </div>
          <Button
            variant={enabled ? 'outline' : 'default'}
            onClick={enabled ? () => setDisableOpen(true) : handleEnable}
          >
            {enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Info about 2FA */}
        {!enabled && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Why use 2FA?</strong> Two-factor authentication adds an extra
              layer of security by requiring a verification code from your phone in
              addition to your password.
            </p>
          </div>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === 'qr' && 'Set Up Authenticator App'}
              {step === 'verify' && 'Verify Code'}
              {step === 'backup' && 'Save Backup Codes'}
            </DialogTitle>
            <DialogDescription>
              {step === 'qr' &&
                'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
              {step === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {step === 'backup' &&
                'Save these backup codes in a safe place. You can use them to access your account if you lose your phone.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'qr' && (
            <div className="space-y-4 py-4">
              {/* Mock QR Code */}
              <div className="mx-auto h-48 w-48 rounded-lg border bg-white p-4">
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-sm text-muted-foreground">
                    [QR Code Placeholder]
                    <br />
                    Scan with authenticator app
                  </p>
                </div>
              </div>

              {/* Manual entry */}
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <code className="rounded bg-muted px-3 py-1.5 font-mono text-sm">
                  {mockSecret}
                </code>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-widest"
                  autoComplete="one-time-code"
                />
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="rounded bg-background px-2 py-1 text-center font-mono text-sm"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={copyBackupCodes}
                className="w-full gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Backup Codes
                  </>
                )}
              </Button>
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Each backup code can only be used once. Store them securely.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            {step === 'qr' && (
              <Button onClick={() => setStep('verify')}>Continue</Button>
            )}
            {step === 'verify' && (
              <>
                <Button variant="outline" onClick={() => setStep('qr')}>
                  Back
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={loading || verifyCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </>
            )}
            {step === 'backup' && (
              <Button onClick={handleComplete}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable 2FA? Your account will be less secure
              without it.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={loading}>
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
