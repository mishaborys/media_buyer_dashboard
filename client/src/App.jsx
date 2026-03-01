import { useState, useCallback } from 'react'
import { Layout, Tabs, Alert, Typography } from 'antd'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import NewsGrid from './components/NewsGrid'
import SocialTrends from './components/SocialTrends'
import SavedDrawer from './components/SavedDrawer'
import { useNews, useSocialTrends } from './hooks/useNews'
import { useBookmarks } from './hooks/useBookmarks'

const { Content } = Layout
const { Text } = Typography

export default function App() {
  const [market, setMarket] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [source, setSource] = useState('ALL')
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('news')

  const { news, loading: newsLoading, error: newsError, lastRefresh, refetch } = useNews(market, category, source)
  const { trends, loading: trendsLoading } = useSocialTrends(market)
  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark } = useBookmarks()

  const handleRefreshComplete = useCallback(() => {
    refetch()
  }, [refetch])

  const tabItems = [
    {
      key: 'news',
      label: '📰 News Feed',
      children: (
        <>
          {newsError && (
            <Alert
              message="Failed to load news"
              description={`${newsError}. Make sure the backend server is running.`}
              type="error"
              showIcon
              closable
              style={{ margin: '16px 16px 0' }}
            />
          )}
          <NewsGrid
            news={news}
            loading={newsLoading}
            market={market}
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
          />
        </>
      ),
    },
    {
      key: 'social',
      label: '📱 Social Trends',
      children: (
        <SocialTrends
          trends={trends}
          loading={trendsLoading}
          market={market}
        />
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        bookmarkCount={bookmarks.length}
        onSavedClick={() => setSavedDrawerOpen(true)}
        lastRefresh={lastRefresh}
        onRefreshComplete={handleRefreshComplete}
      />

      <FilterBar
        market={market}
        category={category}
        source={source}
        onMarketChange={setMarket}
        onCategoryChange={setCategory}
        onSourceChange={setSource}
      />

      <Content>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{
            background: '#fff',
            padding: '0 16px',
            margin: 0,
            borderBottom: '1px solid #f0f0f0',
          }}
          tabBarExtraContent={
            <Text type="secondary" style={{ fontSize: 12, paddingRight: 8 }}>
              {news.length} items
            </Text>
          }
        />
      </Content>

      <SavedDrawer
        open={savedDrawerOpen}
        onClose={() => setSavedDrawerOpen(false)}
        bookmarks={bookmarks}
        onRemove={removeBookmark}
      />
    </Layout>
  )
}
