import { Collapse, Tag, Skeleton, Empty, Typography, Space } from 'antd'
import { RiseOutlined } from '@ant-design/icons'

const { Text } = Typography

const MARKET_LABELS = {
  USA: '🇺🇸 USA',
  EU: '🇪🇺 EU',
  LATAM: '🌎 LATAM',
  Canada: '🇨🇦 Canada',
}

const TAG_COLORS = [
  'blue', 'purple', 'cyan', 'green', 'magenta',
  'orange', 'gold', 'lime', 'geekblue', 'volcano',
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
        <Empty description="No trending topics yet — refresh news data first" />
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
            <RiseOutlined />
            <Text strong>{MARKET_LABELS[mkt] || mkt}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Trending keywords from today's news
            </Text>
          </Space>
        ),
        children: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
            {topics.map((t, i) => (
              <Tag
                key={i}
                color={TAG_COLORS[i % TAG_COLORS.length]}
                style={{ cursor: 'pointer', fontSize: 13, padding: '3px 10px', borderRadius: 12 }}
                onClick={() => window.open(t.url, '_blank', 'noopener,noreferrer')}
              >
                {t.topic}
              </Tag>
            ))}
          </div>
        ),
      }
    })

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Collapse
        items={collapseItems}
        defaultActiveKey={['USA']}
        bordered={false}
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
