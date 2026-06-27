import React from 'react'

export default function PlaneChaseCenter({ planeCard, planeDie, planeDiscard, onRoll, onPlaneswalk }) {
  const dieSymbol = planeDie === 'chaos' ? '✦' : planeDie === 'planeswalk' ? '⟩⟩' : '· · ·'
  const dieColor  = planeDie === 'chaos' ? '#a78bfa' : planeDie === 'planeswalk' ? '#60a5fa' : '#333'

  return (
    <div style={{
      position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      zIndex:20, display:'flex', flexDirection:'column', alignItems:'center', gap:6,
      pointerEvents:'all',
    }}>
      {/* PLANE CARD */}
      <div style={{
        width:160, borderRadius:8, background:'#0d0d1a', border:'1px solid #3a2d6a',
        overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,.8)',
      }}>
        <div style={{ height:80, background:'#0d0d22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, opacity:.2 }}>⬡</div>
        <div style={{ padding:'5px 8px 3px', background:'#12102a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10, fontWeight:500, color:'#c4b5fd' }}>{planeCard?.name || 'No plane'}</span>
        </div>
        <div style={{ padding:'2px 8px', background:'#0f1a30', fontSize:8, color:'#2a5a8a' }}>{planeCard?.set || '—'}</div>
        <div style={{ padding:'5px 8px 3px', fontSize:8, color:'#666', lineHeight:1.4 }}>{planeCard?.oracle}</div>
        {planeCard?.chaos && (
          <div style={{ padding:'3px 8px 6px', display:'flex', gap:4, alignItems:'flex-start', borderTop:'1px solid #1e1a30' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#2a1a3a', border:'1px solid #6b3fa0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:6, color:'#a78bfa', flexShrink:0, marginTop:1 }}>✦</div>
            <span style={{ fontSize:7, color:'#7a6a9a', lineHeight:1.4 }}>{planeCard.chaos}</span>
          </div>
        )}
      </div>

      {/* DIE + BUTTONS */}
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <div style={{ width:36, height:36, borderRadius:6, background:'#1a1a1a', border:'1px solid '+(planeDie?'#a78bfa':'#333'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:dieColor, fontWeight:700 }}>
          {dieSymbol}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <button onClick={onRoll} style={{ padding:'3px 10px', borderRadius:4, border:'1px solid #3a2d6a', background:'#14102a', color:'#a78bfa', fontSize:9, cursor:'pointer', whiteSpace:'nowrap' }}>
            Roll die
          </button>
          <button onClick={onPlaneswalk} style={{ padding:'3px 10px', borderRadius:4, border:'1px solid #1a1a2a', background:'#0d0d14', color:'#5a4a7a', fontSize:9, cursor:'pointer', whiteSpace:'nowrap' }}>
            Planeswalk ›
          </button>
        </div>
        {planeDiscard.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1, cursor:'pointer' }}>
            <div style={{ width:22, height:30, borderRadius:3, background:'#0d0d14', border:'1px solid #1a1a2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#2a2050' }}>✦</div>
            <span style={{ fontSize:7, color:'#2a2050' }}>{planeDiscard.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
