import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgsApi } from '../api/client';

interface WorkspaceContextType {
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  orgs: any[];
  projects: any[];
  isLoadingOrgs: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedOrgId, setSelectedOrgId] = useState(() => localStorage.getItem('selectedOrgId') || '');
  const [selectedProjectId, setSelectedProjectId] = useState(() => localStorage.getItem('selectedProjectId') || '');
  const [projects, setProjects] = useState<any[]>([]);

  const { data: orgs = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: () => orgsApi.list().then(r => r.data),
    staleTime: 30000,
  });

  // Sync selected organization
  useEffect(() => {
    if (orgs.length > 0) {
      const savedOrgId = localStorage.getItem('selectedOrgId');
      const matchedOrg = orgs.find((o: any) => o.id === savedOrgId);
      const activeOrgId = matchedOrg ? matchedOrg.id : orgs[0].id;
      
      setSelectedOrgId(activeOrgId);
      localStorage.setItem('selectedOrgId', activeOrgId);
    }
  }, [orgs]);

  // Load projects whenever selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId) {
      orgsApi.listProjects(selectedOrgId).then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) {
          const savedProjId = localStorage.getItem('selectedProjectId');
          const matchedProj = res.data.find((p: any) => p.id === savedProjId);
          const activeProjId = matchedProj ? matchedProj.id : res.data[0].id;
          
          setSelectedProjectId(activeProjId);
          localStorage.setItem('selectedProjectId', activeProjId);
        } else {
          setSelectedProjectId('');
          localStorage.removeItem('selectedProjectId');
        }
      });
    } else {
      setProjects([]);
      setSelectedProjectId('');
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedOrgId]);

  const handleSetOrgId = (id: string) => {
    setSelectedOrgId(id);
    localStorage.setItem('selectedOrgId', id);
  };

  const handleSetProjectId = (id: string) => {
    setSelectedProjectId(id);
    if (id) {
      localStorage.setItem('selectedProjectId', id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      selectedOrgId,
      setSelectedOrgId: handleSetOrgId,
      selectedProjectId,
      setSelectedProjectId: handleSetProjectId,
      orgs,
      projects,
      isLoadingOrgs,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
};
