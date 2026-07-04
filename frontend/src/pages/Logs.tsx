import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/client';
import { Loading, Empty, Badge, Mono } from '../components/ui';
import styles from '../components/ui/ui.module.css';

const Logs: React.FC = () => {
  const { data: logs = [], isLoading, error, isError } = useQuery({
    queryKey: ['global-execution-logs'],
    queryFn: () => statsApi.logs().then(r => r.data),
    refetchInterval: 3000,
  });

  if (isError) {
    return (
      <div>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pageHeading}>Logs</div>
            <div className={styles.pageSubtitle}>Real-time system-wide job execution logs</div>
          </div>
        </div>
        <div style={{ color: 'var(--danger)', padding: 18, background: 'var(--danger-light)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13.5 }}>
          Failed to fetch logs: {(error as any).response?.data?.message ?? error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Logs</div>
          <div className={styles.pageSubtitle}>Real-time system-wide job execution logs</div>
        </div>
      </div>

      {isLoading ? (
        <Loading text="Loading log feed..." />
      ) : logs.length === 0 ? (
        <Empty text="No execution logs found. Try enqueuing a job." />
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Recent Log Logs</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Queue</th>
                <th>Job ID</th>
                <th>Worker</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <Badge status={log.level} />
                  </td>
                  <td><span style={{ fontWeight: 500 }}>{log.queue}</span></td>
                  <td><Mono>{log.jobId.slice(0, 8)}…</Mono></td>
                  <td><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{log.worker}</span></td>
                  <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                    {log.message}
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

export default Logs;
