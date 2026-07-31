import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NodeApi } from './src/api/nodeApi';
import { clearCredentials, loadCredentials, saveCredentials } from './src/storage';
import type { NodeCredentials, NodeDevice, ZigbeeStatus } from './src/types';

const COLORS = {
  background: '#0b1220',
  panel: '#121d2e',
  panelMuted: '#17253a',
  border: '#263753',
  text: '#f4f7fb',
  muted: '#92a4bd',
  primary: '#58a6ff',
  success: '#36d399',
  warning: '#fbbf24',
  danger: '#fb7185',
};

function devicePowerState(device: NodeDevice): 'ON' | 'OFF' | null {
  const state = device.currentState || device.state?.state || device.state?.state_l1;
  return state === 'ON' || state === 'OFF' ? state : null;
}

function deviceSubtitle(device: NodeDevice): string {
  return [device.vendor, device.model, device.online === false ? '离线' : '在线']
    .filter(Boolean)
    .join(' · ');
}

function ConnectionForm({
  initial,
  busy,
  error,
  onSubmit,
}: {
  initial?: NodeCredentials | null;
  busy: boolean;
  error: string;
  onSubmit: (credentials: NodeCredentials) => void;
}) {
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl || 'http://192.168.1.100:5284');
  const [username, setUsername] = useState(initial?.username || 'admin');
  const [password, setPassword] = useState(initial?.password || '');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.connectContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>E</Text>
        </View>
        <Text style={styles.title}>连接 Ejunz Node</Text>
        <Text style={styles.subtitle}>
          输入节点地址并登录，开始管理 Zigbee2MQTT 设备。
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>节点地址</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.100:5284"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={baseUrl}
            onChangeText={setBaseUrl}
          />

          <Text style={styles.label}>用户名</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="admin"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="节点访问密码"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={busy || !baseUrl.trim() || !username.trim() || !password}
            onPress={() => onSubmit({ baseUrl, username, password })}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || !baseUrl.trim() || !username.trim() || !password) && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            {busy ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.primaryButtonText}>连接节点</Text>}
          </Pressable>
        </View>

        <Text style={styles.helpText}>
          建议先在局域网内使用。公网访问时请为 ejunz-node 配置 HTTPS 和安全认证。
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: connected ? '#123f35' : '#43202a' }]}>
      <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
      <Text style={[styles.statusPillText, { color: connected ? COLORS.success : COLORS.danger }]}>
        {connected ? '已连接' : '未连接'}
      </Text>
    </View>
  );
}

