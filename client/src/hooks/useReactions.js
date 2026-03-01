import { useState, useEffect, useCallback } from 'react'

const LIKED_KEY = 'media_buyer_liked'
const DISLIKED_KEY = 'media_buyer_disliked'

export function useReactions() {
  const [likedItems, setLikedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')
    } catch {
      return []
    }
  })

  const [dislikedIds, setDislikedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(DISLIKED_KEY) || '[]'))
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify(likedItems))
    } catch {}
  }, [likedItems])

  useEffect(() => {
    try {
      localStorage.setItem(DISLIKED_KEY, JSON.stringify([...dislikedIds]))
    } catch {}
  }, [dislikedIds])

  const like = useCallback((item) => {
    setLikedItems((prev) => (prev.find((l) => l.id === item.id) ? prev : [item, ...prev]))
  }, [])

  const dislike = useCallback((id) => {
    setDislikedIds((prev) => new Set([...prev, id]))
  }, [])

  const removeLike = useCallback((id) => {
    setLikedItems((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const isLiked = useCallback((id) => likedItems.some((l) => l.id === id), [likedItems])
  const isDisliked = useCallback((id) => dislikedIds.has(id), [dislikedIds])

  return { likedItems, like, dislike, removeLike, isLiked, isDisliked }
}
