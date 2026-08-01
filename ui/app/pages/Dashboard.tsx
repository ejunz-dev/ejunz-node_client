import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServerUrl, fetchStatus, fetchNodes, EdgeStatus, EdgeNode } from '../api';

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  serverLabel: { fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
  statCard: {
    background: '#16213e',
    borderRadius: 12,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, color: '#8899aa' },
  statValue: { fontSize: 22, fontWeight: 700 },
  sectionTitle: { fontSize: 18, fontWeight: 600, margin: '0 0 12px 0' },
  nodeList: { display: 'flex', flexDirection: 'column', gap: 8 },
  nodeCard: {
    background: '#16213e',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeLeft: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  nodeName: { fontSize: 15, fontWeight: 600 },
  nodeMeta: { fontSize: 12, color: '#8899aa' },
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  placeholder: { textAlign: 'center' as const, color: '#8899aa', padding: '32px 0', fontSize: 14 },
  endpointBox: {
    background: '#0f3460',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#00d2ff',
    marginBottom: 20,
  },
};

const statusColors: Record<string, string> = {
  online: '#2ed573',
  offline: '#ff4757',
  pending: '#ffa502',
  revoked: '#8899aa',
};

const statusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  pending: '待授权',
  revoked: '已撤销',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<EdgeStatus | null>(null);
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const serverUrl = getServerUrl();

  useEffect(() => {
    if (!serverUrl) navigate('/');
  }, [serverUrl, navigate]);

  const load = useCallback(async () => {
    try {
      const [s, n] = await Promise.all([fetchStatus(), fetchNodes()]);
      setStatus(s);
      setNodes(n.nodes || []);
    } catch {
      setStatus(null);
      setNodes([]);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const onlineCount = nodes.filter((n) => n.status === 'online').length;
  const pendingCount = nodes.filter((n) => n.status === 'pending').length;

  return (
    <div>
      <div style={styles.headerRow}>
        <div style={styles.serverLabel}>
          <span style={{ ...styles.statusDot, background: status ? '#2ed573' : '#ff4757' }} />
          {serverUrl?.replace(/^https?:\/\//, '') || '未连接'}
        </div>
      </div>

      {status?.nodeEndpoint && (
        <div style={styles.endpointBox}>
          节点 WebSocket: {status.nodeEndpoint}
        </div>
      )}

      <div style={styles.grid}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>节点总数</span>
          <span style={styles.statValue}>{status?.nodes ?? '—'}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>在线</span>
          <span style={{ ...styles.statValue, color: '#2ed573' }}>{onlineCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>待授权</span>
          <span style={{ ...styles.statValue, color: '#ffa502' }}>{pendingCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>MQTT 代理</span>
          <span style={{ ...styles.statValue, color: status?.broker ? '#2ed573' : '#8899aa', fontSize: 18 }}>
            {status?.broker ? '运行中' : '未启用'}
          </span>
        </div>
      </div>

      {status?.upstream && (
        <div style={{ ...styles.statCard, marginBottom: 20 }}>
          <span style={styles.statLabel}>上游连接</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ ...styles.statusDot, background: status.upstream.connected ? '#2ed573' : '#ff4757' }} />
            <span style={{ fontSize: 14 }}>
              {status.upstream.connected ? '已连接' : '未连接'}
              {status.upstream.endpoint ? ` (${status.upstream.endpoint})` : ''}
            </span>
          </div>
        </div>
      )}

      <h2 style={styles.sectionTitle}>节点列表</h2>
      <div style={styles.nodeList}>
        {nodes.length === 0 ? (
          <div style={styles.placeholder}>暂无节点</div>
        ) : (
          nodes.map((node) => (
            <div key={node.nodeId} style={styles.nodeCard}>
              <div style={styles.nodeLeft}>
                <span style={styles.nodeName}>{node.nodeId}</span>
                <span style={styles.nodeMeta}>
                  {node.host}:{node.port} · {node.tools?.length || 0} 个工具
                </span>
              </div>
              <span
                style={{
                  ...styles.badge,
                  background: (statusColors[node.status] || '#8899aa') + '22',
                  color: statusColors[node.status] || '#8899aa',
                }}
              >
                {statusLabels[node.status] || node.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
