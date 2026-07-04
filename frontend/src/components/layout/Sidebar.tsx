import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, List, GitBranch, Briefcase, Cpu,
  Clock, AlertTriangle, ScrollText, Settings, Zap
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/queues', label: 'Queues', icon: List },
  { to: '/jobs', label: 'Jobs', icon: GitBranch },
  { to: '/workers', label: 'Workers', icon: Cpu },
  { to: '/scheduled', label: 'Scheduled Jobs', icon: Clock },
  { to: '/dlq', label: 'Dead Letter Queue', icon: AlertTriangle },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC = () => (
  <aside className={styles.sidebar}>
    <div className={styles.logo}>
      <div className={styles.logoIcon}>
        <Zap size={14} />
      </div>
      <span className={styles.logoText}>JobScheduler</span>
    </div>
    <nav className={styles.nav}>
      <div className={styles.navSection}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `${styles.navItem}${isActive ? ' ' + styles.active : ''}`}
          >
            <item.icon size={15} className={styles.navItemIcon} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  </aside>
);

export default Sidebar;
