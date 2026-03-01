import { Row, Col, Skeleton, Empty, Typography, Divider } from 'antd'
import { FileSearchOutlined } from '@ant-design/icons'
import NewsCard from './NewsCard'

const { Title } = Typography

const MARKET_LABELS = {
  USA: '🇺🇸 USA',
  EU: '🇪🇺 EU',
  LATAM: '🌎 LATAM',
  Canada: '🇨🇦 Canada',
}

function groupByMarket(items) {
  const groups = {}
  for (const item of items) {
    if (!groups[item.market]) groups[item.market] = []
    groups[item.market].push(item)
  }
  return groups
}

function SkeletonGrid() {
  return (
    <div className="skeleton-grid">
      <Row gutter={[16, 16]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Col key={i} xs={24} sm={12} lg={8}>
            <Skeleton active paragraph={{ rows: 5 }} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default function NewsGrid({
  news,
  loading,
  market,
  isLiked,
  isDisliked,
  onLike,
  onDislike,
  onEnrich,
  enrichingId,
}) {
  if (loading) return <SkeletonGrid />

  // Filter out liked and disliked items from main feed
  const visibleNews = news.filter((item) => !isLiked(item.id) && !isDisliked(item.id))

  if (!visibleNews || visibleNews.length === 0) {
    return (
      <div className="empty-state">
        <Empty
          image={<FileSearchOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
          imageStyle={{ height: 80 }}
          description={
            <span style={{ color: '#8c8c8c' }}>
              No news items found. Try refreshing or changing your filters.
            </span>
          }
        />
      </div>
    )
  }

  const cardProps = (item) => ({
    item,
    isLiked: isLiked(item.id),
    onLike,
    onDislike,
    onEnrich,
    enriching: enrichingId === item.id,
  })

  // If a specific market is selected, show flat grid
  if (market && market !== 'ALL') {
    return (
      <div className="news-grid">
        <Row gutter={[16, 16]}>
          {visibleNews.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8}>
              <NewsCard {...cardProps(item)} />
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  // Group by market for ALL view
  const groups = groupByMarket(visibleNews)
  const marketOrder = ['USA', 'EU', 'LATAM', 'Canada']

  return (
    <div className="news-grid">
      {marketOrder.map((mkt) => {
        const items = groups[mkt]
        if (!items || items.length === 0) return null
        return (
          <div key={mkt} style={{ marginBottom: 32 }}>
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Title level={5} style={{ margin: 0 }}>
                {MARKET_LABELS[mkt]}
              </Title>
            </Divider>
            <Row gutter={[16, 16]}>
              {items.map((item) => (
                <Col key={item.id} xs={24} sm={12} lg={8}>
                  <NewsCard {...cardProps(item)} />
                </Col>
              ))}
            </Row>
          </div>
        )
      })}
    </div>
  )
}
