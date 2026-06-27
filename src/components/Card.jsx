import React, { useState } from 'react'

const COL_BG = {
  cg:'#0d1a0d', cu:'#0d1220', cr:'#180d0d', cb:'#100d18',
  cw:'#1a1a0d', ca:'#161616', cforest:'#0d1a0d', cisland:'#0d1220',
  cmtn:'#180d0d', cswamp:'#100d18', cplains:'#1a1a0d',
}
const COL_BORDER = {
  cg:'#1e3a1e', cu:'#1a2a5a', cr:'#4a1a1a', cb:'#2a1a4a',
  cw:'#3a3a1a', ca:'#2a2a2a', cforest:'#1a3a1a', cisland:'#1a2a4a',
  cmtn:'#3a1a1a', cswamp:'#2a1a3a', cplains:'#2a2a1a',
}

function scryfallImg(name) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`
}

export default function Card({ card, isLand, isDragging, onMouseDown, onContextMenu }) {
  const [imgErr, setImgErr] = useState(false)

  const w = isLand ? 60  : 90
  const h = isLand ? 42  : 126

  const borderColor = card.targeted  ? '#60a5fa'
    : card.attacking ? '#ef4444'
    : card.blocking  ? '#f59e0b'
    : COL_BORDER[card.col] || '#333'

  const boxShadow = card.targeted  ? '0 0 0 2px rgba(96,165,250,.4)'
    : card.attacking ? '0 0 0 2px rgba(239,68,68,.4)'
    : card.blocking  ? '0 0 0 2px rgba(245,158,11,.4)'
    : '0 2px 6px rgba(0,0,0,.5)'

  return (
    <div
      style={{
        position:  'absolute',
        left:      card.x,
        top:       card.y,
        width:     w,
        height:    h,
        borderRadius: 5,
        border:    `1.5px solid ${borderColor}`,
        background: COL_BG[card.col] || '#111',
        cursor:    'grab',
        overflow:  'hidden',
        transform: card.tapped ? 'rotate(15deg)' : 'none',
        transformOrigin: 'center center',
        boxShadow,
        opacity:   isDragging ? 0.25 : 1,
        zIndex:    card.attacking ? 50 : card.targeted ? 40 : 10,
        transition: 'opacity .1s',
        userSelect:'none',
      }}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {/* CARD IMAGE */}
      {!imgErr ? (
        <img
          src={scryfallImg(card.name)}
          alt={card.name}
          draggable={false}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isLand?12:22 }}>{card.art}</div>
          {!isLand && <div style={{ padding:'1px 3px', background:'rgba(0,0,0,.6)', fontSize:6, color:'#ccc', textAlign:'center', whiteSpace:'nowrap', overflow:'hidden' }}>{card.name}</div>}
        </div>
      )}

      {/* +1/+1 COUNTERS */}
      {(card.counters || 0) > 0 && (
        <div style={{ position:'absolute', top:-5, left:-5, width:15, height:15, borderRadius:'50%', background:'#2563eb', border:'1.5px solid #0a0a0a', fontSize:7, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, zIndex:5 }}>
          {card.counters}
        </div>
      )}

      {/* ATTACKING ICON */}
      {card.attacking && (
        <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'#ef4444', zIndex:5 }}>⚔</div>
      )}
    </div>
  )
}
