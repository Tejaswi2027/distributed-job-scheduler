import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgsApi } from '../api/client';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [orgName, setOrgName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await orgsApi.create(orgName);
      setOrgId(res.data.id);
      localStorage.setItem('selectedOrgId', res.data.id);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create organization.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !orgId) return;

    setLoading(true);
    setError('');
    try {
      const res = await orgsApi.createProject(orgId, projectName);
      localStorage.setItem('selectedProjectId', res.data.id);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: 440, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 36, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, background: '#2563EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>⚡</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>JobScheduler Setup</span>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#2563EB', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600
            }}>1</span>
            <span style={{ fontSize: 13, fontWeight: step === 1 ? 600 : 400, color: step === 1 ? '#111827' : '#6B7280' }}>
              Create Organization
            </span>
          </div>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB', margin: '0 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: step === 2 ? '#2563EB' : '#F3F4F6',
              color: step === 2 ? '#fff' : '#6B7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600
            }}>2</span>
            <span style={{ fontSize: 13, fontWeight: step === 2 ? 600 : 400, color: step === 2 ? '#111827' : '#6B7280' }}>
              First Project
            </span>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleCreateOrg}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                Organization Name
              </label>
              <input
                type="text" required value={orgName} onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp or Personal"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
                Organizations are shared spaces where teams manage their queues and projects.
              </p>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '9px 13px', fontSize: 12.5, color: '#DC2626', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !orgName.trim()}
              style={{
                width: '100%', padding: '10px', background: '#2563EB', color: '#fff', border: 'none',
                borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: (loading || !orgName.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !orgName.trim()) ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateProject}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                Project Name
              </label>
              <input
                type="text" required value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Production, Staging, or My App"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
                Projects organize your scheduled jobs, queues, and worker connections.
              </p>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '9px 13px', fontSize: 12.5, color: '#DC2626', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !projectName.trim()}
              style={{
                width: '100%', padding: '10px', background: '#2563EB', color: '#fff', border: 'none',
                borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: (loading || !projectName.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !projectName.trim()) ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? 'Creating...' : 'Finish Setup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
