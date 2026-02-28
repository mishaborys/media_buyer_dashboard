import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'media_buyer_bookmarks'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch {
      // localStorage might be unavailable
    }
  }, [bookmarks])

  const addBookmark = useCallback((item) => {
    setBookmarks((prev) => {
      if (prev.find((b) => b.id === item.id)) return prev
      return [item, ...prev]
    })
  }, [])

  const removeBookmark = useCallback((id) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const isBookmarked = useCallback(
    (id) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  )

  const toggleBookmark = useCallback(
    (item) => {
      if (isBookmarked(item.id)) {
        removeBookmark(item.id)
      } else {
        addBookmark(item)
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  )

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark }
}
