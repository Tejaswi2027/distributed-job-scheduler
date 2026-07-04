import React from 'react';
import styles from './ui.module.css';

// Status Badge
type StatusType = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DLQ' | 'ACTIVE' | 'DEREGISTERED' | 'DEAD' | 'paused' | string;

const statusMap: Record<string, { label: string; cls: string }> = {
  QUEUED:        { label: 'Queued',        cls: 'queued' },
  CLAIMED:       { label: 'Claimed',       cls: 'running' },
  RUNNING:       { label: 'Running',       cls: 'running' },
  COMPLETED:     { label: 'Completed',     cls: 'completed' },
  FAILED:        { label: 'Failed',        cls: 'failed' },
  DLQ:           { label: 'DLQ',           cls: 'dlq' },
  ACTIVE:        { label: 'Active',        cls: 'active' },
  DEREGISTERED:  { label: 'Deregistered',  cls: 'dead' },
  DEAD:          { label: 'Dead',          cls: 'dead' },
  paused:        { label: 'Paused',        cls: 'paused' },
};

export const Badge: React.FC<{ status: StatusType }> = ({ status }) => {
  const s = statusMap[status] ?? { label: status, cls: 'queued' };
  return (
    <span className={`${styles.badge} ${styles[s.cls]}`}>
      <span className={styles.dot} />
      {s.label}
    </span>
  );
};

// Stat Card
interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub }) => (
  <div className={styles.statCard}>
    <div className={styles.statLabel}>{label}</div>
    <div className={styles.statValue}>{value}</div>
    {sub && <div className={styles.statChange}>{sub}</div>}
  </div>
);

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', children, className, ...props
}) => {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    danger: styles.btnDanger,
    ghost: styles.btnGhost,
  }[variant];

  return (
    <button className={`${styles.btn} ${variantClass} ${className ?? ''}`} {...props}>
      {children}
    </button>
  );
};

// Loading
export const Loading: React.FC<{ text?: string }> = ({ text = 'Loading…' }) => (
  <div className={styles.loadingRow}>
    <div className={styles.spinner} />
    {text}
  </div>
);

// Empty State
export const Empty: React.FC<{ text?: string }> = ({ text = 'No data found.' }) => (
  <div className={styles.empty}>
    <div className={styles.emptyText}>{text}</div>
  </div>
);

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div className={styles.formGroup}>
    {label && <label className={styles.label} htmlFor={id}>{label}</label>}
    <input className={styles.input} id={id} {...props} />
  </div>
);

// Table
interface TableProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps & { columns: string[]; rows: React.ReactNode }> = ({
  title, action, columns, rows,
}) => (
  <div className={styles.tableWrapper}>
    {(title || action) && (
      <div className={styles.tableHeader}>
        {title && <span className={styles.tableTitle}>{title}</span>}
        {action}
      </div>
    )}
    <table className={styles.table}>
      <thead>
        <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
);

// Card
export const Card: React.FC<{ title?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title, action, children,
}) => (
  <div className={styles.card}>
    {(title || action) && (
      <div className={styles.cardHeader}>
        {title && <span className={styles.cardTitle}>{title}</span>}
        {action}
      </div>
    )}
    <div className={styles.cardBody}>{children}</div>
  </div>
);

// Mono text
export const Mono: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className={styles.mono}>{children}</span>
);
