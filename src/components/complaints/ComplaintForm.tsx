'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AppForm, AppFormControl, FormField, AppFormItem, AppFormLabel, AppFormMessage } from '../ui/form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { createComplaintAction, updateComplaintAction } from '../../lib/actions';
import { Complaint } from '../../types/complaint';
import { v4 as uuidv4 } from 'uuid';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AssignedTo } from '../../lib/types';

const departments = [
  'Mechanical',
  'Electrical',
  'Production',
  'Quality',
  'Other',
];

const ComplaintSchema = z.object({
  complaintId: z.string(),
  complaintDate: z.string(),
  machineName: z.string().min(1, 'Machine name is required'),
  complaintDescription: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  complaintStatus: z.enum(['Open', 'In Progress', 'Closed', 'Pending Parts']).default('Open'),
  actionDate: z.string().nullable().default(null),
  maintenanceRemarks: z.string().nullable().default(null),
  initialInspectionDate: z.string().nullable().default(null),
  estimatedEndDate: z.string().nullable().default(null),
  finalizationDate: z.string().nullable().default(null),
  createdBy: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department is required'),
  assignedTo: z.enum(['Person A', 'Person B', 'Person C', 'Person D']).default('Person A'),
  materialsUsed: z
    .array(
      z.object({
        name: z.string().min(1, 'Material name required'),
        quantity: z.string().min(1, 'Quantity required'),
        remarks: z.string().optional(),
      })
    )
    .default([]),
  history: z
    .array(
      z.object({
        action: z.string(),
        user: z.string(),
        timestamp: z.string(),
      })
    )
    .default([]),
});

type ComplaintFormData = z.infer<typeof ComplaintSchema>;

