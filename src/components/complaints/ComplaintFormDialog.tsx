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
  assignedTo: z.enum(['Person A', 'Person B', 'Person C', 'Person D']).default('Person A'),
  initialInspectionDate: z.string().nullable().default(null),
  estimatedEndDate: z.string().nullable().default(null),
  finalizationDate: z.string().nullable().default(null),
  createdBy: z.string().email('Valid email required'),
  department: z.string().min(1, 'Department is required'),
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
  const { currentUser } = useAuth();
  // Helper: can the user edit maintenance fields?
  const canEditMaintenance = currentUser?.role === 'admin' || currentUser?.role === 'maintenance';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [materials, setMaterials] = useState(
    complaint?.materialsUsed || [
      { name: '', quantity: '', remarks: '' },
    ]
  );
  const [department, setDepartment] = useState(complaint?.department || 'Mechanical');
  const [history, setHistory] = useState(
    complaint?.history || []
  );
  const [serialId, setSerialId] = useState(complaint?.complaintId || '');

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
      assignedTo: (complaint?.assignedTo as AssignedTo) || 'Person A',
      initialInspectionDate: complaint?.initialInspectionDate || null,
      estimatedEndDate: complaint?.estimatedEndDate || null,
      finalizationDate: complaint?.finalizationDate || null,
      createdBy: complaint?.createdBy || currentUser?.email || '',
      department: complaint?.department || 'Mechanical',
      materialsUsed: complaint?.materialsUsed || [
        { name: '', quantity: '', remarks: '' },
      ],
      history: complaint?.history || [],
    },
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

  const onSubmit = async (data: ComplaintFormData) => {
    if (!data.department || data.department === "") {
      toast({ title: 'Error', description: 'Department is required', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const user = currentUser?.email || 'Unknown';
      const newHistory = [
        ...history,
        {
          action: complaint ? 'Updated' : 'Created',
          user,
          timestamp: now,
        },
      ];
      const payload = {
        ...data,
        assignedTo: data.assignedTo,
        createdBy: user,
        department,
        materialsUsed: materials,
        history: newHistory,
      };
      let result;
      if (complaint?.id) {
        result = await updateComplaintAction(complaint.id, payload);
      } else {
        result = await createComplaintAction(payload);
      }

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        form.reset();
        onSuccess();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppForm form={form}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 border border-zinc-200 dark:border-zinc-800 mt-6">
        <h2 className="text-2xl font-bold text-primary mb-6 text-center tracking-tight">Complaint Form</h2>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-r from-blue-50 via-pink-50 to-yellow-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800 rounded-xl p-6 mb-4">
            <FormField
              control={form.control}
              name="complaintId"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel className="text-blue-700 dark:text-blue-300">Complaint ID</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} value={serialId || field.value} readOnly className="bg-blue-100 dark:bg-zinc-800 font-semibold text-blue-900 dark:text-blue-200" />
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
                  <AppFormLabel className="text-pink-700 dark:text-pink-300">Complaint Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} className="bg-pink-100 dark:bg-zinc-800 text-pink-900 dark:text-pink-200" />
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
                  <AppFormLabel className="text-yellow-700 dark:text-yellow-300">Machine Name</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} className="bg-yellow-100 dark:bg-zinc-800 text-yellow-900 dark:text-yellow-200" />
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
                  <AppFormLabel className="text-purple-700 dark:text-purple-300">Description</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} className="bg-purple-100 dark:bg-zinc-800 text-purple-900 dark:text-purple-200" />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel className="text-red-700 dark:text-red-300">Priority</AppFormLabel>
                  <AppFormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="bg-red-100 dark:bg-zinc-800 text-red-900 dark:text-red-200">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <AppFormLabel className="text-green-700 dark:text-green-300">Status</AppFormLabel>
                  <AppFormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="bg-green-100 dark:bg-zinc-800 text-green-900 dark:text-green-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Pending Parts">Pending Parts</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <AppFormLabel>Action Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} value={field.value || ''} disabled={!canEditMaintenance} />
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
                  <AppFormLabel>Maintenance Remarks</AppFormLabel>
                  <AppFormControl>
                    <Input {...field} value={field.value || ''} disabled={!canEditMaintenance} />
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
                      disabled={!canEditMaintenance}
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
            <FormField
              control={form.control}
              name="initialInspectionDate"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel>Initial Inspection Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} value={field.value || ''} disabled={!canEditMaintenance} />
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
                  <AppFormLabel>Estimated End Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} value={field.value || ''} disabled={!canEditMaintenance} />
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
                  <AppFormLabel>Finalization Date</AppFormLabel>
                  <AppFormControl>
                    <Input type="date" {...field} value={field.value || ''} disabled={!canEditMaintenance} />
                  </AppFormControl>
                  <AppFormMessage />
                </AppFormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <AppFormItem>
                  <AppFormLabel className="text-indigo-700 dark:text-indigo-300">Concerned Department</AppFormLabel>
                  <AppFormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setDepartment(val);
                      }}
                      value={field.value || department}
                      required
                      // department should always be editable for complaint users
                      disabled={currentUser?.role === 'admin' || currentUser?.role === 'maintenance' ? !canEditMaintenance : false}
                    >
                      <SelectTrigger className="bg-indigo-100 dark:bg-zinc-800 text-indigo-900 dark:text-indigo-200">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Input
                    placeholder="Material Name"
                    value={mat.name}
                    onChange={(e) => {
                      const newMats = [...materials];
                      newMats[idx].name = e.target.value;
                      setMaterials(newMats);
                      form.setValue('materialsUsed', newMats);
                    }}
                    className="w-1/3 bg-blue-50 dark:bg-zinc-800"
                  />
                  <Input
                    placeholder="Quantity"
                    value={mat.quantity}
                    onChange={(e) => {
                      const newMats = [...materials];
                      newMats[idx].quantity = e.target.value;
                      setMaterials(newMats);
                      form.setValue('materialsUsed', newMats);
                    }}
                    className="w-1/4 bg-yellow-50 dark:bg-zinc-800"
                  />
                  <Input
                    placeholder="Remarks"
                    value={mat.remarks || ''}
                    onChange={(e) => {
                      const newMats = [...materials];
                      newMats[idx].remarks = e.target.value;
                      setMaterials(newMats);
                      form.setValue('materialsUsed', newMats);
                    }}
                    className="w-1/3 bg-pink-50 dark:bg-zinc-800"
                  />
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
                  <div key={i} className="mb-1 flex items-center gap-4">
                    <a href={`mailto:${h.user}`} className="text-blue-700 dark:text-blue-300 underline font-medium">{h.user}</a>
                    <span className="text-pink-700 dark:text-pink-300 font-semibold">{new Date(h.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                  </div>
                ))
              )   }
            </div>
          </div>
          <div className="md:col-span-2 mt-8">
            <Button type="submit" disabled={isLoading} className="w-full text-lg font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-500 text-white shadow-lg hover:from-blue-600 hover:via-pink-600 hover:to-yellow-600">
              {isLoading
                ? 'Submitting...'
                : complaint
                ? 'Update'
                : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </AppForm>
  );
}