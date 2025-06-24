export type Priority = 'Low' | 'Medium' | 'High';
export type ComplaintStatus =
  | 'Open'
  | 'In Progress'
  | 'Pending Parts'
  | 'Resolved'
  | 'Closed'
  | 'Cancelled';
export type AssignedTo = 'Person A' | 'Person B' | 'Person C' | 'Person D';

export interface Complaint {
  id: string;
  complaintDate: string;
  machineName: string;
  complaintDescription: string;
  priority: Priority;
  complaintStatus: ComplaintStatus;
  actionDate?: string | null;
  maintenanceRemarks?: string | null;
  initialInspectionDate?: string | null;
  estimatedEndDate?: string | null;
  finalizationDate?: string | null;
  updatedBy: string;
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
  complaintId: string;
  assignedTo: AssignedTo;
}

export interface User {
  uid: string;
  email: string | null;
  role:
    | 'admin'
    | 'maintenance'
    | 'creator'
    | 'updater'
    | 'viewer'
    | 'special_editor_priority'
    | 'special_editor_photos';
}