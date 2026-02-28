import { Card, Tag, Typography, Button, Alert, Tooltip, Space } from 'antd'
import {
  StarOutlined,
  StarFilled,
  MobileOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  CarOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { Link, Text, Paragraph } = Typography

const MARKET_CONFIG = {
  USA: { color: 'blue', flag: '🇺🇸' },
  EU: { color: 'purple', flag: '🇪🇺' },
  LATAM: { color: 'green', flag: '🌎' },
  Canada: { color: 'red', flag: '🇨🇦' },
}

const CATEGORY_CONFIG = {
  Tech: { color: 'cyan', icon: <MobileOutlined /> },
  eCommerce: { color: 'orange', icon: <ShoppingOutlined /> },
  Finance: { color: 'gold', icon: <CreditCardOutlined /> },
  Auto: { color: 'volcano', icon: <CarOutlined /> },
  'Savings & Benefits': { color: 'lime', icon: <DollarOutlined /> },
}

const SOURCE_TYPE_LABELS = {
  google_news: 'Google News',
  reddit: 'Reddit',
  twitter: 'Twitter/X',
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NewsCard({ item, isBookmarked, onToggleBookmark }) {
  const market = MARKET_CONFIG[item.market] || { color: 'default', flag: '' }
  const category = CATEGORY_CONFIG[item.category] || { color: 'default', icon: null }

  return (
    <Card
      className="news-card"
      size="small"
      bordered
      style={{ borderRadius: 8 }}
      bodyStyle={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Tags */}
      <div className="card-tags">
        <Tag color={market.color}>
          {market.flag} {item.market}
        </Tag>
        <Tag color={category.color} icon={category.icon}>
          {item.category}
        </Tag>
        {item.source_type && (
          <Tag color="default" style={{ fontSize: 11 }}>
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </Tag>
        )}
      </div>

      {/* Headline */}
      <div className="card-headline">
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'rgba(0,0,0,0.88)', fontSize: 14 }}
        >
          {item.headline}
        </Link>
      </div>

      {/* Source + Time */}
      <div className="card-source">
        <Space size={4}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {item.source}
          </Text>
          {item.published_at && (
            <>
              <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatRelativeTime(item.published_at)}
              </Text>
            </>
          )}
        </Space>
      </div>

      {/* Summary */}
      {item.summary && (
        <Paragraph
          className="card-summary"
          ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
          style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginBottom: 10, flex: 1 }}
        >
          {item.summary}
        </Paragraph>
      )}

      {/* Campaign Angle */}
      {item.campaign_angle && (
        <Alert
          className="card-angle"
          message={item.campaign_angle}
          type="info"
          showIcon
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}
        />
      )}

      {/* Footer */}
      <div className="card-footer">
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12 }}
        >
          Read more →
        </Link>
        <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Save for later'}>
          <Button
            type="text"
            size="small"
            icon={
              isBookmarked ? (
                <StarFilled style={{ color: '#faad14' }} />
              ) : (
                <StarOutlined style={{ color: '#bfbfbf' }} />
              )
            }
            onClick={() => onToggleBookmark(item)}
          />
        </Tooltip>
      </div>
    </Card>
  )
}
