import { db } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import type { Complaint, User } from './types';

export async function getComplaints(): Promise<Complaint[]> {
  try {
    const complaintsCollection = collection(db, 'complaints');
    const complaintSnapshot: QuerySnapshot<DocumentData> = await getDocs(complaintsCollection);
    const complaintList: Complaint[] = complaintSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        complaintDate: typeof data.complaintDate === 'string'
          ? data.complaintDate
          : data.complaintDate instanceof Date
            ? data.complaintDate.toISOString().split('T')[0]
            : '', // Fallback to empty string
        machineName: data.machineName ?? '',
        complaintDescription: data.complaintDescription ?? '',
        priority: data.priority ?? 'Low',
        complaintStatus: data.complaintStatus ?? 'Open',
        actionDate: data.actionDate ?? null,
        maintenanceRemarks: data.maintenanceRemarks ?? null,
        initialInspectionDate: data.initialInspectionDate ?? null,
        estimatedEndDate: data.estimatedEndDate ?? null,
        finalizationDate: data.finalizationDate ?? null,
        createdBy: data.createdBy ?? '',
        department: data.department ?? '',
        materialsUsed: data.materialsUsed ?? [],
        history: data.history ?? [],
        complaintId: data.complaintId ?? doc.id,
        assignedTo: data.assignedTo ?? 'Person A',
      };
    });
    return complaintList;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return [];
  }
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return null;
    }
    const userData = userDoc.data();
    return {
      uid: userDoc.id,
      email: userData.email ?? null,
      role: userData.role ?? 'viewer',
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}