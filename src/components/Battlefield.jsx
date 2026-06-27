import React, { useRef, useCallback } from 'react'
import Card from './Card.jsx'

export default function Battlefield({
  owner, cards, isFlipped,
  onCardDrop, onCardClick, onCardContextMenu,
  onBFDrop,
  style = {},
}) {
  const bfRef = useRef(null)
  const dragging = useRef(null)

  const handleMouseDown = useCallback((e, card) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const rect = bfRef.current.getBoundingClientRect()
    dragging.current = {
      card,
      startX: e.clientX,
      startY: e.clientY,
      origX:  card.x,
      origY:  card.y,
      moved:  false,
    }

    const onMove = (me) => {
      if (!dragging.current) return
      const dx = me.clientX - dragging.current.startX
      const dy = me.clientY - dragging.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.current.moved = true
      if (!dragging.current.moved) return

      // Compute new position relative to THIS battlefield
      const bfRect = bfRef.current.getBoundingClientRect()
      const newX = Math.max(0, me.clientX - bfRect.left - 18)
      const newY = Math.max(0, me.clientY - bfRect.top  - 14)

      onCardDrop(card.id, owner, owner, newX, newY, false) // live update
    }

    const onUp = (me) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!dragging.current) return

      if (!dragging.current.moved) {
        // It was a click — handle tap
        onCardClick && onCardClick(card, owner)
      } else {
        // Check if dropped on a different zone
        const els = document.elementsFromPoint(me.clientX, me.clientY)
        const targetBF = els.find(el => el.dataset.bfowner && el.dataset.bfowner !== owner)
        const targetPile = els.find(el => el.dataset.pileowner)

        if (targetPile) {
          // Dropped on a pile
          onBFDrop && onBFDrop(card, owner, 'pile', targetPile.dataset.pileowner, targetPile.dataset.pilezone)
        } else if (targetBF) {
          // Dropped on another player's battlefield (control effect)
          const bfRect = targetBF.getBoundingClientRect()
          const newX = Math.max(0, me.clientX - bfRect.left - 18)
          const newY = Math.max(0, me.clientY - bfRect.top  - 14)
          onCardDrop(card.id, owner, targetBF.dataset.bfowner, newX, newY, true)
        } else {
          // Dropped within own battlefield — position already updated live
          const bfRect = bfRef.current.getBoundingClientRect()
          const newX = Math.max(0, me.clientX - bfRect.left - 18)
          const newY = Math.max(0, me.clientY - bfRect.top  - 14)
          onCardDrop(card.id, owner, owner, newX, newY, false)
        }
      }
      dragging.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [owner, onCardDrop, onCardClick, onBFDrop])

  return (
    <div
      ref={bfRef}
      data-bfowner={owner}
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        transform: isFlipped ? 'rotate(180deg)' : 'none',
        ...style,
      }}
    >
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          isLand={card.type === 'Land'}
          isMine={owner === 'You'}
          onMouseDown={(e) => handleMouseDown(e, card)}
          onClick={(e) => { e.stopPropagation() }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onCardContextMenu && onCardContextMenu(e, card, owner) }}
        />
      ))}
    </div>
  )
}
