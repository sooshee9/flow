import React from 'react';
import { format } from 'date-fns';
import type { Complaint } from '../../types/complaint';

interface ComplaintHistoryModalProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
}

export const ComplaintHistoryModal: React.FC<ComplaintHistoryModalProps> = ({ open, onClose, complaint }) => {
  if (!open) return null;
  if (!complaint) {
    return (
      <div style={{ padding: 24, color: 'red', fontWeight: 600 }}>
        No complaint selected.<br />
      </div>
    );
  }

  return (
    <div style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: open ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'linear-gradient(135deg, #e3f0ff 0%, #90caf9 100%)', borderRadius: 12, minWidth: 400, minHeight: 200, padding: 28, boxShadow: '0 0 24px #0004', position: 'relative', border: '2px solid #1976d2' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 12, fontWeight: 700, fontSize: 22, background: '#1976d2', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', boxShadow: '0 2px 8px #1976d233' }} title="Close">×</button>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 12, color: '#1976d2' }}>Complaint History</h2>
        {Array.isArray(complaint.history) && complaint.history.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {complaint.history.map((h, i) => {
              let label = '';
              if (h.action === 'Created') {
                label = 'Updated by ';
              } else if (h.action === 'Updated') {
                label = 'Updated by ';
              } else {
                label = `${h.action} by `;
              }
              return (
                <li key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#333', fontWeight: 500 }}>{label}</span>
                  <a href={`mailto:${h.user}`} style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}>{h.user}</a>
                  <span style={{ color: '#c2185b', fontWeight: 600 }}>{new Date(h.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ color: 'red', fontWeight: 600 }}>
            No history available.<br />
          </div>
        )}
      </div>
    </div>
  );
};
