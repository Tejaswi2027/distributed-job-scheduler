import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queuesApi } from '../api/client';
import { Button, Loading, Empty, Badge } from '../components/ui';
import styles from '../components/ui/ui.module.css';
import { Plus, Pause, Play, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const Queues: React.FC = () => {
  const qc = useQueryClient();
  const { selectedProjectId } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', concurrencyLimit: 10, priority: 1 });

  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues', selectedProjectId],
    queryFn: () => queuesApi.listByProject(selectedProjectId).then(r => r.data),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: () => queuesApi.create({ ...form, projectId: selectedProjectId }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['queues', selectedProjectId] }); 
      setShowCreate(false); 
      setForm({ name: '', concurrencyLimit: 10, priority: 1 }); 
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => queuesApi.pause(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queues', selectedProjectId] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => queuesApi.resume(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queues', selectedProjectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => queuesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queues', selectedProjectId] }),
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Queues</div>
          <div className={styles.pageSubtitle}>Manage job queues across your projects</div>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedProjectId}>
          <Plus size={14} /> New Queue
        </Button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 420, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 15 }}>Create Queue</div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Queue Name</label>
              <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. email-notifications" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Concurrency Limit</label>
              <input className={styles.input} type="number" min={1} max={500} value={form.concurrencyLimit} onChange={e => setForm(f => ({ ...f, concurrencyLimit: +e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Priority (1–100)</label>
              <input className={styles.input} type="number" min={1} max={100} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || !selectedProjectId}>Create Queue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!selectedProjectId ? (
        <Empty text="Select a project in the header to view its queues." />
      ) : isLoading ? (
        <Loading />
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Queues ({queues.length})</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Status</th><th>Priority</th><th>Concurrency</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {queues.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No queues found.</td></tr>
              ) : queues.map((q: any) => (
                <tr key={q.id}>
                  <td style={{ fontWeight: 500 }}>{q.name}</td>
                  <td><Badge status={q.isPaused ? 'paused' : 'ACTIVE'} /></td>
                  <td>{q.priority}</td>
                  <td>{q.concurrencyLimit}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {q.isPaused
                        ? <Button variant="ghost" onClick={() => resumeMutation.mutate(q.id)}><Play size={13} /></Button>
                        : <Button variant="ghost" onClick={() => pauseMutation.mutate(q.id)}><Pause size={13} /></Button>
                      }
                      <Button variant="ghost" onClick={() => deleteMutation.mutate(q.id)}><Trash2 size={13} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Queues;
