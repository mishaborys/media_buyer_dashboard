import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useNews(market, category) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (market && market !== 'ALL') params.set('market', market)
      if (category && category !== 'ALL') params.set('category', category)
      params.set('limit', '100')

      const res = await fetch(`${API_BASE}/news?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setNews(data.data || [])
      setLastRefresh(data.meta?.lastRefresh || null)
    } catch (err) {
      setError(err.message)
      setNews([])
    } finally {
      setLoading(false)
    }
  }, [market, category])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return { news, loading, error, lastRefresh, refetch: fetchNews }
}

export function useSocialTrends(market) {
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTrends = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (market && market !== 'ALL') params.set('market', market)

      const res = await fetch(`${API_BASE}/news/social?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTrends(data.data || [])
    } catch (err) {
      console.error('Failed to fetch social trends:', err)
      setTrends([])
    } finally {
      setLoading(false)
    }
  }, [market])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  return { trends, loading, refetch: fetchTrends }
}

export async function triggerRefresh() {
  const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