export function ComplaintForm({
  onSuccess,
  complaint,
}: {
  onSuccess: () => void;
  complaint?: Complaint;
}) {
  const { currentUser, loading } = useAuth(); // Use loading from AuthContext
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState(
    complaint?.materialsUsed || [
      { name: '', quantity: '', remarks: '' },
    ]
  );
  const [department, setDepartment] = useState(
    complaint?.department || 'Mechanical'
  );
  const [history, setHistory] = useState(
    complaint?.history || []
  );
  const [serialId, setSerialId] = useState(complaint?.complaintId || '');

  // DEBUG: Log on every render
  useEffect(() => {
    console.log('[ComplaintForm] Render. currentUser:', currentUser, 'loading:', loading);
  });

  // Generate a serial complaintId like AIRTECH-01 for new complaints
  useEffect(() => {
    async function generateSerialId() {
      if (complaint) return; // Only for new complaints
      const complaintsRef = collection(db, 'complaints');
      const q = query(complaintsRef, orderBy('complaintId', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      let nextNumber = 1;
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].data().complaintId;
        const match = lastId && lastId.match(/AIRTECH-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const newId = `AIRTECH-${String(nextNumber).padStart(2, '0')}`;
      setSerialId(newId);
      form.setValue('complaintId', newId);
    }
    generateSerialId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint]);

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(ComplaintSchema),
    defaultValues: {
      complaintId: complaint?.complaintId || '',
      complaintDate: complaint?.complaintDate || new Date().toISOString().split('T')[0],
      machineName: complaint?.machineName || '',
      complaintDescription: complaint?.complaintDescription || '',
      priority: complaint?.priority || 'Low',
      complaintStatus: complaint?.complaintStatus || 'Open',
      actionDate: complaint?.actionDate || null,
      maintenanceRemarks: complaint?.maintenanceRemarks || null,
      initialInspectionDate: complaint?.initialInspectionDate || null,
      estimatedEndDate: complaint?.estimatedEndDate || null,
      finalizationDate: complaint?.finalizationDate || null,
      createdBy: complaint?.createdBy || currentUser?.email || '',
      department: complaint?.department || '',
      assignedTo: (complaint?.assignedTo as AssignedTo) || 'Person A',
      materialsUsed: complaint?.materialsUsed || [
        { name: '', quantity: '', remarks: '' },
      ],
      history: complaint?.history || [],
    },
  });

  const onSubmit = async (data: ComplaintFormData) => {
    console.group('[ComplaintForm] onSubmit Debug');
    console.log('currentUser:', currentUser);
    console.log('form data:', data);
    if (!currentUser || !currentUser.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(currentUser.email)) {
      toast({
        title: 'Error',
        description: 'You must be logged in with a valid email to submit a complaint.',
        variant: 'destructive',
      });
      console.warn('Submission blocked: invalid or missing user/email', currentUser);
      console.groupEnd();
      return;
    }
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const user = currentUser.email;
      let newHistory: Complaint["history"] = [];
      if (!complaint) {
        // Always add a 'Created' entry as the first entry
        newHistory = [
          {
            action: 'Created',
            user,
            timestamp: now,
          }
        ];
      } else {
        // If updating, always preserve previous history and append an 'Updated' entry
        const prevHistory = Array.isArray(complaint.history) ? complaint.history : [];
        newHistory = [
          ...prevHistory,
          {
            action: 'Updated',
            user,
            timestamp: now,
          },
        ];
      }
      // Ensure history is always present
      if (!newHistory || newHistory.length === 0) {
        newHistory = [
          {
            action: 'Created',
            user,
            timestamp: now,
          }
        ];
      }
      const payload = {
        ...data,
        assignedTo: data.assignedTo,
        createdBy: user,
        department: data.department, // Use the department from form data, not local state
        materialsUsed: materials,
        history: newHistory,
      };
      console.log('Submitting payload:', payload);
      let result;
      if (complaint?.id) {
        result = await updateComplaintAction(complaint.id, payload);
      } else {
        result = await createComplaintAction(payload);
      }
      console.log('Submission result:', result);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        form.reset();
        onSuccess();
        console.info('Complaint submitted successfully:', {
          payload,
          result,
          user: currentUser,
          time: new Date().toISOString(),
        });
      } else {
        const errorMsg = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
        toast({ title: 'Error', description: errorMsg || result.message || 'Submission failed', variant: 'destructive' });
        console.error('Backend error:', result.message, errorMsg);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: 'Error', description: error?.message || 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // Only render the form if user context is loaded
  if (loading) {
    console.log('[ComplaintForm] AuthContext loading, not rendering form.');
    return (
      <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded text-center font-semibold animate-pulse">
        Checking login status...
      </div>
    );
  }

  // Only show the not-logged-in or not-authorized message if user context is loaded and user is not logged in or is a viewer
  if (currentUser == null) {
    console.warn('[ComplaintForm] currentUser is null, blocking form.');
    return (
      <div className="mb-4 p-4 bg-red-100 text-red-800 rounded text-center font-semibold">
        You must be logged in to submit a complaint.
      </div>
    );
  }
  if (currentUser.role === 'viewer') {
    console.warn('[ComplaintForm] currentUser.role is viewer, blocking form.');
    return (
      <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded text-center font-semibold">
        You do not have permission to submit a complaint.
      </div>
    );
  }

  // Render the form for valid users
  return (
    <AppForm form={form} key={currentUser?.email || 'nouser'} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800 mt-6">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center tracking-tight">Complaint Form</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-blue-50 via-pink-50 to-yellow-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 rounded-xl p-6 mb-4">
            <FormField
              control={form.control}
              name="complaintId"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-blue-700 dark:text-blue-300">Complaint ID</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} id={field.name} name={field.name} readOnly className="bg-blue-100 dark:bg-zinc-800 font-semibold text-blue-900 dark:text-blue-200" />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complaintDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-pink-700 dark:text-pink-300">Complaint Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} id={field.name} name={field.name} className="bg-pink-100 dark:bg-zinc-800 text-pink-900 dark:text-pink-200" />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="machineName"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-yellow-700 dark:text-yellow-300">Machine Name</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} id={field.name} name={field.name} className="bg-yellow-100 dark:bg-zinc-800 text-yellow-900 dark:text-yellow-200" />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complaintDescription"
              render={({ field }) => (
                <AppFormItem className="md:col-span-2">
                  <AppFormLabel htmlFor={field.name} className="text-purple-700 dark:text-purple-300">Description</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} id={field.name} name={field.name} className="bg-purple-100 dark:bg-zinc-800 text-purple-900 dark:text-purple-200" />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority dropdown (native select) */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-red-700 dark:text-red-300">Priority</AppFormLabel>
                  <AppFormControl>
                    <select
                      {...field}
                      id={field.name}
                      name={field.name}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complaintStatus"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-green-700 dark:text-green-300">Status</AppFormLabel>
                  <AppFormControl>
                    <select
                      {...field}
                      id={field.name}
                      name={field.name}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-black"
                      required
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                      <option value="Pending Parts">Pending Parts</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Action Date <span className="text-xs text-gray-500">(Date when action was/will be taken)</span></AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} id={field.name} name={field.name} value={field.value || ''} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maintenanceRemarks"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Maintenance Remarks</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} id={field.name} name={field.name} value={field.value || ''} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initialInspectionDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Initial Inspection Date <span className="text-xs text-gray-500">(First check/inspection date)</span></AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} id={field.name} name={field.name} value={field.value || ''} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimatedEndDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Estimated End Date <span className="text-xs text-gray-500">(Expected completion date)</span></AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} id={field.name} name={field.name} value={field.value || ''} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="finalizationDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Finalization Date <span className="text-xs text-gray-500">(Date when complaint was fully resolved)</span></AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} id={field.name} name={field.name} value={field.value || ''} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="createdBy"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name}>Created By (Email)</AppFormLabel>
                  <AppFormControl>
                    <Input type="email" {...field} id={field.name} name={field.name} value={field.value || ''} readOnly />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            {/* Concerned Department dropdown (native select) */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel htmlFor={field.name} className="text-indigo-700 dark:text-indigo-300">Concerned Department</AppFormLabel>
                  <AppFormControl>
                    <select
                      {...field}
                      id={field.name}
                      name={field.name}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
                      required
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel className="text-blue-700 dark:text-blue-300">Assigned To</AppFormLabel>
                  <AppFormControl>
                    <select
                      {...field}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black"
                    >
                      <option value="Person A">Person A</option>
                      <option value="Person B">Person B</option>
                      <option value="Person C">Person C</option>
                      <option value="Person D">Person D</option>
                    </select>
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
          </div>
          <div className="md:col-span-2 mt-6">
            <h3 className="text-lg font-semibold text-pink-700 dark:text-pink-300 mb-2">Materials Used</h3>
            <div className="space-y-2">
              {materials.map((mat, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <div className="flex flex-col w-1/3">
                    <label htmlFor={`material-name-${idx}`} className="block text-xs font-semibold mb-1">Material Name</label>
                    <Input
                      id={`material-name-${idx}`}
                      name={`materialsUsed.${idx}.name`}
                      placeholder="Material Name"
                      value={mat.name}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].name = e.target.value;
                        setMaterials(newMats);
                        form.setValue('materialsUsed', newMats);
                      }}
                      className="bg-blue-50 dark:bg-zinc-800"
                      required
                    />
                  </div>
                  <div className="flex flex-col w-1/4">
                    <label htmlFor={`material-quantity-${idx}`} className="block text-xs font-semibold mb-1">Quantity</label>
                    <Input
                      id={`material-quantity-${idx}`}
                      name={`materialsUsed.${idx}.quantity`}
                      placeholder="Quantity"
                      value={mat.quantity}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].quantity = e.target.value;
                        setMaterials(newMats);
                        form.setValue('materialsUsed', newMats);
                      }}
                      className="bg-yellow-50 dark:bg-zinc-800"
                      required
                    />
                  </div>
                  <div className="flex flex-col w-1/3">
                    <label htmlFor={`material-remarks-${idx}`} className="block text-xs font-semibold mb-1">Remarks</label>
                    <Input
                      id={`material-remarks-${idx}`}
                      name={`materialsUsed.${idx}.remarks`}
                      placeholder="Remarks"
                      value={mat.remarks || ''}
                      onChange={(e) => {
                        const newMats = [...materials];
                        newMats[idx].remarks = e.target.value;
                        setMaterials(newMats);
                        form.setValue('materialsUsed', newMats);
                      }}
                      className="bg-pink-50 dark:bg-zinc-800"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newMats = materials.filter((_, i) => i !== idx);
                      setMaterials(newMats);
                      form.setValue('materialsUsed', newMats);
                    }}
                    disabled={materials.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-gradient-to-r from-blue-200 via-pink-200 to-yellow-200 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-700 text-blue-900 dark:text-blue-200"
                onClick={() => {
                  const newMats = [...materials, { name: '', quantity: '', remarks: '' }];
                  setMaterials(newMats);
                  form.setValue('materialsUsed', newMats);
                }}
              >
                + Add Material
              </Button>
            </div>
          </div>
          <div className="md:col-span-2 mt-6">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Complaint History</h3>
            <div className="bg-gradient-to-r from-green-50 via-blue-50 to-pink-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 rounded p-3 max-h-40 overflow-y-auto text-xs">
              {history.length === 0 ? (
                <div className="text-gray-500">No history yet.</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="mb-1">
                    <span className="font-semibold text-green-700 dark:text-green-300">{h.action}</span> by <span className="text-blue-700 dark:text-blue-300">{h.user}</span> on <span className="text-pink-700 dark:text-pink-300">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                ))
            )  } 
            </div>
          </div>
          <div className="md:col-span-2 mt-8">
            <Button type="submit" disabled={isLoading || !currentUser?.email} className="w-full text-lg font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 text-white shadow-lg hover:from-blue-600 hover:via-pink-600 hover:to-yellow-600">
              {isLoading
                ? 'Submitting...'
                : complaint
                ? 'Update'
                : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </AppForm>
  );
}