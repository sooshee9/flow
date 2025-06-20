"use client";

import type { Complaint } from '../../types/complaint';
import type { User } from '../../lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { useMemo } from "react";


interface ComplaintsTableProps {
  complaints: Complaint[];
  onEdit: (complaint: Complaint) => void;
  onDelete: (complaint: Complaint) => void;
  onHistory: (complaint: Complaint) => void;
  currentUser: User | null;
}

export function ComplaintsTable({ complaints, onEdit, onDelete, onHistory, currentUser }: ComplaintsTableProps) {
  const getPriorityBadgeVariant = (priority: Complaint["priority"]) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "default";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };
  
  const getStatusColor = (status: Complaint["complaintStatus"]) => {
    switch (status) {
      case "Open": return "bg-red-500";
      case "In Progress": return "bg-yellow-500";
      case "Pending Parts": return "bg-blue-500";
      case "Closed": return "bg-gray-500";
      default: return "bg-gray-300";
    }
  };

  const userPermissions = useMemo(() => {
    if (!currentUser) return { canEditAny: false, canDeleteAny: false, isEffectivelyViewer: true };
    const role = currentUser.role;
    
    let canEditThisComplaint = false;
    let canDeleteThisComplaint = false;

    if (role === 'admin') {
        canEditThisComplaint = true;
        canDeleteThisComplaint = true;
    } else if (role === 'special_editor_priority' || role === 'updater') {
        canEditThisComplaint = true; // Form dialog will handle specific field disabilities
        canDeleteThisComplaint = false;
    } else if (role === 'creator') {
        canEditThisComplaint = true; // Can open to view, form handles actual editability
        canDeleteThisComplaint = false;
    }
    // For viewer role, canEditThisComplaint remains false.

    return { 
        canEditAny: canEditThisComplaint, 
        canDeleteAny: canDeleteThisComplaint,
    };
  }, [currentUser]);

  if (!currentUser) {
    return <p className="text-center text-muted-foreground py-8">Please log in to view complaints.</p>;
  }
  
  if (!complaints || complaints.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No complaints found.</p>;
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-sm bg-white">
        <Table className="w-full">
          <colgroup>
            <col style={{ width: '60px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ minWidth: '250px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '200px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ minWidth: '200px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '120px' }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] pl-[20px]">Sl No</TableHead>
              <TableHead className="w-[100px]">Complaint ID</TableHead>
              <TableHead className="w-[120px]">C. Date</TableHead>
              <TableHead className="w-[140px]">Machine Name</TableHead>
              <TableHead className="min-w-[250px]">Description</TableHead>
              <TableHead className="w-[90px]">Priority</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[200px]">Created By (Email)</TableHead>
              <TableHead className="w-[160px]">Concerned Department</TableHead>
              <TableHead className="w-[120px]">A. Date</TableHead>
              <TableHead className="min-w-[200px]">Remarks</TableHead>
              <TableHead className="w-[90px]">Assigned To</TableHead>
              <TableHead className="w-[120px]">In-I. Date</TableHead>
              <TableHead className="w-[120px]">In-E. Date</TableHead>
              <TableHead className="w-[120px]">F. Date</TableHead>
              <TableHead className="text-center w-[120px]">History</TableHead>
              <TableHead className="text-center w-[80px]">Delete</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((complaint, idx) => {
              let canEditAnyFieldInForm = false;
              if (currentUser) {
                const role = currentUser.role;
                if (role === "admin") {
                  canEditAnyFieldInForm = true;
                } else if (role === "creator") {
                  canEditAnyFieldInForm = false;
                } else if (role === "updater") {
                  canEditAnyFieldInForm = true;
                } else if (role === "special_editor_priority") {
                  canEditAnyFieldInForm = true;
                }
              }

              return (
              <TableRow key={complaint.id} className="align-middle text-sm whitespace-nowrap">
                <TableCell className="font-mono text-xs text-muted-foreground py-3 pl-[20px]">{String(idx + 1).padStart(2, '0')}</TableCell>
                <TableCell className="font-mono text-xs font-bold py-3">{complaint.complaintId && complaint.complaintId.trim() !== '' && complaint.complaintId !== undefined ? complaint.complaintId : (complaint.id ? complaint.id.slice(-2).padStart(2, '0') : 'N/A')}</TableCell>
                <TableCell>{complaint.complaintDate && !isNaN(new Date(complaint.complaintDate).getTime()) ? format(new Date(complaint.complaintDate), "dd-MM-yy") : "N/A"}</TableCell>
                <TableCell className="font-medium">{complaint.machineName}</TableCell>
                <TableCell>
                  <Tooltip>
        <TooltipTrigger asChild>
          <p className="truncate max-w-[250px] hover:underline cursor-pointer">{complaint.complaintDescription}</p>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs bg-popover text-popover-foreground p-2 rounded shadow-lg border">
          <p className="text-sm">{complaint.complaintDescription}</p>
        </TooltipContent>
      </Tooltip>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      complaint.priority === 'High'
                      ? 'priority-badge-high'
                      : complaint.priority === 'Medium'
                      ? 'priority-badge-medium'
                      : 'priority-badge-low'
                    }
                  >
                    {complaint.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      complaint.complaintStatus === 'Open'
                      ? 'status-badge-open'
                      : complaint.complaintStatus === 'Closed'
                      ? 'status-badge-closed'
                      : 'status-badge-inprogress'
                    }
                  >
                    {complaint.complaintStatus}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs">{complaint.createdBy || 'N/A'}</TableCell>
                <TableCell style={{ minWidth: 180, fontWeight: 600 }}>{complaint.department && complaint.department !== '' ? complaint.department : 'N/A'}</TableCell>
                <TableCell>{complaint.actionDate && !isNaN(new Date(complaint.actionDate).getTime()) ? format(new Date(complaint.actionDate), "dd-MM-yy") : "N/A"}</TableCell>
                <TableCell>{complaint.maintenanceRemarks || "N/A"}</TableCell>
                <TableCell>
                  <select
                    value={complaint.assignedTo || 'Person A'}
                    onChange={e => {/* TODO: handle update, e.g. call a prop or local state update */}}
                    style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #1976d2', color: '#1976d2', background: '#e3f0ff', fontWeight: 600, minWidth: 160 }}
                  >
                    <option value="Person A">Person A</option>
                    <option value="Person B">Person B</option>
                    <option value="Person C">Person C</option>
                    <option value="Person D">Person D</option>
                  </select>
                </TableCell>
                <TableCell>{complaint.initialInspectionDate && !isNaN(new Date(complaint.initialInspectionDate).getTime()) ? format(new Date(complaint.initialInspectionDate), "dd-MM-yy") : "N/A"}</TableCell>
                <TableCell>{complaint.estimatedEndDate && !isNaN(new Date(complaint.estimatedEndDate).getTime()) ? format(new Date(complaint.estimatedEndDate), "dd-MM-yy") : "N/A"}</TableCell>
                <TableCell>{complaint.finalizationDate && !isNaN(new Date(complaint.finalizationDate).getTime()) ? format(new Date(complaint.finalizationDate), "dd-MM-yy") : "N/A"}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onHistory(complaint)}
                    aria-label="Complaint History"
                    className="text-blue-600 border-blue-400 hover:bg-blue-50"
                  >
                    History
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  {userPermissions.canDeleteAny && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(complaint)}
                      className="text-destructive hover:text-destructive/80"
                      aria-label="Delete Complaint"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(complaint)}
                    aria-label={canEditAnyFieldInForm && userPermissions.canEditAny ? "Edit Complaint" : "View Complaint"}
                  >
                    {canEditAnyFieldInForm && userPermissions.canEditAny ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}