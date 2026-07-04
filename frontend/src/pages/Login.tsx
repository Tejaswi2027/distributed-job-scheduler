import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fn = tab === 'login' ? authApi.login : authApi.register;
      const res = await fn(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userEmail', email);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: 380, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 36, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, background: '#2563EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>⚡</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>JobScheduler</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 24, gap: 0 }}>
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', background: 'none',
                fontWeight: tab === t ? 600 : 400, fontSize: 13,
                color: tab === t ? '#111827' : '#6B7280',
                borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.12s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
              Email address
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder={tab === 'register' ? 'Min 8 chars, 1 uppercase, 1 number, 1 special' : '••••••••'}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 13.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '9px 13px', fontSize: 12.5, color: '#DC2626', marginBottom: 14 }}>
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '10px', background: '#2563EB', color: '#fff', border: 'none',
              borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
