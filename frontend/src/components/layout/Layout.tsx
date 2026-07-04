import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import styles from './Layout.module.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/queues': 'Queues',
  '/jobs': 'Jobs',
  '/workers': 'Workers',
  '/scheduled': 'Scheduled Jobs',
  '/dlq': 'Dead Letter Queue',
  '/logs': 'Logs',
  '/settings': 'Settings',
};

const Layout: React.FC = () => {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'Dashboard';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar title={title} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
