import React, { useState, useEffect, useRef } from 'react'

export default function LifeTotal({ player, value, color, cmdrDmg, onAdj, onAdjCmdr, corner }) {
  const [delta,    setDelta]    = useState(null)
  const [showCmdr, setShowCmdr] = useState(false)
  const prevRef  = useRef(value)
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

  const posMap = {
    'bottom-left':  { bottom:6, left:6   },
    'bottom-right': { bottom:6, right:6  },
    'top-left':     { top:6,    left:6   },
    'top-right':    { top:6,    right:6  },
  }
  const pos = posMap[corner] || { bottom:6, left:6 }

  return (
    <div
      style={{ position:'absolute', ...pos, zIndex:20 }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background:'rgba(8,8,8,.92)',
        border:`1px solid ${lifeColor}33`,
        borderRadius:8,
        padding:'5px 8px',
        minWidth:60,
        textAlign:'center',
        backdropFilter:'blur(8px)',
        boxShadow:'0 2px 12px rgba(0,0,0,.6)',
      }}>
        <div style={{ fontSize:7, color:'#333', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:1 }}>
          {player}
        </div>

        {/* LIFE VALUE */}
        <div style={{ position:'relative', display:'inline-block' }}>
          <div style={{
            fontSize:22, fontWeight:700, color:lifeColor, lineHeight:1,
            animation: delta ? 'lifeShake .3s ease' : 'none',
          }}>
            {value}
          </div>
          {delta !== null && (
            <div style={{
              position:'absolute', top:-4, right:-16,
              fontSize:10, fontWeight:700,
              color: delta > 0 ? '#4ade80' : '#ef4444',
              animation:'lifeFadeUp .9s ease forwards',
              whiteSpace:'nowrap',
            }}>
              {delta > 0 ? '+' : ''}{delta}
            </div>
          )}
        </div>

        {/* +/- BUTTONS */}
        <div style={{ display:'flex', gap:3, marginTop:4, justifyContent:'center' }}>
          <button
            onClick={() => onAdj(-1)}
            style={{ padding:'1px 8px', border:'1px solid #1a1a1a', borderRadius:3, background:'#111', color:'#666', fontSize:13, cursor:'pointer', lineHeight:1.2 }}
          >−</button>
          <button
            onClick={() => onAdj(1)}
            style={{ padding:'1px 8px', border:'1px solid #1a1a1a', borderRadius:3, background:'#111', color:'#666', fontSize:13, cursor:'pointer', lineHeight:1.2 }}
          >+</button>
        </div>

        {/* COMMANDER DAMAGE TOGGLE */}
        {cmdrDmg && Object.keys(cmdrDmg).length > 0 && (
          <>
            <div
              onClick={() => setShowCmdr(s => !s)}
              style={{ fontSize:7, color:'#2a2050', marginTop:4, cursor:'pointer', userSelect:'none' }}
            >
              CMD {showCmdr ? '▴' : '▾'}
            </div>
            {showCmdr && (
              <div style={{ marginTop:3, borderTop:'1px solid #1a1a1a', paddingTop:3 }}>
                {Object.entries(cmdrDmg).map(([from, dmg]) => (
                  <div key={from} style={{ display:'flex', alignItems:'center', gap:3, marginBottom:2 }}>
                    <span style={{ fontSize:6, color:'#2a2a2a', flex:1, textAlign:'left' }}>{from}</span>
                    <span style={{ fontSize:9, fontWeight:600, color: dmg>=21?'#ef4444':dmg>=15?'#f59e0b':'#444', minWidth:14, textAlign:'center' }}>{dmg}</span>
                    <button onClick={() => onAdjCmdr(from, 1)}  style={{ padding:'0 3px', border:'1px solid #111', borderRadius:2, background:'#0d0d0d', color:'#444', fontSize:8, cursor:'pointer', lineHeight:1.4 }}>+</button>
                    <button onClick={() => onAdjCmdr(from,-1)} style={{ padding:'0 3px', border:'1px solid #111', borderRadius:2, background:'#0d0d0d', color:'#444', fontSize:8, cursor:'pointer', lineHeight:1.4 }}>-</button>
                  </div>
                ))}
                {Object.values(cmdrDmg).some(v => v >= 21) && (
                  <div style={{ fontSize:8, color:'#ef4444', marginTop:2 }}>⚠ Eliminated!</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`
        @keyframes lifeShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        @keyframes lifeFadeUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-14px)} }
      `}</style>
    </div>
  )
}
