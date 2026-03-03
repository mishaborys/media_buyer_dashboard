import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'

const DISLIKED_KEY = 'media_buyer_disliked'
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function useReactions() {
  const { getToken } = useAuth()
  const [likedItems, setLikedItems] = useState([])

  // Dislikes stay in localStorage — just local "hide from feed" preference
  const [dislikedIds, setDislikedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(DISLIKED_KEY) || '[]'))
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DISLIKED_KEY, JSON.stringify([...dislikedIds]))
    } catch {}
  }, [dislikedIds])

  // Authenticated fetch helper
  const authFetch = useCallback(async (url, options = {}) => {
    const token = await getToken()
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  }, [getToken])

  // Load liked items from server on mount
  useEffect(() => {
    authFetch(`${API_BASE}/reactions?type=like`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setLikedItems(data.data) })
      .catch(() => {})
  }, [authFetch])

  const like = useCallback((item) => {
    setLikedItems((prev) => (prev.find((l) => l.id === item.id) ? prev : [item, ...prev]))
    authFetch(`${API_BASE}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ newsItemId: item.id, reaction: 'like' }),
    }).catch(() => {
      setLikedItems((prev) => prev.filter((l) => l.id !== item.id))
    })
  }, [authFetch])

  const dislike = useCallback((id) => {
    setDislikedIds((prev) => new Set([...prev, id]))
  }, [])

  const removeLike = useCallback((id) => {
    setLikedItems((prev) => prev.filter((l) => l.id !== id))
    authFetch(`${API_BASE}/reactions/${id}`, { method: 'DELETE' }).catch(() => {})
  }, [authFetch])

  const updateLikedItem = useCallback((updatedItem) => {
    setLikedItems((prev) => prev.map((l) => l.id === updatedItem.id ? { ...l, ...updatedItem } : l))
  }, [])

  const isLiked = useCallback((id) => likedItems.some((l) => l.id === id), [likedItems])
  const isDisliked = useCallback((id) => dislikedIds.has(id), [dislikedIds])

  return { likedItems, like, dislike, removeLike, isLiked, isDisliked, updateLikedItem }
}
