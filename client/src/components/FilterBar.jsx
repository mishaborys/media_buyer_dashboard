import { Segmented, Select, Space, Typography } from 'antd'
import {
  MobileOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  CarOutlined,
  DollarOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'

const { Text } = Typography

const MARKETS = [
  { label: '🌐 All', value: 'ALL' },
  { label: '🇺🇸 USA', value: 'USA' },
  { label: '🇪🇺 EU', value: 'EU' },
  { label: '🌎 LATAM', value: 'LATAM' },
  { label: '🇨🇦 Canada', value: 'Canada' },
]

const CATEGORIES = [
  { label: 'All Categories', value: 'ALL', icon: <AppstoreOutlined /> },
  { label: 'Tech', value: 'Tech', icon: <MobileOutlined /> },
  { label: 'eCommerce', value: 'eCommerce', icon: <ShoppingOutlined /> },
  { label: 'Finance', value: 'Finance', icon: <CreditCardOutlined /> },
  { label: 'Auto', value: 'Auto', icon: <CarOutlined /> },
  { label: 'Savings & Benefits', value: 'Savings & Benefits', icon: <DollarOutlined /> },
]

const SOURCES = [
  { label: '🗂 All Sources', value: 'ALL' },
  { label: '📰 Google News', value: 'google_news' },
  { label: '🔗 Reddit', value: 'reddit' },
  { label: '🔥 Google Trends', value: 'google_trends' },
]

export default function FilterBar({ market, category, source, onMarketChange, onCategoryChange, onSourceChange }) {
  return (
    <div className="filter-bar">
      <Space size={16} wrap>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Market
          </Text>
          <Segmented
            options={MARKETS}
            value={market}
            onChange={onMarketChange}
            size="middle"
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Category
          </Text>
          <Select
            value={category}
            onChange={onCategoryChange}
            style={{ width: 200 }}
            options={CATEGORIES.map((c) => ({
              label: (
                <Space size={6}>
                  {c.icon}
                  {c.label}
                </Space>
              ),
              value: c.value,
            }))}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Source
          </Text>
          <Select
            value={source}
            onChange={onSourceChange}
            style={{ width: 170 }}
            options={SOURCES.map((s) => ({ label: s.label, value: s.value }))}
          />
        </div>
      </Space>
    </div>
  )
}
