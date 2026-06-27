import React, { useRef } from 'react'

const COL_MAP = {
  cg:'#0d1a0d', cu:'#0d1220', cr:'#180d0d', cb:'#100d18',
  cw:'#1a1a0d', ca:'#161616', cforest:'#0d1a0d', cisland:'#0d1220',
  cmtn:'#180d0d', cswamp:'#100d18', cplains:'#1a1a0d',
}
const BORDER_MAP = {
  cg:'#1e3a1e', cu:'#1a2a5a', cr:'#4a1a1a', cb:'#2a1a4a',
  cw:'#3a3a1a', ca:'#2a2a2a', cforest:'#1a3a1a', cisland:'#1a2a4a',
  cmtn:'#3a1a1a', cswamp:'#2a1a3a', cplains:'#2a2a1a',
}

export default function Card({
  card, isLand, isMine,
  onMouseDown, onClick, onContextMenu,
  style = {},
}) {
  const w = isLand ? 42 : 62
  const h = isLand ? 28 : 86
  const bg    = COL_MAP[card.col]    || '#111'
  const border= BORDER_MAP[card.col] || '#333'

  const baseStyle = {
    position: 'absolute',
    width: w,
    height: h,
    left: card.x,
    top:  card.y,
    borderRadius: 5,
    border: `1.5px solid ${card.targeted ? '#60a5fa' : card.attacking ? '#ef4444' : card.selected ? '#a78bfa' : border}`,
    background: bg,
    cursor: 'grab',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transform: card.tapped ? 'rotate(15deg)' : 'none',
    transformOrigin: 'center center',
    boxShadow: card.selected
      ? '0 0 0 2px rgba(167,139,250,.4), 0 4px 12px rgba(0,0,0,.6)'
      : card.attacking
      ? '0 0 0 2px rgba(239,68,68,.3)'
      : card.targeted
      ? '0 0 0 2px rgba(96,165,250,.3)'
      : '0 2px 6px rgba(0,0,0,.4)',
    transition: 'box-shadow .1s, border-color .1s',
    zIndex: card.selected ? 100 : card.attacking ? 50 : 10,
    userSelect: 'none',
    ...style,
  }

  return (
    <div
      style={baseStyle}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* ART AREA */}
      <div style={{ flex: isLand ? 1 : '0 0 55%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isLand ? 11 : 20, background: bg }}>
        {card.art}
      </div>
      {/* NAME BAR */}
      {!isLand && (
        <div style={{ padding:'1px 3px', background:'rgba(0,0,0,.6)', fontSize:6, color:'#ccc', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, display:'flex', alignItems:'center' }}>
          {card.name}
        </div>
      )}
      {/* P/T */}
      {card.pt && (
        <div style={{ position:'absolute', bottom:2, right:3, fontSize:7, fontWeight:700, color:'#fff', textShadow:'0 0 3px #000' }}>
          {card.pt}
        </div>
      )}
      {/* +1/+1 COUNTERS */}
      {card.counters > 0 && (
        <div style={{ position:'absolute', top:-5, left:-5, width:14, height:14, borderRadius:'50%', background:'#2563eb', border:'1.5px solid #0a0a0a', fontSize:7, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, zIndex:2 }}>
          {card.counters}
        </div>
      )}
      {/* ATTACKING ARROW */}
      {card.attacking && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', fontSize:10, color:'#ef4444' }}>⚔</div>
      )}
    </div>
  )
}
