import React, { useState, useRef, useCallback } from 'react'

const COL_BG = {
  cg:'#0d1a0d', cu:'#0d1220', cr:'#180d0d', cb:'#100d18',
  cw:'#1a1a0d', ca:'#161616', cforest:'#0d1a0d', cisland:'#0d1220',
  cmtn:'#180d0d', cswamp:'#100d18', cplains:'#1a1a0d',
}

function scryfallImg(name) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`
}

export default function Hand({ cards, onPlay, onDiscard, onContextMenu }) {
  const [hovered, setHovered]   = useState(null)
  const [selected, setSelected] = useState(null)
  const [imgErrors, setImgErrors] = useState({})
  const dragRef = useRef(null)
  const ghostRef = useRef(null)

  // Click to select/deselect
  function handleClick(e, card) {
    e.stopPropagation()
    if (selected === card.id) {
      setSelected(null)
    } else {
      setSelected(card.id)
    }
  }

  // Mousedown starts drag
  const handleMouseDown = useCallback((e, card) => {
    if (e.button !== 0) return
    e.preventDefault()

    dragRef.current = {
      card,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }

    // Create ghost element
    const ghost = document.createElement('div')
    ghost.style.cssText = `
      position:fixed; pointer-events:none; z-index:9999;
      width:90px; height:126px; border-radius:6px;
      border:2px solid #a78bfa; box-shadow:0 8px 24px rgba(0,0,0,.9);
      background:${COL_BG[card.col]||'#111'};
      display:flex; align-items:center; justify-content:center;
      font-size:28px; opacity:.85; transform:rotate(3deg);
      left:${e.clientX - 45}px; top:${e.clientY - 63}px;
    `
    ghost.textContent = card.art
    document.body.appendChild(ghost)
    ghostRef.current = ghost

    function onMove(me) {
      if (!dragRef.current) return
      const dx = me.clientX - dragRef.current.startX
      const dy = me.clientY - dragRef.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true
      if (ghost) {
        ghost.style.left = (me.clientX - 45) + 'px'
        ghost.style.top  = (me.clientY - 63) + 'px'
      }
      // Highlight valid drop zones
      const els = document.elementsFromPoint(me.clientX, me.clientY)
      document.querySelectorAll('[data-bfowner="You"]').forEach(el => el.style.outline = '')
      const bf = els.find(el => el.dataset.bfowner === 'You')
      if (bf) bf.style.outline = '2px solid #a78bfa'
    }

    function onUp(me) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.querySelectorAll('[data-bfowner]').forEach(el => el.style.outline = '')
      if (ghost) ghost.remove()
      ghostRef.current = null

      if (!dragRef.current) return
      const wasMoved = dragRef.current.moved

      if (wasMoved) {
        const els = document.elementsFromPoint(me.clientX, me.clientY)
        const bf   = els.find(el => el.dataset.bfowner === 'You')
        const pile = els.find(el => el.dataset.pileowner)

        if (bf) {
          const rect = bf.getBoundingClientRect()
          const x = Math.max(0, me.clientX - rect.left - 45)
          const y = Math.max(0, me.clientY - rect.top  - 63)
          onPlay(card.id, x, y)
          setSelected(null)
        } else if (pile) {
          onDiscard(card.id, pile.dataset.pilezone)
          setSelected(null)
        }
      }
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onPlay, onDiscard])

  // Click on BF while card selected
  function handleBFClick(cardId) {
    if (selected === cardId) {
      // find the BF element and get center
      const bf = document.querySelector('[data-bfowner="You"]')
      if (bf) {
        const rect = bf.getBoundingClientRect()
        onPlay(cardId, rect.width / 2 - 45, rect.height / 2 - 63)
        setSelected(null)
      }
    }
  }

  // Dismiss selection on outside click
  React.useEffect(() => {
    function dismiss(e) {
      if (!e.target.closest('.hand-card')) setSelected(null)
    }
    document.addEventListener('click', dismiss)
    return () => document.removeEventListener('click', dismiss)
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 6,
      padding: '4px 8px',
      overflowX: 'auto',
      overflowY: 'visible',
      minHeight: 140,
      maxHeight: 140,
    }}>
      {cards.map((card) => {
        const isHov  = hovered  === card.id
        const isSel  = selected === card.id
        const hasErr = imgErrors[card.id]

        return (
          <div
            key={card.id}
            className="hand-card"
            style={{
              flexShrink: 0,
              width: 90,
              height: 126,
              borderRadius: 6,
              border: `1.5px solid ${isSel ? '#a78bfa' : isHov ? '#666' : '#2a2a2a'}`,
              background: COL_BG[card.col] || '#111',
              cursor: 'grab',
              position: 'relative',
              overflow: 'hidden',
              transform: isSel ? 'translateY(-16px)' : isHov ? 'translateY(-8px)' : 'none',
              transition: 'transform .12s, border-color .1s, box-shadow .1s',
              boxShadow: isSel
                ? '0 0 0 2px rgba(167,139,250,.4), 0 8px 20px rgba(0,0,0,.8)'
                : isHov
                ? '0 4px 12px rgba(0,0,0,.6)'
                : '0 2px 6px rgba(0,0,0,.4)',
            }}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
            onMouseDown={(e) => handleMouseDown(e, card)}
            onClick={(e) => handleClick(e, card)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu && onContextMenu(e, card) }}
          >
            {/* SCRYFALL IMAGE */}
            {!hasErr ? (
              <img
                src={scryfallImg(card.name)}
                alt={card.name}
                draggable={false}
                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }}
                onError={() => setImgErrors(prev => ({ ...prev, [card.id]: true }))}
              />
            ) : (
              /* FALLBACK if image fails */
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:COL_BG[card.col]||'#111' }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{card.art}</div>
                <div style={{ padding:'3px 5px', background:'rgba(0,0,0,.6)', fontSize:7, color:'#ccc', textAlign:'center' }}>{card.name}</div>
              </div>
            )}

            {/* SELECTED INDICATOR */}
            {isSel && (
              <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, border:'2px solid #a78bfa', borderRadius:5, pointerEvents:'none' }} />
            )}

            {/* HOVER TOOLTIP */}
            {isHov && !isSel && (
              <div style={{
                position:'absolute', bottom:'110%', left:'50%', transform:'translateX(-50%)',
                background:'rgba(10,10,10,.95)', border:'1px solid #2a2a2a', borderRadius:6,
                padding:'4px 8px', fontSize:10, color:'#ccc', whiteSpace:'nowrap',
                pointerEvents:'none', zIndex:100,
              }}>
                {card.name} {card.pt && `· ${card.pt}`}
              </div>
            )}

            {/* SELECTED TOOLTIP */}
            {isSel && (
              <div style={{
                position:'absolute', bottom:'110%', left:'50%', transform:'translateX(-50%)',
                background:'#14102a', border:'1px solid #3a2d6a', borderRadius:6,
                padding:'4px 10px', fontSize:10, color:'#a78bfa', whiteSpace:'nowrap',
                pointerEvents:'none', zIndex:100,
              }}>
                Drag to battlefield ↑
              </div>
            )}
          </div>
        )
      })}

      {cards.length === 0 && (
        <div style={{ fontSize:11, color:'#1e1e1e', padding:'0 8px', alignSelf:'center' }}>Hand is empty</div>
      )}
    </div>
  )
}
