import type { EdgeNode, NodeStatus } from '@/types/edge'

export const nodeStatusLabel: Record<string, string> = { online: '在线', offline: '离线', pending: '待授权', revoked: '已撤销' }
export const nodeStatusColor: Record<string, string> = { online: '#55d6be', offline: '#ff6b7a', pending: '#ffbd69', revoked: '#75809a' }
export function statusLabel(status: NodeStatus): string { return nodeStatusLabel[status] || status }
export function statusColor(status: NodeStatus): string { return nodeStatusColor[status] || '#75809a' }
export function onlineNodes(nodes: EdgeNode[]): EdgeNode[] { return nodes.filter((node) => node.status === 'online') }
export function formatLastSeen(timestamp: number): string {
  if (!timestamp) return '从未连接'
  return new Date(timestamp).toLocaleString()
}
