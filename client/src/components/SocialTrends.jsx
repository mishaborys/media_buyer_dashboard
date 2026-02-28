import { Collapse, Tag, Skeleton, Empty, Typography, Space } from 'antd'
import { TikTokOutlined } from '@ant-design/icons'

const { Text } = Typography

const MARKET_LABELS = {
  USA: '🇺🇸 USA',
  EU: '🇪🇺 EU',
  LATAM: '🌎 LATAM',
  Canada: '🇨🇦 Canada',
}

const PLATFORM_CONFIG = {
  TikTok: { color: '#010101', bg: '#fe2c55', label: 'TikTok' },
  Threads: { color: '#fff', bg: '#000', label: 'Threads' },
}

function TrendTagCloud({ topics, platform }) {
  const config = PLATFORM_CONFIG[platform] || { color: '#fff', bg: '#666', label: platform }
  return (
    <div className="trend-tags">
      {topics.map((t, i) => (
        <Tag
          key={i}
          color={config.bg}
          style={{
            color: config.color,
            cursor: 'pointer',
            fontSize: 12,
            borderRadius: 12,
            padding: '2px 10px',
          }}
          onClick={() => t.url && window.open(t.url, '_blank', 'noopener,noreferrer')}
        >
          {t.topic}
        </Tag>
      ))}
    </div>
  )
}

function groupTrendsByMarket(trends) {
  const groups = {}
  for (const t of trends) {
    if (!groups[t.market]) groups[t.market] = {}
    if (!groups[t.market][t.platform]) groups[t.market][t.platform] = []
    groups[t.market][t.platform].push(...t.topics)
  }
  return groups
}

export default function SocialTrends({ trends, loading, market }) {
  if (loading) {
    return (
      <div style={{ padding: '0 16px 16px' }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    )
  }

  if (!trends || trends.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <Empty description="No social trends available" />
      </div>
    )
  }

  const grouped = groupTrendsByMarket(trends)
  const marketOrder = market && market !== 'ALL'
    ? [market]
    : ['USA', 'EU', 'LATAM', 'Canada']

  const collapseItems = marketOrder
    .filter((mkt) => grouped[mkt])
    .map((mkt) => ({
      key: mkt,
      label: (
        <Space>
          <Text strong>{MARKET_LABELS[mkt] || mkt}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Trending Now</Text>
        </Space>
      ),
      children: (
        <div>
          {Object.entries(grouped[mkt] || {}).map(([platform, topics]) => (
            <div key={platform} style={{ marginBottom: 12 }}>
              <Text
                strong
                style={{
                  fontSize: 12,
                  display: 'block',
                  marginBottom: 6,
                  color: PLATFORM_CONFIG[platform]?.bg || '#666',
                }}
              >
                {PLATFORM_CONFIG[platform]?.label || platform}
              </Text>
              <TrendTagCloud topics={topics} platform={platform} />
            </div>
          ))}
        </div>
      ),
    }))

  return (
    <div className="social-trends-section">
      <Collapse
        items={collapseItems}
        defaultActiveKey={['USA']}
        bordered={false}
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
