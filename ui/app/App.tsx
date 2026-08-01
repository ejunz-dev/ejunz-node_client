import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Connect from './pages/Connect';
import Dashboard from './pages/Dashboard';
import Nodes from './pages/Nodes';
import Devices from './pages/Devices';

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#1a1a2e',
    color: '#e0e0e0',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
};

export default function App() {
  return (
    <HashRouter>
      <div style={styles.shell}>
        <Header />
        <div style={styles.main}>
          <Routes>
            <Route path="/" element={<Connect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nodes" element={<Nodes />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
