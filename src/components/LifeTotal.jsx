import React, { useState, useEffect, useRef } from 'react'

export default function LifeTotal({ player, value, color, cmdrDmg, onAdj, onAdjCmdr, corner }) {
  const [delta, setDelta] = useState(null)
  const [showCmdr, setShowCmdr] = useState(false)
  const prevRef = useRef(value)
  const timerRef = useRef(null)

  useEffect(() => {
    const diff = value - prevRef.current
    if (diff !== 0) {
      setDelta(diff)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setDelta(null), 1800)
    }
    prevRef.current = value
  }, [value])

  const lifeColor = value <= 10 ? '#ef4444' : value <= 20 ? '#f59e0b' : color

  // Corner positioning
  const posMap = {
    'bottom-left':  { bottom:8, left:8 },
    'bottom-right': { bottom:8, right:8 },
    'top-left':     { top:8,    left:8 },
    'top-right':    { top:8,    right:8 },
  }
  const pos = posMap[corner] || { bottom:8, left:8 }

  return (
    <div style={{ position:'absolute', ...pos, zIndex:10 }}>
      <div style={{
        background:'rgba(10,10,10,.85)', border:'1px solid #1a1a1a',
        borderRadius:8, padding:'5px 8px', minWidth:58, textAlign:'center',
        backdropFilter:'blur(4px)',
      }}>
        <div style={{ fontSize:7, color:'#333', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:1 }}>{player}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, position:'relative' }}>
          <div style={{ fontSize:20, fontWeight:700, color:lifeColor, lineHeight:1, animation: delta ? 'shake .3s ease' : 'none' }}>
            {value}
          </div>
          {delta !== null && (
            <div style={{ position:'absolute', right:-18, fontSize:10, fontWeight:700, color: delta > 0 ? '#4ade80' : '#ef4444', animation:'fadeUp .8s ease forwards' }}>
              {delta > 0 ? '+' : ''}{delta}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:3, marginTop:3, justifyContent:'center' }}>
          <button onClick={() => onAdj(-1)} style={{ padding:'1px 7px', border:'1px solid #1a1a1a', borderRadius:3, background:'#111', color:'#555', fontSize:12, cursor:'pointer' }}>−</button>
          <button onClick={() => onAdj(1)}  style={{ padding:'1px 7px', border:'1px solid #1a1a1a', borderRadius:3, background:'#111', color:'#555', fontSize:12, cursor:'pointer' }}>+</button>
        </div>
        {/* CMD DAMAGE */}
        <div onClick={() => setShowCmdr(s => !s)} style={{ fontSize:7, color:'#2a2050', marginTop:3, cursor:'pointer' }}>
          CMD ▾
        </div>
        {showCmdr && cmdrDmg && (
          <div style={{ marginTop:4, borderTop:'1px solid #1a1a1a', paddingTop:4 }}>
            {Object.entries(cmdrDmg).map(([from, dmg]) => (
              <div key={from} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                <span style={{ fontSize:7, color:'#333', flex:1 }}>{from}</span>
                <span style={{ fontSize:9, color: dmg >= 21 ? '#ef4444' : dmg >= 15 ? '#f59e0b' : '#555' }}>{dmg}</span>
                <button onClick={() => onAdjCmdr(from, 1)} style={{ padding:'0 3px', border:'1px solid #1a1a1a', borderRadius:2, background:'#0d0d0d', color:'#444', fontSize:8, cursor:'pointer' }}>+</button>
                <button onClick={() => onAdjCmdr(from,-1)} style={{ padding:'0 3px', border:'1px solid #1a1a1a', borderRadius:2, background:'#0d0d0d', color:'#444', fontSize:8, cursor:'pointer' }}>-</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
        @keyframes fadeUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-16px)}}
      `}</style>
    </div>
  )
}
