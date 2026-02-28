import { Layout, Badge, Button, Tooltip, Space, message } from 'antd'
import {
  BookOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { triggerRefresh } from '../hooks/useNews'
import { useState } from 'react'

const { Header: AntHeader } = Layout

const MARKET_FLAGS = {
  USA: '🇺🇸',
  EU: '🇪🇺',
  LATAM: '🌎',
  Canada: '🇨🇦',
}

export default function Header({ bookmarkCount, onSavedClick, lastRefresh, onRefreshComplete }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      message.success('Refresh started! New data will appear shortly.')
      // Poll for completion
      setTimeout(() => {
        onRefreshComplete?.()
        setRefreshing(false)
      }, 8000)
    } catch (err) {
      message.error('Failed to start refresh: ' + err.message)
      setRefreshing(false)
    }
  }

  const formatLastRefresh = (ts) => {
    if (!ts) return 'Never'
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ', ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <AntHeader
      style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div className="dashboard-header">
        <div className="header-logo">
          <ThunderboltOutlined style={{ color: '#fff', fontSize: 24 }} />
          <div>
            <h1>Media Buyer Dashboard</h1>
            <span>
              {Object.values(MARKET_FLAGS).join(' ')} Daily Intelligence
            </span>
          </div>
        </div>

        <Space size={12} className="header-right">
          <div className="last-updated">
            Updated: {formatLastRefresh(lastRefresh)}
          </div>
          <Tooltip title="Refresh all data sources">
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Refresh
            </Button>
          </Tooltip>
          <Badge count={bookmarkCount} overflowCount={99}>
            <Button
              icon={<BookOutlined />}
              onClick={onSavedClick}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Saved
            </Button>
          </Badge>
        </Space>
      </div>
    </AntHeader>
  )
}
