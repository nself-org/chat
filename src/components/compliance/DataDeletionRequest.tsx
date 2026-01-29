'use client';

import { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  XCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useComplianceStore } from '@/stores/compliance-store';
import type {
  DataDeletionRequest as DeletionRequest,
  DeletionScope,
} from '@/lib/compliance/compliance-types';
import {
  DELETION_SCOPES,
  COOLING_OFF_PERIOD_DAYS,
  createDeletionRequest,
  getDeletionStatusInfo,
  canCancelDeletion,
  isInCoolingOffPeriod,
  getRemainingCoolingOffDays,
  getScopeLabel,
} from '@/lib/compliance/data-deletion';

interface DeletionRequestCardProps {
  request: DeletionRequest;
  onCancel: (id: string) => void;
}

function DeletionRequestCard({ request, onCancel }: DeletionRequestCardProps) {
  const statusInfo = getDeletionStatusInfo(request.status);
  const { canCancel } = canCancelDeletion(request);
  const inCoolingOff = isInCoolingOffPeriod(request);
  const remainingDays = getRemainingCoolingOffDays(request);

  const StatusIcon = {
    pending: Clock,
    pending_verification: Shield,
    approved: CheckCircle,
    processing: Loader2,
    completed: CheckCircle,
    rejected: XCircle,
    cancelled: XCircle,
  }[request.status];

  return (
    <Card
      className={
        request.status === 'completed'
          ? 'border-green-200 bg-green-50/50'
          : request.status === 'rejected' || request.status === 'cancelled'
          ? 'border-gray-200 bg-gray-50/50'
          : ''
      }
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-lg ${
                request.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : request.status === 'rejected' || request.status === 'cancelled'
                  ? 'bg-gray-100 text-gray-400'
                  : request.status === 'processing'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}
            >
              <StatusIcon
                className={`h-5 w-5 ${
                  request.status === 'processing' ? 'animate-spin' : ''
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Deletion Request</p>
                <Badge
                  variant={
                    request.status === 'completed'
                      ? 'default'
                      : request.status === 'rejected' || request.status === 'cancelled'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Scope: {getScopeLabel(request.scope)}
              </p>
              <p className="text-sm text-muted-foreground">
                Requested: {new Date(request.requestedAt).toLocaleString()}
              </p>
              {inCoolingOff && (
                <p className="text-sm text-yellow-600 mt-2">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {remainingDays} day(s) remaining to cancel
                </p>
              )}
              {request.rejectionReason && (
                <p className="text-sm text-red-600 mt-2">
                  Reason: {request.rejectionReason}
                </p>
              )}
              {request.legalHoldBlocked && (
                <p className="text-sm text-orange-600 mt-2">
                  <Shield className="h-3 w-3 inline mr-1" />
                  Blocked by legal hold
                </p>
              )}
            </div>
          </div>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(request.id)}
            >
              Cancel Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DataDeletionRequest() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<DeletionScope>('full_account');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    deletionRequests,
    legalHolds,
    addDeletionRequest,
    updateDeletionRequest,
  } = useComplianceStore();

  // Mock user data
  const currentUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  const userRequests = deletionRequests.filter((r) => r.userId === currentUser.id);
  const hasPendingRequest = userRequests.some((r) =>
    ['pending', 'pending_verification', 'approved', 'processing'].includes(r.status)
  );

  const handleOpenDialog = () => {
    setSelectedScope('full_account');
    setReason('');
    setIsDialogOpen(true);
  };

  const handleProceed = () => {
    setIsDialogOpen(false);
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const request = createDeletionRequest(currentUser.id, currentUser.email, {
        scope: selectedScope,
        reason: reason || undefined,
      });

      addDeletionRequest(request);

      setIsConfirmOpen(false);
      alert(
        'Your deletion request has been submitted. Please check your email to verify your identity.'
      );
    } catch (error) {
      console.error('Failed to submit deletion request:', error);
      alert('Failed to submit deletion request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (id: string) => {
    if (confirm('Are you sure you want to cancel this deletion request?')) {
      updateDeletionRequest(id, { status: 'cancelled' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trash2 className="h-6 w-6" />
          Delete Your Data
        </h2>
        <p className="text-muted-foreground">
          Request deletion of your personal data (GDPR Article 17)
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div className="space-y-2">
              <p className="font-medium text-red-800">
                Data deletion is permanent and cannot be undone
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>All selected data will be permanently deleted</li>
                <li>You will not be able to recover any deleted data</li>
                <li>
                  You have {COOLING_OFF_PERIOD_DAYS} days to cancel after approval
                </li>
                <li>Some data may be retained for legal compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Button */}
      <Card>
        <CardHeader>
          <CardTitle>Request Data Deletion</CardTitle>
          <CardDescription>
            Start the process to delete your personal data from our systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingRequest ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  You already have a pending deletion request
                </span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Please wait for the current request to be processed or cancel it
                to submit a new one.
              </p>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={handleOpenDialog}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Request Data Deletion
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Previous Requests */}
      {userRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Deletion Requests</h3>
          <div className="space-y-4">
            {userRequests
              .sort(
                (a, b) =>
                  new Date(b.requestedAt).getTime() -
                  new Date(a.requestedAt).getTime()
              )
              .map((request) => (
                <DeletionRequestCard
                  key={request.id}
                  request={request}
                  onCancel={handleCancel}
                />
              ))}
          </div>
        </div>
      )}

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            About Data Deletion
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Under GDPR Article 17, you have the right to have your personal data
            erased ("right to be forgotten"). This applies when:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>The data is no longer necessary for its original purpose</li>
            <li>You withdraw consent</li>
            <li>You object to processing and there are no overriding grounds</li>
            <li>The data was unlawfully processed</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> Some data may be retained for legal compliance,
            legitimate business purposes, or active legal holds.
          </p>
        </CardContent>
      </Card>

      {/* Scope Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Choose Deletion Scope</DialogTitle>
            <DialogDescription>
              Select what data you want to delete
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedScope}
              onValueChange={(value) => setSelectedScope(value as DeletionScope)}
            >
              {DELETION_SCOPES.map((scope) => (
                <div
                  key={scope.scope}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedScope === scope.scope
                      ? 'border-red-300 bg-red-50'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedScope(scope.scope)}
                >
                  <RadioGroupItem value={scope.scope} id={scope.scope} />
                  <div className="flex-1">
                    <Label htmlFor={scope.scope} className="font-medium cursor-pointer">
                      {scope.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {scope.description}
                    </p>
                    {scope.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {scope.categories.map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you're deleting your data..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleProceed}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                You are about to request deletion of your data with scope:{' '}
                <strong>{getScopeLabel(selectedScope)}</strong>
              </p>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-medium">This action cannot be undone.</p>
                <p className="text-sm mt-1">
                  Once processed, your data will be permanently deleted from our
                  systems. You have {COOLING_OFF_PERIOD_DAYS} days after approval
                  to cancel.
                </p>
              </div>
              <p className="text-sm">
                A verification email will be sent to <strong>{currentUser.email}</strong>.
                You must verify your identity before the request is processed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Yes, Delete My Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
