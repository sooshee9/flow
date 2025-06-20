import { z } from 'zod';
import type { Priority, ComplaintStatus } from './types';

export const complaintSchema = z.object({
  complaintDate: z.string().nonempty('Complaint date is required'),
  machineName: z.string().min(1, 'Machine name is required'),
  complaintDescription: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High'], {
    required_error: 'Priority is required',
  }),
  complaintStatus: z.enum([
    'Open',
    'In Progress',
    'Pending Parts',
    'Resolved',
    'Closed',
    'Cancelled',
  ], {
    required_error: 'Status is required',
  }),
  actionDate: z.string().nullable().optional(),
  maintenanceRemarks: z.string().nullable().optional(),
  initialInspectionDate: z.string().nullable().optional(),
  estimatedEndDate: z.string().nullable().optional(),
  finalizationDate: z.string().nullable().optional(),
  createdBy: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department is required'),
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
  assignedTo: z.string().default('Person A'),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;