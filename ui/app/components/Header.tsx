import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearCredentials, getServerUrl } from '../api';

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#16213e',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#8899aa',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'background 0.2s, color 0.2s',
  },
  tabActive: {
    background: 'rgba(0,210,255,0.15)',
    color: '#00d2ff',
  },
  disconnectBtn: {
    background: 'none',
    border: '1px solid rgba(255,71,87,0.3)',
    color: '#ff4757',
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    transition: 'background 0.2s',
  },
};

const links = [
  { path: '/', label: '连接' },
  { path: '/dashboard', label: '概览' },
  { path: '/nodes', label: '节点' },
  { path: '/devices', label: '设备' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const connected = !!getServerUrl();

  const isActive = (path: string) => location.pathname === path;

  const handleDisconnect = () => {
    clearCredentials();
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        <span>Ejunz Edge</span>
      </div>
      <div style={styles.tabs}>
        {links.map((link) => (
          <button
            key={link.path}
            style={{ ...styles.tab, ...(isActive(link.path) ? styles.tabActive : {}) }}
            onClick={() => (link.path === '/' ? navigate('/') : connected ? navigate(link.path) : undefined)}
          >
            {link.label}
          </button>
        ))}
      </div>
      {connected && (
        <button style={styles.disconnectBtn} onClick={handleDisconnect}>
          断开
        </button>
      )}
    </header>
  );
}
