import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledJobsApi, queuesApi } from '../api/client';
import { Loading, Empty, Button, Mono } from '../components/ui';
import styles from '../components/ui/ui.module.css';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const ScheduledJobs: React.FC = () => {
  const qc = useQueryClient();
  const { selectedProjectId } = useWorkspace();
  const [queues, setQueues] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', cronExpression: '0 * * * *', queueId: '', maxRetries: 3, payload: '{}' });

  // Load project's queues to choose from during schedule creation
  useEffect(() => {
    if (selectedProjectId) {
      queuesApi.listByProject(selectedProjectId).then((res) => {
        setQueues(res.data);
        if (res.data.length > 0) {
          setForm(f => ({ ...f, queueId: res.data[0].id }));
        }
      });
    } else {
      setQueues([]);
    }
  }, [selectedProjectId]);

  const { data: scheduledJobs = [], isLoading } = useQuery({
    queryKey: ['scheduled-jobs', selectedProjectId],
    queryFn: () => scheduledJobsApi.listByProject(selectedProjectId).then(r => r.data),
    enabled: !!selectedProjectId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      let payload = {};
      try { payload = JSON.parse(form.payload); } catch {}
      return scheduledJobsApi.create({ ...form, projectId: selectedProjectId, payload });
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['scheduled-jobs', selectedProjectId] }); 
      setShowCreate(false); 
      setForm({ name: '', cronExpression: '0 * * * *', queueId: queues[0]?.id || '', maxRetries: 3, payload: '{}' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => scheduledJobsApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-jobs', selectedProjectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduledJobsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-jobs', selectedProjectId] }),
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Scheduled Jobs</div>
          <div className={styles.pageSubtitle}>Manage recurring cron-based job schedules</div>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={!selectedProjectId}><Plus size={14} /> New Schedule</Button>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 440, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 15 }}>New Scheduled Job</div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. daily-report" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Cron Expression</label>
              <input className={styles.input} value={form.cronExpression} onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))} placeholder="0 * * * *" style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Target Queue</label>
              <select className={styles.input} value={form.queueId} onChange={e => setForm(f => ({ ...f, queueId: e.target.value }))}>
                {queues.map(q => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Payload (JSON)</label>
              <textarea className={styles.input} rows={3} value={form.payload} onChange={e => setForm(f => ({ ...f, payload: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.queueId}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {!selectedProjectId ? (
        <Empty text="Select a project in the header to view scheduled jobs." />
      ) : isLoading ? <Loading /> : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Scheduled Jobs ({scheduledJobs.length})</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Name</th><th>Cron</th><th>Status</th><th>Last Run</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {scheduledJobs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No scheduled jobs.</td></tr>
              ) : scheduledJobs.map((j: any) => (
                <tr key={j.id}>
                  <td style={{ fontWeight: 500 }}>{j.name}</td>
                  <td><Mono>{j.cronExpression}</Mono></td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 500, color: j.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                      {j.isActive ? '● Active' : '○ Paused'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {j.lastRunAt ? new Date(j.lastRunAt).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" onClick={() => toggleMutation.mutate(j.id)}>
                        {j.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </Button>
                      <Button variant="ghost" onClick={() => deleteMutation.mutate(j.id)}>
                        <Trash2 size={13} />
                      </Button>
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

export default ScheduledJobs;
