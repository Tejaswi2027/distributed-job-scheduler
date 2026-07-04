import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi, queuesApi } from '../api/client';
import { Loading, Empty, Badge, Mono, Button } from '../components/ui';
import styles from '../components/ui/ui.module.css';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const Jobs: React.FC = () => {
  const qc = useQueryClient();
  const { selectedProjectId } = useWorkspace();
  const [selectedQueue, setSelectedQueue] = useState('');
  const [queues, setQueues] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Enqueue job modal state
  const [showEnqueue, setShowEnqueue] = useState(false);
  const [enqueueForm, setEnqueueForm] = useState({
    priority: 1,
    payload: '{\n  "task": "Process Data",\n  "fail": false\n}',
    delaySeconds: 0,
  });

  // Load queues when project changes in the header
  useEffect(() => {
    if (selectedProjectId) {
      queuesApi.listByProject(selectedProjectId).then((res) => {
        setQueues(res.data);
        if (res.data.length > 0) {
          setSelectedQueue(res.data[0].id);
        } else {
          setSelectedQueue('');
        }
      });
    } else {
      setQueues([]);
      setSelectedQueue('');
    }
  }, [selectedProjectId]);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', selectedQueue],
    queryFn: () => jobsApi.listByQueue(selectedQueue, 50, 0).then(r => r.data),
    enabled: !!selectedQueue,
    refetchInterval: 3000,
  });

  const openJob = async (job: any) => {
    setSelectedJob(job);
    const res = await jobsApi.getLogs(job.id);
    setLogs(res.data);
  };

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(enqueueForm.payload);
    } catch (err) {
      alert("Invalid JSON payload format");
      return;
    }
    
    try {
      await jobsApi.enqueue({
        queueId: selectedQueue,
        priority: Number(enqueueForm.priority),
        payload: parsedPayload,
        delaySeconds: Number(enqueueForm.delaySeconds) || undefined
      });
      setShowEnqueue(false);
      setEnqueueForm({
        priority: 1,
        payload: '{\n  "task": "Process Data",\n  "fail": false\n}',
        delaySeconds: 0,
      });
      qc.invalidateQueries({ queryKey: ['jobs', selectedQueue] });
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to enqueue job");
    }
  };

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Jobs</div>
          <div className={styles.pageSubtitle}>Browse and inspect job execution records</div>
        </div>
        <Button onClick={() => setShowEnqueue(true)} disabled={!selectedQueue}>
          <Plus size={14} /> Enqueue Job
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select 
          className={styles.input} 
          style={{ width: 220 }} 
          value={selectedQueue} 
          onChange={e => setSelectedQueue(e.target.value)} 
          disabled={!queues.length}
        >
          <option value="">Select Queue</option>
          {queues.map((q: any) => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
      </div>

      {/* Enqueue job modal */}
      {showEnqueue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 440, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontWeight: 600, marginBottom: 18, fontSize: 15 }}>Enqueue New Job</div>
            <form onSubmit={handleEnqueue}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Priority (1–100)</label>
                <input className={styles.input} type="number" min={1} max={100} value={enqueueForm.priority} onChange={e => setEnqueueForm(f => ({ ...f, priority: +e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Delay (Seconds, optional)</label>
                <input className={styles.input} type="number" min={0} value={enqueueForm.delaySeconds} onChange={e => setEnqueueForm(f => ({ ...f, delaySeconds: +e.target.value }))} placeholder="0 for immediate execution" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Payload (JSON)</label>
                <textarea 
                  className={styles.input} 
                  rows={4} 
                  value={enqueueForm.payload} 
                  onChange={e => setEnqueueForm(f => ({ ...f, payload: e.target.value }))} 
                  style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }} 
                />
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Tip: Pass <code>{"\"fail\": true"}</code> in the JSON object to trigger task failure and retries!
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <Button variant="secondary" onClick={() => setShowEnqueue(false)} type="button">Cancel</Button>
                <Button type="submit">Enqueue</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job detail drawer - Full Featured */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 500, background: '#fff', height: '100%', overflowY: 'auto', padding: 28, borderLeft: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Job Details</div>
              <Button variant="ghost" onClick={() => setSelectedJob(null)} style={{ padding: 4 }}>✕</Button>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.label}>Job ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>{selectedJob.id}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div className={styles.label}>Status</div>
                <Badge status={selectedJob.status} />
              </div>
              <div>
                <div className={styles.label}>Priority</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedJob.priority}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div className={styles.label}>Retries</div>
                <div style={{ fontSize: 13 }}>{selectedJob.retryCount} / {selectedJob.maxRetries}</div>
              </div>
              <div>
                <div className={styles.label}>Run At</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(selectedJob.runAt).toLocaleString()}</div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label}>Payload</div>
              <pre style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-mono)', overflow: 'auto', border: '1px solid var(--border)', maxHeight: 200 }}>
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className={styles.tableTitle} style={{ marginBottom: 10, fontSize: 13, fontWeight: 600 }}>Execution History &amp; Logs</div>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>No executions recorded.</div>
              ) : (
                logs.map((l: any, idx: number) => (
                  <div key={l.id} style={{ marginBottom: 14, borderBottom: '1px solid var(--border-light)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Attempt #{logs.length - idx}</span>
                        <Badge status={l.status} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(l.startedAt).toLocaleTimeString()}</span>
                    </div>
                    {l.durationMs !== null && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                        Duration: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{l.durationMs}ms</span>
                      </div>
                    )}
                    {l.errorMessage && (
                      <div style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)', background: 'var(--danger-light)', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}>
                        {l.errorMessage}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!selectedQueue ? (
        <Empty text="Select a queue in the filter to browse its jobs." />
      ) : isLoading ? (
        <Loading />
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Jobs ({total})</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Job ID</th><th>Status</th><th>Priority</th><th>Retries</th><th>Run At</th><th>Created</th></tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No jobs found.</td></tr>
              ) : jobs.map((j: any) => (
                <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => openJob(j)}>
                  <td><Mono>{j.id.slice(0, 8)}…</Mono></td>
                  <td><Badge status={j.status} /></td>
                  <td>{j.priority}</td>
                  <td style={{ color: j.retryCount > 0 ? 'var(--warning)' : 'inherit' }}>{j.retryCount}/{j.maxRetries}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.runAt).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(j.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Jobs;
