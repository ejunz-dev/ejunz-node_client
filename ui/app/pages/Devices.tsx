import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServerUrl, getSavedUsername, getSavedPassword, fetchNodes, fetchNodeDevices, controlDevice, EdgeNode, Device } from '../api';

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
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    background: '#1a1a2e',
    color: '#e0e0e0',
    fontSize: 15,
    outline: 'none',
    marginBottom: 20,
    boxSizing: 'border-box' as const,
  },
  deviceList: { display: 'flex', flexDirection: 'column', gap: 8 },
  deviceCard: {
    background: '#16213e',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceLeft: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  deviceName: { fontSize: 15, fontWeight: 600 },
  deviceMeta: { fontSize: 12, color: '#8899aa', display: 'flex', gap: 8, marginTop: 2 },
  metaTag: { background: 'rgba(255,255,255,0.06)', padding: '1px 8px', borderRadius: 4 },
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

/* Toggle switch */
function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: () => void }) {
  const trackStyle: React.CSSProperties = {
    width: 48,
    height: 28,
    borderRadius: 28,
    background: checked ? '#00d2ff' : '#444',
    position: 'relative',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.25s',
    opacity: disabled ? 0.4 : 1,
    flexShrink: 0,
    marginLeft: 12,
  };
  const thumbStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 3,
    left: checked ? 23 : 3,
    transition: 'left 0.25s',
  };
  return (
    <div style={trackStyle} onClick={disabled ? undefined : onChange}>
      <div style={thumbStyle} />
    </div>
  );
}

export default function Devices() {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const serverUrl = getServerUrl();

  useEffect(() => {
    if (!serverUrl) navigate('/');
  }, [serverUrl, navigate]);

  // Load node list
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchNodes();
        const onlineNodes = (data.nodes || []).filter((n) => n.status === 'online');
        setNodes(onlineNodes);
        if (onlineNodes.length > 0 && !selectedNode) {
          setSelectedNode(onlineNodes[0].nodeId);
        }
      } catch {
        setNodes([]);
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [selectedNode]);

  // Load devices for selected node (initial load via HTTP)
  const loadDevices = useCallback(async () => {
    if (!selectedNode) return;
    setLoading(true);
    try {
      const data = await fetchNodeDevices(selectedNode);
      setDevices(data.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedNode]);

  // SSE for real-time device state updates (via fetch streaming)
  useEffect(() => {
    if (!selectedNode || !serverUrl) return;

    // Initial load
    loadDevices();

    const sseUrl = serverUrl + '/api/edge/ws?token=' + encodeURIComponent(getSavedPassword());
    let controller: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    async function connect() {
      controller = new AbortController();
      setWsStatus('connecting');
      try {
        const res = await fetch(sseUrl, {
          headers: { Authorization: 'Basic ' + btoa(getSavedUsername() + ':' + getSavedPassword()) },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error('SSE connection failed');
        setWsStatus('connected');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const msg = JSON.parse(line.slice(6));
              if (msg.type === 'device_state') {
                const parts = msg.topic?.split('/') || [];
                const topicNodeId = parts[1];
                const deviceId = parts[3];
                if (topicNodeId !== selectedNode || !deviceId) continue;
                let payload = msg.payload;
                if (typeof payload === 'string') {
                  try { payload = JSON.parse(payload); } catch {}
                }
                const newState = payload?.state === 'ON' ? 'ON' : payload?.state === 'OFF' ? 'OFF' : undefined;
                if (newState) {
                  setDevices((prev) =>
                    prev.map((d) =>
                      d.deviceId === deviceId ? { ...d, currentState: newState } : d
                    )
                  );
                }
              }
            } catch {}
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('SSE error', err);
      }
      setWsStatus('disconnected');
      controller = null;
      reconnectTimer = setTimeout(connect, 5000);
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      controller?.abort();
    };
  }, [selectedNode, serverUrl, loadDevices]);

  const handleToggle = async (device: Device) => {
    if (!selectedNode || !device.deviceId || toggling.has(device.deviceId)) return;

    setToggling((prev) => new Set(prev).add(device.deviceId));
    const newState = device.currentState === 'ON' ? 'OFF' : 'ON';
    try {
      await controlDevice(selectedNode, device.deviceId, newState);
      device.currentState = newState;
      setDevices([...devices]);
    } catch (err: any) {
      console.error('控制失败', err);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(device.deviceId);
        return next;
      });
    }
  };

  return (
    <div>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>设备控制</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: wsStatus === 'connected' ? '#2ed573' : wsStatus === 'connecting' ? '#ffa502' : '#ff4757' }}>
            ● {wsStatus === 'connected' ? '实时' : wsStatus === 'connecting' ? '连接中' : '未连接'}
          </span>
          <button style={styles.refreshBtn} onClick={loadDevices}>↻ 刷新</button>
        </div>
      </div>

      <select
        style={styles.select}
        value={selectedNode}
        onChange={(e) => setSelectedNode(e.target.value)}
      >
        {nodes.length === 0 && <option value="">无在线节点</option>}
        {nodes.map((n) => (
          <option key={n.nodeId} value={n.nodeId}>
            {n.nodeId} ({n.host}:{n.port})
          </option>
        ))}
      </select>

      <div style={styles.deviceList}>
        {!selectedNode ? (
          <div style={styles.placeholder}>请选择一个节点</div>
        ) : loading ? (
          <div style={styles.placeholder}>加载中…</div>
        ) : devices.length === 0 ? (
          <div style={styles.placeholder}>该节点暂无设备</div>
        ) : (
          devices.map((d) => {
            const isOn = d.currentState === 'ON';
            return (
              <div key={d.deviceId} style={styles.deviceCard}>
                <div style={styles.deviceLeft}>
                  <span style={styles.deviceName}>{d.friendlyName}</span>
                  <span style={styles.deviceMeta}>
                    <span style={styles.metaTag}>{d.deviceId.slice(0, 16)}</span>
                    {d.model && <span style={styles.metaTag}>{d.model}</span>}
                    {d.type && <span style={styles.metaTag}>{d.type}</span>}
                  </span>
                </div>
                {d.supportsOnOff !== false && (
                  <Toggle
                    checked={isOn}
                    disabled={toggling.has(d.deviceId)}
                    onChange={() => handleToggle(d)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