function DeviceCard({
  device,
  busy,
  onToggle,
}: {
  device: NodeDevice;
  busy: boolean;
  onToggle: (device: NodeDevice, state: 'ON' | 'OFF') => void;
}) {
  const power = devicePowerState(device);
  const canControl = device.supportsOnOff !== false;

  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIcon}>
          <Text style={styles.deviceIconText}>{power === 'ON' ? '●' : '○'}</Text>
        </View>
        <View style={styles.deviceInfo}>
          <Text numberOfLines={1} style={styles.deviceName}>{device.friendlyName || device.deviceId}</Text>
          <Text numberOfLines={1} style={styles.deviceSubtitle}>{deviceSubtitle(device)}</Text>
        </View>
        <View style={[styles.onlineBadge, device.online === false && styles.offlineBadge]}>
          <Text style={[styles.onlineText, device.online === false && styles.offlineText]}>
            {device.online === false ? '离线' : '在线'}
          </Text>
        </View>
      </View>

      <View style={styles.deviceFooter}>
        <Text style={styles.stateText}>{power ? `电源 ${power === 'ON' ? '开启' : '关闭'}` : '状态未知'}</Text>
        {canControl ? (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>开关</Text>
            <Switch
              disabled={busy || device.online === false}
              onValueChange={(value) => onToggle(device, value ? 'ON' : 'OFF')}
              trackColor={{ false: '#31415c', true: '#2374b9' }}
              thumbColor={power === 'ON' ? COLORS.primary : '#d7e2f0'}
              value={power === 'ON'}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function App() {
  const [credentials, setCredentials] = useState<NodeCredentials | null>(null);
  const [api, setApi] = useState<NodeApi | null>(null);
  const [status, setStatus] = useState<ZigbeeStatus | null>(null);
  const [devices, setDevices] = useState<NodeDevice[]>([]);
  const [starting, setStarting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deviceBusy, setDeviceBusy] = useState<string | null>(null);

  const onlineCount = useMemo(
    () => devices.filter((device) => device.online !== false).length,
    [devices],
  );

  async function loadDashboard(client: NodeApi) {
    const [nextStatus, nextDevices] = await Promise.all([
      client.getStatus(),
      client.listDevices(),
    ]);
    setStatus(nextStatus);
    setDevices(nextDevices.devices || []);
  }

  async function connect(nextCredentials: NodeCredentials) {
    setBusy(true);
    setError('');
    try {
      const client = new NodeApi(nextCredentials);
      await client.testConnection();
      await loadDashboard(client);
      await saveCredentials(nextCredentials);
      setCredentials(nextCredentials);
      setApi(client);
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法连接到节点');
    } finally {
      setBusy(false);
      setStarting(false);
    }
  }

  async function refresh() {
    if (!api) return;
    setRefreshing(true);
    setError('');
    try {
      await loadDashboard(api);
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新失败');
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleDevice(device: NodeDevice, state: 'ON' | 'OFF') {
    if (!api) return;
    setDeviceBusy(device.deviceId);
    setError('');
    try {
      await api.setDeviceState(device.deviceId, state);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '设备控制失败');
      Alert.alert('控制失败', e instanceof Error ? e.message : '设备没有响应');
    } finally {
      setDeviceBusy(null);
    }
  }

  async function disconnect() {
    await clearCredentials();
    setCredentials(null);
    setApi(null);
    setStatus(null);
    setDevices([]);
    setError('');
  }

  useEffect(() => {
    let mounted = true;
    loadCredentials().then((saved) => {
      if (!mounted) return;
      if (saved) void connect(saved);
      else setStarting(false);
    }).catch(() => {
      if (mounted) setStarting(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (starting) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>正在恢复节点连接…</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!credentials || !api) {
    return (
      <>
        <ConnectionForm busy={busy} error={error} onSubmit={connect} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.dashboardContent}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={refreshing} tintColor={COLORS.primary} />}
      >
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.eyebrow}>EJUNZ NODE</Text>
            <Text style={styles.dashboardTitle}>家庭控制中心</Text>
            <Text numberOfLines={1} style={styles.nodeUrl}>{api.baseUrl}</Text>
          </View>
          <StatusPill connected={!!status?.connected} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{devices.length}</Text>
            <Text style={styles.summaryLabel}>设备总数</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{onlineCount}</Text>
            <Text style={styles.summaryLabel}>在线设备</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: status?.connected ? COLORS.success : COLORS.danger }]}>●</Text>
            <Text style={styles.summaryLabel}>Zigbee</Text>
          </View>
        </View>

        {error ? <Text style={styles.dashboardError}>{error}</Text> : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>我的设备</Text>
            <Text style={styles.sectionSubtitle}>下拉刷新设备状态</Text>
          </View>
          <Pressable onPress={disconnect}>
            <Text style={styles.actionText}>断开</Text>
          </Pressable>
        </View>

        {devices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌁</Text>
            <Text style={styles.emptyTitle}>还没有发现设备</Text>
            <Text style={styles.emptyText}>确认 Zigbee2MQTT 已连接，然后下拉刷新。</Text>
          </View>
        ) : (
          devices.map((device) => (
            <DeviceCard
              busy={deviceBusy === device.deviceId}
              device={device}
              key={device.deviceId}
              onToggle={toggleDevice}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 16,
  },
  connectContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 18,
    width: 56,
  },
  logoText: {
    color: COLORS.background,
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    marginTop: 10,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.panelMuted,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 50,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
  helpText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
  dashboardContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dashboardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dashboardTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 5,
  },
  nodeUrl: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 7,
    maxWidth: 240,
  },
  statusPill: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  dashboardError: {
    backgroundColor: '#43202a',
    borderRadius: 10,
    color: '#fecdd3',
    fontSize: 13,
    marginBottom: 18,
    padding: 12,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    padding: 6,
  },
  deviceCard: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
  },
  deviceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  deviceIcon: {
    alignItems: 'center',
    backgroundColor: '#173453',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  deviceIconText: {
    color: COLORS.primary,
    fontSize: 22,
  },
  deviceInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  deviceName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  deviceSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  onlineBadge: {
    backgroundColor: '#123f35',
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  offlineBadge: {
    backgroundColor: '#43202a',
  },
  onlineText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  offlineText: {
    color: COLORS.danger,
  },
  deviceFooter: {
    alignItems: 'center',
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  switchLabel: {
    color: COLORS.text,
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 32,
  },
  emptyIcon: {
    color: COLORS.primary,
    fontSize: 38,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    textAlign: 'center',
  },
});
