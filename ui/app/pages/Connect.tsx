import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  api,
  setCredentials,
  saveCredentials,
  loadCredentials,
  getSavedUsername,
  getSavedPassword,
  EdgeStatus,
} from '../api';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 120px)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#16213e',
    borderRadius: 12,
    padding: '32px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', marginBottom: 8 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#8899aa', fontSize: 14, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#8899aa',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    background: '#1a1a2e',
    color: '#e0e0e0',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #00d2ff, #0099cc)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  error: { color: '#ff4757', fontSize: 13, marginTop: 12, textAlign: 'center' },
};

export default function Connect() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loadCredentials()) {
      setUrl(getSavedPassword() ? '***' : '');
      setUser(getSavedUsername());
      setPass(getSavedPassword());
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const serverUrl = url.trim();
    if (!serverUrl) {
      setError('请输入服务器地址');
      return;
    }

    setLoading(true);
    setCredentials(serverUrl, user.trim(), pass);

    try {
      await api<EdgeStatus>('/api/edge/status');
      saveCredentials();
      navigate('/dashboard');
    } catch (err: any) {
      setError('连接失败: ' + (err.message || '未知错误'));
      setCredentials('', '', '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <div style={styles.title}>Ejunz Edge</div>
        <div style={styles.subtitle}>连接 Edge 服务器管理远程节点</div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>服务器地址</label>
            <input
              style={styles.input}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.1.100:5283"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>用户名</label>
            <input
              style={styles.input}
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>密码</label>
            <input
              style={styles.input}
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? '连接中…' : '连接'}
          </button>
          {error && <div style={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
