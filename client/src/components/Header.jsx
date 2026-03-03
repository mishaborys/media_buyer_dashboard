import { Layout, Badge, Button, Tooltip, Space, message } from 'antd'
import {
  ReloadOutlined,
  ThunderboltOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { UserButton } from '@clerk/clerk-react'
import { triggerRefresh } from '../hooks/useNews'
import { useState } from 'react'

const { Header: AntHeader } = Layout

const MARKET_FLAGS = {
  USA: '🇺🇸',
  EU: '🇪🇺',
  LATAM: '🌎',
  Canada: '🇨🇦',
}

export default function Header({ likedCount, onLikedClick, lastRefresh, onRefreshComplete }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      message.success('Refresh started! New data will appear shortly.')
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
        height: 'auto',
        lineHeight: 'normal',
        minHeight: 64,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="dashboard-header" style={{ flex: 1, paddingTop: 12, paddingBottom: 12 }}>
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
          <Badge count={likedCount} overflowCount={99}>
            <Button
              icon={<HeartOutlined />}
              onClick={onLikedClick}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Liked
            </Button>
          </Badge>
          <UserButton />
        </Space>
      </div>
    </AntHeader>
  )
}
