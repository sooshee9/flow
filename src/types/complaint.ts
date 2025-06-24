export type AssignedTo = 'Person A' | 'Person B' | 'Person C' | 'Person D';

export interface Complaint {
  id: string;
  complaintDate: string;
  machineName: string;
  complaintDescription: string;
  priority: 'Low' | 'Medium' | 'High';
  complaintStatus: 'Open' | 'In Progress' | 'Closed' | 'Pending Parts';
  actionDate: string | null;
  maintenanceRemarks: string | null;
  initialInspectionDate: string | null;
  estimatedEndDate: string | null;
  finalizationDate: string | null;
  updatedBy: string;
  complaintId: string;
  department: string;
  materialsUsed: Array<{
    name: string;
    quantity: string;
    remarks?: string;
  }>;
  history: Array<{
    action: string;
    user: string;
    timestamp: string;
  }>;
  assignedTo: AssignedTo;
}