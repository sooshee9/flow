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
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { deleteComplaintAction } from '../../lib/actions';
import type { Complaint } from '../../lib/types';
import { useToast } from '../../hooks/use-toast';
import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteComplaintDialogProps {
  complaint: Complaint;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteComplaintDialog({ complaint, isOpen, onOpenChange }: DeleteComplaintDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteComplaintAction(complaint.id);
      if (result.success) {
        toast({ title: 'Success', description: 'Complaint deleted successfully.' });
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to delete complaint.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this complaint?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the complaint for machine:
            <strong className="ml-1">{complaint.machineName}</strong> (ID: {complaint.id}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}