'use client';

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

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void | Promise<void>;
  onError?: (error: unknown) => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  onConfirm,
  onError,
}: ConfirmationDialogProps) {
  const handleConfirmError = (error: unknown) => {
    console.error('ConfirmationDialog: onConfirm failed to complete.', error);

    if (onError) {
      onError(error);
      return;
    }

    if (onError) {
      onError(error);
      return;
    }

    // Error already logged above; no onError handler provided to notify parent
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            onClick={async (event) => {
              event.preventDefault();
              try {
                await onConfirm();
              } catch (error) {
                handleConfirmError(error);
              }
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
