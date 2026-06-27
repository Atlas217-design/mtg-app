import React from 'react'

export default function StackTracker({ stack, priority, onPass, onResolve, onClose }) {
  if (!stack.length && !true) return null // always show when open

  return (
    <div style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      background:'#0d0d0d', border:'1px solid #2a2050', borderRadius:12,
      padding:16, minWidth:280, maxWidth:340, zIndex:700,
      boxShadow:'0 16px 48px rgba(0,0,0,.9)',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:500, color:'#e0e0e0' }}>⚡ The Stack</div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#333', fontSize:16, cursor:'pointer' }}>✕</button>
      </div>

      {/* PRIORITY */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:6, background:'#111', border:'1px solid #1e1e1e', marginBottom:12 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'#a78bfa', animation:'blink 1s ease infinite' }} />
        <span style={{ fontSize:11, color:'#888' }}>Priority: <b style={{ color:'#a78bfa' }}>{priority}</b></span>
        <button onClick={onPass} style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:4, border:'1px solid #2a2050', background:'#14102a', color:'#a78bfa', fontSize:10, cursor:'pointer' }}>
          Pass →
        </button>
      </div>

      {/* STACK ITEMS */}
      {stack.length === 0 ? (
        <div style={{ textAlign:'center', padding:'16px 0', fontSize:11, color:'#2a2a2a' }}>Stack is empty</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12 }}>
          {[...stack].reverse().map((item, i) => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:6, background: i===0 ? '#0d1a2a' : '#111', border:'1px solid '+(i===0?'#1e3a6e':'#1a1a1a') }}>
              <span style={{ fontSize:14 }}>{item.art || '🌊'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#ccc' }}>{item.name}</div>
                <div style={{ fontSize:9, color:'#444' }}>{item.caster} → {item.target || 'resolving'}</div>
              </div>
              {i === 0 && <span style={{ fontSize:9, color:'#60a5fa' }}>TOP</span>}
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onResolve} disabled={stack.length===0}
          style={{ flex:1, padding:'7px 0', borderRadius:6, background: stack.length ? '#2563eb' : '#1a1a1a', border:'none', color: stack.length ? '#fff' : '#333', fontSize:11, cursor: stack.length ? 'pointer' : 'not-allowed' }}>
          Resolve top
        </button>
        <button onClick={onPass}
          style={{ flex:1, padding:'7px 0', borderRadius:6, background:'#111', border:'1px solid #2a2050', color:'#a78bfa', fontSize:11, cursor:'pointer' }}>
          Pass priority
        </button>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
