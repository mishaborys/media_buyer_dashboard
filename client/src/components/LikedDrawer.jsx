import { Drawer, List, Button, Tag, Typography, Empty, Space, Popconfirm } from 'antd'
import {
  DeleteOutlined,
  HeartFilled,
  LinkOutlined,
} from '@ant-design/icons'

const { Text, Link, Paragraph } = Typography

const MARKET_CONFIG = {
  USA: { color: 'blue', flag: '🇺🇸' },
  EU: { color: 'purple', flag: '🇪🇺' },
  LATAM: { color: 'green', flag: '🌎' },
  Canada: { color: 'red', flag: '🇨🇦' },
}

const CATEGORY_COLORS = {
  Tech: 'cyan',
  eCommerce: 'orange',
  Finance: 'gold',
  Auto: 'volcano',
  'Savings & Benefits': 'lime',
  Gaming: 'purple',
  Entertainment: 'magenta',
}

export default function LikedDrawer({ open, onClose, likedItems, onRemove }) {
  return (
    <Drawer
      title={
        <Space>
          <HeartFilled style={{ color: '#ff4d4f' }} />
          <span>Liked Topics ({likedItems.length})</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={480}
      bodyStyle={{ padding: '16px' }}
    >
      {likedItems.length === 0 ? (
        <Empty
          description="No liked topics yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 60 }}
        />
      ) : (
        <List
          dataSource={likedItems}
          renderItem={(item) => {
            const market = MARKET_CONFIG[item.market] || { color: 'default', flag: '' }
            return (
              <List.Item
                style={{
                  alignItems: 'flex-start',
                  padding: '12px',
                  background: '#fff0f0',
                  borderRadius: 8,
                  marginBottom: 10,
                  border: '1px solid #ffccc7',
                }}
                actions={[
                  <Popconfirm
                    key="remove"
                    title="Remove from liked?"
                    onConfirm={() => onRemove(item.id)}
                    okText="Remove"
                    cancelText="Keep"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={4} wrap>
                      <Tag color={market.color} style={{ fontSize: 11 }}>
                        {market.flag} {item.market}
                      </Tag>
                      <Tag color={CATEGORY_COLORS[item.category] || 'default'} style={{ fontSize: 11 }}>
                        {item.category}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Link
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)' }}
                      >
                        {item.headline}
                      </Link>
                      {item.summary && (
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', marginTop: 4, marginBottom: 4 }}
                        >
                          {item.summary}
                        </Paragraph>
                      )}
                      {item.campaign_angle && (
                        <Text
                          style={{
                            fontSize: 11,
                            color: '#1677ff',
                            display: 'block',
                            marginTop: 4,
                            fontStyle: 'italic',
                          }}
                        >
                          {item.campaign_angle}
                        </Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        {item.source}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </Drawer>
  )
}
