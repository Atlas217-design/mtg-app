import React, { useRef, useCallback, useState } from 'react'
import Card from './Card.jsx'

export default function Battlefield({
  owner, cards, isFlipped,
  onCardMove,    // (id, owner, toOwner, x, y)
  onCardClick,   // (card, owner)
  onCardContext, // (e, card, owner)
  onBFDrop,      // (card, fromOwner, dest, targetOwner, targetZone)
}) {
  const bfRef   = useRef(null)
  const dragRef = useRef(null)
  const ghostRef = useRef(null)
  const [dragId, setDragId] = useState(null)

  const handleMouseDown = useCallback((e, card) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const bfRect = bfRef.current.getBoundingClientRect()
    // Offset within the card where user clicked
    const cardEl = e.currentTarget
    const cardRect = cardEl.getBoundingClientRect()
    const offX = e.clientX - cardRect.left
    const offY = e.clientY - cardRect.top

    dragRef.current = {
      card,
      owner,
      offX,
      offY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }

    // Create floating ghost
    const ghost = document.createElement('div')
    const isLand = card.type === 'Land'
    const w = isLand ? 60 : 90
    const h = isLand ? 42 : 126
    ghost.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:${w}px; height:${h}px; border-radius:5px;
      border:2px solid #a78bfa; box-shadow:0 8px 24px rgba(0,0,0,.9);
      background:#0d1a0d; display:flex; align-items:center; justify-content:center;
      font-size:${isLand?14:24}px; opacity:.85; transform:rotate(3deg);
      left:${e.clientX - offX}px; top:${e.clientY - offY}px;
    `
    ghost.textContent = card.art
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    setDragId(card.id)

    function onMove(me) {
      if (!dragRef.current) return
      const dx = me.clientX - dragRef.current.startX
      const dy = me.clientY - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
      ghost.style.left = (me.clientX - offX) + 'px'
      ghost.style.top  = (me.clientY - offY) + 'px'

      // Highlight valid drop targets
      document.querySelectorAll('[data-bfowner],[data-pileowner]').forEach(el => {
        el.style.outline = ''
      })
      const els = document.elementsFromPoint(me.clientX, me.clientY)
      const targetBF   = els.find(el => el.dataset.bfowner)
      const targetPile = els.find(el => el.dataset.pileowner)
      if (targetBF)   targetBF.style.outline   = '2px solid #a78bfa'
      if (targetPile) targetPile.style.outline = '2px solid #7c3aed'
    }

    function onUp(me) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.querySelectorAll('[data-bfowner],[data-pileowner]').forEach(el => el.style.outline = '')
      ghost.remove()
      ghostRef.current = null
      setDragId(null)

      if (!dragRef.current) return
      const { moved, offX: ox, offY: oy } = dragRef.current

      if (!moved) {
        // It was a click
        onCardClick && onCardClick(card, owner)
      } else {
        // Find drop target (hide ghost first so we hit-test underneath)
        ghost.style.display = 'none'
        const els = document.elementsFromPoint(me.clientX, me.clientY)
        ghost.style.display = ''

        // Walk up to find battlefield or pile
        const targetBF   = els.find(el => el.dataset.bfowner)
        const targetPile = els.find(el => el.dataset.pileowner)

        if (targetPile) {
          onBFDrop && onBFDrop(card, owner, 'pile', targetPile.dataset.pileowner, targetPile.dataset.pilezone)
        } else if (targetBF) {
          const toOwner = targetBF.dataset.bfowner
          const rect    = targetBF.getBoundingClientRect()
          // Calculate position relative to the target battlefield
          let x = me.clientX - rect.left - ox
          let y = me.clientY - rect.top  - oy
          // Clamp within bounds
          x = Math.max(0, Math.min(x, rect.width  - (card.type==='Land'?60:90) - 4))
          y = Math.max(0, Math.min(y, rect.height - (card.type==='Land'?42:126) - 4))
          onCardMove(card.id, owner, toOwner, x, y)
        }
        // If dropped nowhere valid, card stays (position hasn't changed server-side)
      }
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [owner, onCardClick, onCardMove, onBFDrop])

  return (
    <div
      ref={bfRef}
      data-bfowner={owner}
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        minHeight: 0,
        transform: isFlipped ? 'rotate(180deg)' : 'none',
      }}
    >
      {(cards || []).map(card => (
        <Card
          key={card.id}
          card={card}
          isLand={card.type === 'Land'}
          isDragging={dragId === card.id}
          onMouseDown={(e) => handleMouseDown(e, card)}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onCardContext && onCardContext(e, card, owner) }}
        />
      ))}
    </div>
  )
}
