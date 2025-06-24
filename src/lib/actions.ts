// src/lib/actions.ts
'use server';

import { db } from '../../src/lib/firebase';
import { doc, deleteDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { Complaint } from '../types/complaint';
import { PRIORITY_LEVELS, COMPLAINT_STATUSES } from './constants';

const ComplaintSchema = z.object({
  complaintId: z.string(),
  complaintDate: z.string(),
  machineName: z.string().min(1, 'Machine name is required'),
  complaintDescription: z.string().min(1, 'Description is required'),
  priority: z.enum(PRIORITY_LEVELS),
  complaintStatus: z.enum(COMPLAINT_STATUSES).default('Open'),
  actionDate: z.string().nullable().default(null),
  maintenanceRemarks: z.string().nullable().default(null),
  initialInspectionDate: z.string().nullable().default(null),
  estimatedEndDate: z.string().nullable().default(null),
  finalizationDate: z.string().nullable().default(null),
  updatedBy: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department is required'),
  assignedTo: z.string().default('Person A'),
  materialsUsed: z.array(z.object({
    name: z.string().min(1, 'Material name required'),
    quantity: z.string().min(1, 'Quantity required'),
    remarks: z.string().optional(),
  })).default([]),
  history: z.array(z.object({
    action: z.string(),
    user: z.string(),
    timestamp: z.string(),
  })).default([]),
});

type ComplaintInput = z.infer<typeof ComplaintSchema>;

export async function createComplaintAction(data: ComplaintInput) {
  console.log('[createComplaintAction] Called with data:', data);
  // Log createdBy for debugging Firestore rules
  console.log('[createComplaintAction] createdBy:', data.createdBy);
  try {
    const validatedData = ComplaintSchema.parse(data);
    console.log('[createComplaintAction] Data validated, about to call addDoc...');
    const docRef = await addDoc(collection(db, 'complaints'), validatedData);
    console.log('[createComplaintAction] Firestore write successful! New doc id:', docRef.id);
    return { success: true, id: docRef.id, message: 'Complaint created successfully' };
  } catch (error) {
    // Improved error logging for Zod and Firestore errors
    if (error instanceof z.ZodError) {
      console.error('[createComplaintAction] Zod validation error:', error.errors);
      return { success: false, message: 'Validation failed', error: JSON.stringify(error.errors) };
    }
    console.error('[createComplaintAction] Firestore write failed:', error);
    return { success: false, message: 'Failed to create complaint', error: error instanceof Error ? error.stack || error.message : String(error) };
  }
}

export async function updateComplaintAction(id: string, data: ComplaintInput) {
  try {
    console.log('[updateComplaintAction] Called with id:', id, 'and data:', data);
    const validatedData = ComplaintSchema.parse(data);
    const docRef = doc(db, 'complaints', id);
    await updateDoc(docRef, validatedData);
    console.log('[updateComplaintAction] Firestore update successful for id:', id);
    return { success: true, message: 'Complaint updated successfully' };
  } catch (error) {
    // Improved error logging for Zod and Firestore errors
    if (error instanceof z.ZodError) {
      console.error('[updateComplaintAction] Zod validation error:', error.errors);
      return { success: false, message: 'Validation failed', error: JSON.stringify(error.errors) };
    }
    console.error('[updateComplaintAction] Firestore update failed for id:', id, 'Error:', error);
    return { success: false, message: 'Failed to update complaint', error: error instanceof Error ? error.stack || error.message : String(error) };
  }
}

export async function deleteComplaintAction(id: string) {
  try {
    console.log('[deleteComplaintAction] Called with id:', id);
    const docRef = doc(db, 'complaints', id);
    await deleteDoc(docRef);
    console.log('[deleteComplaintAction] Firestore delete successful for id:', id);
    return { success: true, message: 'Complaint deleted successfully' };
  } catch (error) {
    console.error('[deleteComplaintAction] Firestore delete failed for id:', id, 'Error:', error);
    return { success: false, message: 'Failed to delete complaint', error: error instanceof Error ? error.message : String(error) };
  }
}