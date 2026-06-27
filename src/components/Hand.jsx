import React, { useState, useRef } from 'react'

const COL_BG = {
  cg:'#0d1a0d', cu:'#0d1220', cr:'#180d0d', cb:'#100d18',
  cw:'#1a1a0d', ca:'#161616', cforest:'#0d1a0d', cisland:'#0d1220',
  cmtn:'#180d0d', cswamp:'#100d18', cplains:'#1a1a0d',
}

export default function Hand({ cards, onPlay, onDiscard, onContextMenu }) {
  const [hovered, setHovered] = useState(null)
  const handRef = useRef(null)
  const dragRef = useRef(null)

  function handleMouseDown(e, card, idx) {
    if (e.button !== 0) return
    e.preventDefault()

    dragRef.current = { card, idx, startX: e.clientX, startY: e.clientY, moved: false }

    function onMove(me) {
      if (!dragRef.current) return
      const dx = me.clientX - dragRef.current.startX
      const dy = me.clientY - dragRef.current.startY
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true
    }

    function onUp(me) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (!dragRef.current) return

      if (dragRef.current.moved) {
        // Check what we dropped on
        const els = document.elementsFromPoint(me.clientX, me.clientY)
        const bf  = els.find(el => el.dataset.bfowner === 'You')
        const pile= els.find(el => el.dataset.pileowner === 'You')

        if (bf) {
          const rect = bf.getBoundingClientRect()
          onPlay(card.id, Math.max(0, me.clientX - rect.left - 18), Math.max(0, me.clientY - rect.top - 14))
        } else if (pile) {
          onDiscard(card.id, pile.dataset.pilezone)
        }
      }
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const count = cards.length
  const maxSpread = Math.min(count * 44, 500)
  const spacing = count > 1 ? maxSpread / (count - 1) : 0
  const maxRot = Math.min(count * 1.5, 12)

  return (
    <div
      ref={handRef}
      style={{ position:'relative', height:90, width:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
    >
      {cards.map((card, idx) => {
        const mid = (count - 1) / 2
        const offset = idx - mid
        const rot = count > 1 ? (offset / mid) * maxRot : 0
        const yOff = Math.abs(offset) * 3
        const isHov = hovered === card.id

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              bottom: isHov ? 20 : yOff,
              left: `calc(50% + ${(idx - mid) * 46}px - 19px)`,
              width: 38,
              height: 52,
              borderRadius: 4,
              border: `1px solid ${isHov ? '#a78bfa' : '#2a2a2a'}`,
              background: COL_BG[card.col] || '#111',
              cursor: 'grab',
              transform: `rotate(${rot}deg)`,
              transformOrigin: 'bottom center',
              transition: 'bottom .1s, box-shadow .1s, border-color .1s',
              boxShadow: isHov ? '0 8px 20px rgba(0,0,0,.8), 0 0 0 2px rgba(167,139,250,.3)' : '0 2px 6px rgba(0,0,0,.4)',
              zIndex: isHov ? 100 : idx,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
            onMouseDown={(e) => handleMouseDown(e, card, idx)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu && onContextMenu(e, card) }}
          >
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              {card.art}
            </div>
            <div style={{ padding:'2px 3px', background:'rgba(0,0,0,.6)', fontSize:5, color:'#aaa', whiteSpace:'nowrap', overflow:'hidden' }}>
              {card.name}
            </div>
            {/* HOVER PREVIEW */}
            {isHov && (
              <div style={{ position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)', width:130, borderRadius:8, background:'#111', border:'1px solid #2a2a2a', boxShadow:'0 12px 32px rgba(0,0,0,.9)', pointerEvents:'none', zIndex:200, overflow:'hidden' }}>
                <div style={{ height:80, background:COL_BG[card.col]||'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                  {card.art}
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'#e0e0e0', marginBottom:2 }}>{card.name}</div>
                  <div style={{ fontSize:8, color:'#555' }}>{card.type}</div>
                  {card.pt && <div style={{ fontSize:9, color:'#888', marginTop:4 }}>{card.pt}</div>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
