import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workersApi } from '../api/client';
import { Loading, Empty, Badge, Mono, StatCard } from '../components/ui';
import styles from '../components/ui/ui.module.css';
const Workers: React.FC = () => {
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => workersApi.list().then(r => r.data),
    refetchInterval: 5000,
  });

  const active = workers.filter((w: any) => w.status === 'ACTIVE').length;
  const dead = workers.filter((w: any) => w.status === 'DEAD' || w.status === 'DEREGISTERED').length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageHeading}>Workers</div>
          <div className={styles.pageSubtitle}>Live worker pool status and health</div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Active Workers" value={active} />
        <StatCard label="Inactive / Dead" value={dead} />
        <StatCard label="Total" value={workers.length} />
      </div>

      {isLoading ? <Loading /> : workers.length === 0 ? (
        <Empty text="No workers registered yet. Start the backend to register a worker." />
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <span className={styles.tableTitle}>Worker Pool</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Worker ID</th><th>Name</th><th>Host</th><th>Status</th><th>Concurrency</th><th>Last Heartbeat</th><th>Started</th></tr>
            </thead>
            <tbody>
              {workers.map((w: any) => (
                <tr key={w.id}>
                  <td><Mono>{w.id.slice(0, 8)}…</Mono></td>
                  <td style={{ fontWeight: 500 }}>{w.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{w.hostname}</td>
                  <td><Badge status={w.status} /></td>
                  <td>{w.concurrencyLimit}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(w.lastHeartbeatAt).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(w.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Workers;
