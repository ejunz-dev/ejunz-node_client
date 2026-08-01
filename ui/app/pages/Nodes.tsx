import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServerUrl, fetchNodes, authorizeNode, revokeNode, EdgeNode } from '../api';

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: 600, margin: 0 },
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
  nodeMeta: { fontSize: 12, color: '#8899aa', marginTop: 2 },
  badge: {
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginRight: 8,
  },
  actions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  btn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnAuthorize: { background: 'rgba(46,213,115,0.2)', color: '#2ed573' },
  btnRevoke: { background: 'rgba(255,71,87,0.2)', color: '#ff4757' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  placeholder: { textAlign: 'center' as const, color: '#8899aa', padding: '32px 0', fontSize: 14 },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: '#8899aa',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
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

export default function Nodes() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const serverUrl = getServerUrl();

  useEffect(() => {
    if (!serverUrl) navigate('/');
  }, [serverUrl, navigate]);

  const load = useCallback(async () => {
    try {
      const data = await fetchNodes();
      setNodes(data.nodes || []);
    } catch {
      setNodes([]);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAuthorize = async (nodeId: string) => {
    setLoading((prev) => new Set(prev).add(nodeId));
    try {
      await authorizeNode(nodeId);
      await load();
    } catch (err: any) {
      console.error('授权失败', err);
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  };

  const handleRevoke = async (nodeId: string) => {
    setLoading((prev) => new Set(prev).add(nodeId));
    try {
      await revokeNode(nodeId);
      await load();
    } catch (err: any) {
      console.error('撤销失败', err);
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  };

  return (
    <div>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>节点管理</h2>
        <button style={styles.refreshBtn} onClick={load}>↻ 刷新</button>
      </div>

      <div style={styles.nodeList}>
        {nodes.length === 0 ? (
          <div style={styles.placeholder}>暂无节点</div>
        ) : (
          nodes.map((node) => {
            const busy = loading.has(node.nodeId);
            return (
              <div key={node.nodeId} style={styles.nodeCard}>
                <div style={styles.nodeLeft}>
                  <span style={styles.nodeName}>{node.nodeId}</span>
                  <span style={styles.nodeMeta}>
                    {node.host}:{node.port}
                    {node.tools?.length ? ` · ${node.tools.length} 个工具` : ''}
                    {node.lastSeen ? ` · ${new Date(node.lastSeen).toLocaleString()}` : ''}
                  </span>
                </div>
                <div style={styles.actions}>
                  <span
                    style={{
                      ...styles.badge,
                      background: (statusColors[node.status] || '#8899aa') + '22',
                      color: statusColors[node.status] || '#8899aa',
                    }}
                  >
                    {statusLabels[node.status] || node.status}
                  </span>
                  {node.status === 'pending' && (
                    <button
                      style={{ ...styles.btn, ...styles.btnAuthorize, ...(busy ? styles.btnDisabled : {}) }}
                      disabled={busy}
                      onClick={() => handleAuthorize(node.nodeId)}
                    >
                      {busy ? '…' : '授权'}
                    </button>
                  )}
                  {(node.status === 'online' || node.status === 'offline') && (
                    <button
                      style={{ ...styles.btn, ...styles.btnRevoke, ...(busy ? styles.btnDisabled : {}) }}
                      disabled={busy}
                      onClick={() => handleRevoke(node.nodeId)}
                    >
                      {busy ? '…' : '撤销'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
