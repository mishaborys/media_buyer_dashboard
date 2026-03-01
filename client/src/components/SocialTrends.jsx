import { Collapse, Tag, Skeleton, Empty, Typography, Space, Badge } from 'antd'
import { FireOutlined } from '@ant-design/icons'

const { Text } = Typography

const MARKET_LABELS = {
  USA: '🇺🇸 USA',
  EU: '🇪🇺 EU',
  LATAM: '🌎 LATAM',
  Canada: '🇨🇦 Canada',
}

const TAG_COLORS = [
  'red', 'volcano', 'orange', 'gold', 'cyan',
  'blue', 'purple', 'magenta', 'geekblue', 'green',
]

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
        <Empty description="No Google Trends data yet — click Refresh to fetch today's trending searches" />
      </div>
    )
  }

  const marketOrder = market && market !== 'ALL'
    ? [market]
    : ['USA', 'EU', 'LATAM', 'Canada']

  const byMarket = Object.fromEntries(trends.map((t) => [t.market, t]))

  const collapseItems = marketOrder
    .filter((mkt) => byMarket[mkt])
    .map((mkt) => {
      const { topics } = byMarket[mkt]
      return {
        key: mkt,
        label: (
          <Space>
            <FireOutlined style={{ color: '#f5222d' }} />
            <Text strong>{MARKET_LABELS[mkt] || mkt}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Top Google searches today
            </Text>
          </Space>
        ),
        children: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '4px 0' }}>
            {topics.map((t, i) => (
              <div
                key={i}
                onClick={() => window.open(t.url, '_blank', 'noopener,noreferrer')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <Tag
                  color={TAG_COLORS[i % TAG_COLORS.length]}
                  style={{ fontSize: 13, padding: '3px 10px', borderRadius: 12, margin: 0 }}
                >
                  {t.topic}
                </Tag>
                {t.traffic && (
                  <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    ~{t.traffic}
                  </Text>
                )}
              </div>
            ))}
          </div>
        ),
      }
    })

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Collapse
        items={collapseItems}
        defaultActiveKey={['USA', 'EU', 'LATAM', 'Canada']}
        bordered={false}
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
