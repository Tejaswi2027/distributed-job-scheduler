import React from 'react';
import { Bell, Settings } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavbarProps {
  title: string;
}

import { useWorkspace } from '../../context/WorkspaceContext';

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const email = localStorage.getItem('userEmail') || 'U';
  const initial = email.charAt(0).toUpperCase();
  const { orgs, projects, selectedOrgId, setSelectedOrgId, selectedProjectId, setSelectedProjectId } = useWorkspace();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <span className={styles.pageTitle}>{title}</span>
        
        <div className={styles.selectorContainer}>
          <select 
            className={styles.select} 
            value={selectedOrgId} 
            onChange={(e) => setSelectedOrgId(e.target.value)}
          >
            <option value="">Select Organization</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          
          <span className={styles.divider}>/</span>
          
          <select 
            className={styles.select} 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={projects.length === 0}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={15} />
        </button>
        <button className={styles.iconBtn} title="Settings">
          <Settings size={15} />
        </button>
        <div className={styles.avatar} title={email}>{initial}</div>
      </div>
    </header>
  );
};

export default Navbar;
