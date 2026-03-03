const DUST_COLORS = [
  '#c4a35a', '#8b7355', '#d4af70', '#a0926b',
  '#bba060', '#e8d5a3', '#9e8060', '#6b5a3a',
  '#f0d090', '#b8860b', '#daa520', '#cd853f',
]

export function flyToLiked(cardElement) {
  if (!cardElement) return

  const rect = cardElement.getBoundingClientRect()
  const likedBtn = document.querySelector('[data-liked-btn]')
  const target = likedBtn?.getBoundingClientRect() ?? {
    left: window.innerWidth - 120,
    top: 28,
    width: 80,
    height: 32,
  }

  const startX = rect.left + rect.width / 2
  const startY = rect.top + rect.height / 2
  const endX = target.left + target.width / 2
  const endY = target.top + target.height / 2

  const heart = document.createElement('div')
  heart.textContent = '❤️'
  Object.assign(heart.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    fontSize: '32px',
    lineHeight: '1',
    pointerEvents: 'none',
    zIndex: '9999',
    transform: 'translate(-50%, -50%) scale(0.5)',
    opacity: '0',
    transition: 'none',
    willChange: 'transform, left, top, opacity',
  })
  document.body.appendChild(heart)

  // Pop in
  requestAnimationFrame(() => {
    heart.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out'
    heart.style.transform = 'translate(-50%, -50%) scale(1.4)'
    heart.style.opacity = '1'

    // Fly to target
    setTimeout(() => {
      heart.style.transition = 'all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      heart.style.left = `${endX}px`
      heart.style.top = `${endY}px`
      heart.style.transform = 'translate(-50%, -50%) scale(0.3)'
      heart.style.opacity = '0'
    }, 150)
  })

  setTimeout(() => heart.remove(), 800)
}

export function thanosSnap(cardElement, onComplete) {
  if (!cardElement) { onComplete?.(); return }

  const rect = cardElement.getBoundingClientRect()
  const particles = []
  const COUNT = 90

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div')
    const size = 3 + Math.random() * 7
    const x = rect.left + Math.random() * rect.width
    const y = rect.top + Math.random() * rect.height
    const delay = Math.random() * 0.4

    Object.assign(p.style, {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: Math.random() > 0.35 ? '50%' : '2px',
      background: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: `transform ${0.8 + Math.random() * 1.0}s ${delay}s ease-out, opacity ${0.6 + Math.random() * 0.6}s ${delay}s ease-out`,
      willChange: 'transform, opacity',
    })

    document.body.appendChild(p)
    particles.push(p)
  }

  // Fade out the card itself
  cardElement.style.transition = 'opacity 1s ease-out'
  cardElement.style.opacity = '0'
  cardElement.style.pointerEvents = 'none'

  // Trigger scatter on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      particles.forEach(p => {
        const angle = Math.random() * Math.PI * 2
        const dist = 60 + Math.random() * 220
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - Math.random() * 80
        const rot = (Math.random() - 0.5) * 720
        p.style.transform = `translate(${dx}px, ${dy}px) scale(0) rotate(${rot}deg)`
        p.style.opacity = '0'
      })
    })
  })

  setTimeout(() => {
    particles.forEach(p => p.remove())
    onComplete?.()
  }, 1800)
}
