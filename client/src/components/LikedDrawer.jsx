import { Modal, List, Button, Tag, Typography, Empty, Space, Popconfirm } from 'antd'
import {
  DeleteOutlined,
  HeartFilled,
  LinkOutlined,
  BulbOutlined,
  RobotOutlined,
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
    <Modal
      title={
        <Space>
          <HeartFilled style={{ color: '#ff4d4f' }} />
          <span>Liked Topics ({likedItems.length})</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(900px, 95vw)"
      styles={{ body: { padding: '12px 24px 20px', maxHeight: '75vh', overflowY: 'auto', background: '#f5f5f5' } }}
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
          split={false}
          renderItem={(item) => {
            const market = MARKET_CONFIG[item.market] || { color: 'default', flag: '' }
            return (
              <List.Item style={{ padding: '6px 0', alignItems: 'flex-start' }}>
                <div style={{
                  width: '100%',
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: 10,
                  padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {/* Header row: tags + remove button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Space size={4} wrap>
                      <Tag color={market.color} style={{ fontSize: 11 }}>
                        {market.flag} {item.market}
                      </Tag>
                      <Tag color={CATEGORY_COLORS[item.category] || 'default'} style={{ fontSize: 11 }}>
                        {item.category}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.source}</Text>
                    </Space>
                    <Popconfirm
                      title="Remove from liked?"
                      onConfirm={() => onRemove(item.id)}
                      okText="Remove"
                      cancelText="Keep"
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>

                  {/* Headline */}
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.88)', lineHeight: 1.4, display: 'block', marginBottom: 8 }}
                  >
                    <LinkOutlined style={{ marginRight: 6, fontSize: 12, color: '#1677ff' }} />
                    {item.headline}
                  </Link>

                  {/* Claude summary */}
                  {item.summary && (
                    <div style={{ background: '#f6f8ff', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, color: '#1677ff', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        <RobotOutlined style={{ marginRight: 4 }} />
                        Claude Summary
                      </Text>
                      <Paragraph style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', margin: 0, lineHeight: 1.6 }}>
                        {item.summary}
                      </Paragraph>
                    </div>
                  )}

                  {/* Campaign angle */}
                  {item.campaign_angle && (
                    <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, padding: '8px 12px' }}>
                      <Text style={{ fontSize: 11, color: '#d48806', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        <BulbOutlined style={{ marginRight: 4 }} />
                        Facebook Campaign Angle
                      </Text>
                      <Paragraph style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', margin: 0, lineHeight: 1.6 }}>
                        {item.campaign_angle}
                      </Paragraph>
                    </div>
                  )}

                  {!item.summary && !item.campaign_angle && (
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                      No Claude analysis yet — click Enrich on the card to generate it.
                    </Text>
                  )}
                </div>
              </List.Item>
            )
          }}
        />
      )}
    </Modal>
  )
}
