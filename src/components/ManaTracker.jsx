import React, { useState } from 'react'

const MANA_TYPES = [
  { key:'W', label:'Plains',    color:'#f9fafb', bg:'#2a2a1a', symbol:'☀', border:'#4a4a2a' },
  { key:'U', label:'Island',    color:'#60a5fa', bg:'#0d1220', symbol:'💧', border:'#1a2a5a' },
  { key:'B', label:'Swamp',     color:'#a78bfa', bg:'#100d18', symbol:'💀', border:'#2a1a4a' },
  { key:'R', label:'Mountain',  color:'#f87171', bg:'#180d0d', symbol:'🔥', border:'#4a1a1a' },
  { key:'G', label:'Forest',    color:'#4ade80', bg:'#0d1a0d', symbol:'🌲', border:'#1a3a1a' },
  { key:'C', label:'Colorless', color:'#9ca3af', bg:'#161616', symbol:'◇', border:'#2a2a2a' },
  { key:'S', label:'Snow',      color:'#bae6fd', bg:'#0c1a22', symbol:'❄', border:'#1a3a4a' },
  { key:'X', label:'Wastes',    color:'#6b7280', bg:'#111',    symbol:'∅', border:'#222' },
]

export default function ManaTracker({ onClose }) {
  const [mana, setMana] = useState({ W:0, U:0, B:0, R:0, G:0, C:0, S:0, X:0 })
  const total = Object.values(mana).reduce((a,b)=>a+b,0)

  function adj(key, d) {
    setMana(m => ({ ...m, [key]: Math.max(0, (m[key]||0) + d) }))
  }
  function clearAll() {
    setMana({ W:0, U:0, B:0, R:0, G:0, C:0, S:0, X:0 })
  }

  return (
    <div style={{
      position:'fixed', top:50, left:'50%', transform:'translateX(-50%)',
      background:'#111', border:'1px solid #333', borderRadius:10,
      padding:14, zIndex:6000, minWidth:320,
      boxShadow:'0 12px 40px rgba(0,0,0,.9)',
      userSelect:'none',
    }}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:600,color:'#e0e0e0',flex:1}}>
          🔮 Mana Pool
          {total>0&&<span style={{marginLeft:8,fontSize:10,color:'#555'}}>({total} floating)</span>}
        </span>
        <button onClick={clearAll} style={{padding:'2px 10px',borderRadius:4,border:'1px solid #222',background:'#1a1a1a',color:'#555',fontSize:10,cursor:'pointer',marginRight:6}}>
          Clear all
        </button>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:16,cursor:'pointer'}}>✕</button>
      </div>

      {/* MANA GRID */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {MANA_TYPES.map(({key,label,color,bg,symbol,border})=>{
          const val = mana[key]||0
          return (
            <div key={key} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'6px 8px',borderRadius:6,
              background: val>0 ? bg : '#0d0d0d',
              border:`1px solid ${val>0?border:'#1a1a1a'}`,
              transition:'background .15s,border-color .15s',
            }}>
              {/* SYMBOL */}
              <div style={{
                width:24,height:24,borderRadius:'50%',
                background: val>0 ? bg : '#111',
                border:`1.5px solid ${val>0?border:'#222'}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:11,flexShrink:0,
              }}>
                {symbol}
              </div>
              {/* LABEL + VALUE */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:9,color:val>0?color:'#333',fontWeight:val>0?600:400,letterSpacing:'.04em'}}>{label}</div>
              </div>
              {/* CONTROLS */}
              <button onClick={()=>adj(key,-1)} style={MBtn}>−</button>
              <span style={{fontSize:16,fontWeight:700,color:val>0?color:'#2a2a2a',minWidth:20,textAlign:'center'}}>{val}</span>
              <button onClick={()=>adj(key,1)}  style={MBtn}>+</button>
            </div>
          )
        })}
      </div>

      {/* TOTAL + EMPTY TURN */}
      {total>0&&(
        <div style={{marginTop:10,padding:'6px 10px',borderRadius:6,background:'#0d0d0d',border:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'#888'}}>Total floating: <b style={{color:'#e0e0e0'}}>{total}</b></span>
          <button onClick={clearAll} style={{padding:'3px 10px',borderRadius:4,border:'1px solid #dc2626',background:'rgba(220,38,38,.1)',color:'#ef4444',fontSize:10,cursor:'pointer'}}>
            Empty pool
          </button>
        </div>
      )}

      <div style={{marginTop:8,fontSize:9,color:'#2a2a2a',textAlign:'center'}}>
        Floating mana empties at end of each step
      </div>
    </div>
  )
}

const MBtn = {
  padding:'1px 7px',border:'1px solid #222',borderRadius:3,
  background:'#0d0d0d',color:'#666',fontSize:13,cursor:'pointer',
  lineHeight:1.4,flexShrink:0,
}
