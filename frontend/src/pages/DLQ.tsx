import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dlqApi } from '../api/client';
import { Loading, Empty, Badge, Mono, Button, StatCard } from '../components/ui';
import styles from '../components/ui/ui.module.css';
import { RefreshCw } from 'lucide-react';

const DLQ: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dlq'],
    queryFn: () => dlqApi.list(50, 0).then(r => r.data),
    refetchInterval: 10000,
  });

  const requeueMutation = useMutation({
    mutationFn: (id: string) => dlqApi.requeue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dlq'] }),
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Dead Letter Queue</div>
          <div className={styles.pageSubtitle}>Jobs that have exhausted all retry attempts</div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Total DLQ Entries" value={total} />
      </div>

      {isLoading ? <Loading /> : entries.length === 0 ? (
        <Empty text="No dead-letter entries. All jobs are healthy." />
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Failed Jobs ({total})</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>DLQ ID</th><th>Job ID</th><th>Failure Reason</th><th>Failed At</th><th>Action</th></tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id}>
                  <td><Mono>{e.id.slice(0, 8)}…</Mono></td>
                  <td><Mono>{e.jobId.slice(0, 8)}…</Mono></td>
                  <td style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.reason}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(e.failedAt).toLocaleString()}</td>
                  <td>
                    <Button
                      variant="secondary"
                      onClick={() => requeueMutation.mutate(e.id)}
                      disabled={requeueMutation.isPending}
                    >
                      <RefreshCw size={12} /> Requeue
                    </Button>
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

export default DLQ;
