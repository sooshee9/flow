'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { deleteComplaintAction } from '../../lib/actions';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ComplaintsTable } from './ComplaintsTable';
import { Complaint } from '../../types/complaint';
import { useRefreshOnReturn } from './useRefreshOnReturn';
import { ComplaintHistoryModal } from './ComplaintHistoryModal';
import { useQueryParam } from './useQueryParam';

interface ComplaintsClientPageProps {
  initialComplaints?: Complaint[];
}

export function ComplaintsClientPage({ initialComplaints = [] }: ComplaintsClientPageProps) {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const router = useRouter();
  const refreshParam = useQueryParam('refresh');

  const fetchComplaints = async () => {
    console.log('[ComplaintsClientPage] fetchComplaints: currentUser', currentUser);
    if (!currentUser) return;
    try {
      let complaintsQuery;
      if (currentUser.role === 'admin' || currentUser.role === 'maintenance') {
        complaintsQuery = collection(db, 'complaints');
      } else {
        complaintsQuery = query(collection(db, 'complaints'), where('createdBy', '==', currentUser.email));
      }
      const querySnapshot = await getDocs(complaintsQuery);
      const validStatuses = ['Open', 'In Progress', 'Closed', 'Pending Parts'] as const;
      const complaintsData = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        const complaintStatus = validStatuses.includes(data.complaintStatus)
          ? data.complaintStatus
          : 'Open';
        const complaintObj = {
          id: doc.id,
          complaintDate: data.complaintDate || '',
          machineName: data.machineName || '',
          complaintDescription: data.complaintDescription || '',
          priority: data.priority || 'Low',
          complaintStatus,
          actionDate: data.actionDate || null,
          maintenanceRemarks: data.maintenanceRemarks || null,
          initialInspectionDate: data.initialInspectionDate || null,
          estimatedEndDate: data.estimatedEndDate || null,
          finalizationDate: data.finalizationDate || null,
          createdBy: data.createdBy || '',
          department: data.department || '',
          materialsUsed: data.materialsUsed || [],
          history: data.history || [],
          complaintId: data.complaintId || doc.id,
          assignedTo: data.assignedTo || 'Person A',
        };
        return complaintObj;
      }) as Complaint[];
      setComplaints(complaintsData);
      console.log('[ComplaintsClientPage] complaintsData:', complaintsData);
      // DEBUG: Log each complaint's id and history
      complaintsData.forEach(c => {
        console.log(`[ComplaintsClientPage] complaint id: ${c.id}, history:`, c.history);
      });
    } catch (error) {
      console.error('[ComplaintsClientPage] Error fetching complaints:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (refreshParam === '1') {
      fetchComplaints();
      // Remove the ?refresh=1 param from the URL after refreshing
      if (typeof window !== 'undefined' && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('refresh');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, [refreshParam]);

  useRefreshOnReturn(() => {
    // Only refresh if we're on the dashboard root
    if (window.location.pathname === '/') {
      fetchComplaints();
    }
  });

  const handleEdit = (complaint: Complaint) => {
    router.push(`/complaints/edit/${complaint.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteComplaintAction(id);
      if (result.success) {
        setComplaints(complaints.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting complaint:', error);
    }
  };

  const handleHistory = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setHistoryModalOpen(true);
  };

  return (
    <div className="p-4 h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Complaints</h2>
        {currentUser ? (
          <Button
            className="bg-primary text-primary-foreground px-6 py-2 rounded shadow hover:bg-primary/90 transition text-lg font-bold"
            onClick={() => router.push('/complaints/new')}
            data-testid="new-complaint-btn"
          >
            + New Complaint
          </Button>
        ) : (
          <span className="text-red-600 font-semibold">User not authenticated</span>
        )}
      </div>
      <div className="mt-4">
        <ComplaintsTable
          complaints={complaints}
          onEdit={handleEdit}
          onDelete={complaint => handleDelete(complaint.id)}
          onHistory={handleHistory}
          currentUser={currentUser}
        />
      </div>
      <ComplaintHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        complaint={selectedComplaint}
      />
    </div>
  );
}