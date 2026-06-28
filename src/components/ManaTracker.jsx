import React, { useState } from 'react'

const MANA_TYPES = [
  { key:'W', label:'Plains',    color:'#f9fafb', bg:'#2a2a1a', symbol:'☀',  border:'#4a4a2a' },
  { key:'U', label:'Island',    color:'#60a5fa', bg:'#0d1220', symbol:'💧', border:'#1a2a5a' },
  { key:'B', label:'Swamp',     color:'#c084fc', bg:'#100d18', symbol:'💀', border:'#2a1a4a' },
  { key:'R', label:'Mountain',  color:'#f87171', bg:'#180d0d', symbol:'🔥', border:'#4a1a1a' },
  { key:'G', label:'Forest',    color:'#4ade80', bg:'#0d1a0d', symbol:'🌲', border:'#1a3a1a' },
  { key:'C', label:'Colorless', color:'#9ca3af', bg:'#161616', symbol:'◇',  border:'#2a2a2a' },
  { key:'S', label:'Snow',      color:'#bae6fd', bg:'#0c1a22', symbol:'❄',  border:'#1a3a4a' },
  { key:'X', label:'Wastes',    color:'#6b7280', bg:'#111',    symbol:'∅',  border:'#222'    },
]

// manaPool shape: { W:{normal:0,persistent:0}, U:{...}, ... }
// Passed in as prop so closing the panel doesn't wipe the values
export default function ManaTracker({ manaPool, onPoolChange, onClose }) {
  const [showPersist, setShowPersist] = useState(false)

  function adj(key, kind, delta) {
    const cur  = (manaPool[key]?.[kind]) || 0
    const next = Math.max(0, cur + delta)
    onPoolChange({
      ...manaPool,
      [key]: { ...(manaPool[key]||{normal:0,persistent:0}), [kind]: next }
    })
  }

  function emptyNormal() {
    const next = {}
    MANA_TYPES.forEach(m => {
      next[m.key] = { normal:0, persistent:(manaPool[m.key]?.persistent)||0 }
    })
    onPoolChange(next)
  }

  function emptyAll() {
    const next = {}
    MANA_TYPES.forEach(m => { next[m.key]={normal:0,persistent:0} })
    onPoolChange(next)
  }

  const totalNormal     = MANA_TYPES.reduce((s,m)=>s+((manaPool[m.key]?.normal)||0),0)
  const totalPersistent = MANA_TYPES.reduce((s,m)=>s+((manaPool[m.key]?.persistent)||0),0)
  const total           = totalNormal+totalPersistent

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#111'}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'12px 14px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:600,color:'#e0e0e0',flex:1}}>
          🔮 Mana Pool
          {total>0&&(
            <span style={{marginLeft:8,fontSize:10}}>
              {totalNormal>0&&<span style={{color:'#f87171'}}>{totalNormal} temp</span>}
              {totalNormal>0&&totalPersistent>0&&<span style={{color:'#333'}}> · </span>}
              {totalPersistent>0&&<span style={{color:'#4ade80'}}>{totalPersistent} ∞</span>}
            </span>
          )}
        </span>
        <button onClick={()=>setShowPersist(s=>!s)}
          style={{padding:'3px 8px',borderRadius:4,fontSize:10,cursor:'pointer',
            border:`1px solid ${showPersist?'#166534':'#222'}`,
            background:showPersist?'rgba(74,222,128,.08)':'#1a1a1a',
            color:showPersist?'#4ade80':'#555'}}>
          {showPersist?'∞ Persistent ON':'∞ Persistent'}
        </button>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:16,cursor:'pointer',padding:'0 2px'}}>✕</button>
      </div>

      {/* LEGEND */}
      {showPersist&&(
        <div style={{padding:'6px 12px',background:'#0d0d0d',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
          <div style={{display:'flex',gap:14,fontSize:9}}>
            <span style={{color:'#555'}}>🔴 Temp = empties on phase change</span>
            <span style={{color:'#555'}}>🟢 ∞ = persists between phases</span>
          </div>
        </div>
      )}

      {/* POOL NOTE */}
      <div style={{padding:'6px 12px',background:'#0d0a1e',borderBottom:'1px solid #1a1a2a',flexShrink:0}}>
        <div style={{fontSize:9,color:'#3a2d6a',lineHeight:1.5}}>
          Mana stays in the pool when you close this panel. Temporary mana clears on phase change. Persistent mana (from Upwelling, Omnath, etc.) never auto-clears.
        </div>
      </div>

      {/* MANA ROWS */}
      <div style={{flex:1,overflowY:'auto',padding:'8px 12px',display:'flex',flexDirection:'column',gap:5}}>
        {MANA_TYPES.map(({key,label,color,bg,border,symbol})=>{
          const norm = (manaPool[key]?.normal)||0
          const pers = (manaPool[key]?.persistent)||0
          const any  = norm>0||pers>0
          return (
            <div key={key} style={{
              display:'flex',alignItems:'center',gap:6,padding:'6px 8px',borderRadius:6,
              background:any?bg:'#0d0d0d',
              border:`1px solid ${any?border:'#1a1a1a'}`,
              transition:'background .15s,border-color .15s',
            }}>
              {/* SYMBOL */}
              <div style={{width:22,height:22,borderRadius:'50%',background:any?bg:'#111',border:`1.5px solid ${any?border:'#222'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>
                {symbol}
              </div>
              {/* LABEL */}
              <div style={{fontSize:10,color:any?color:'#333',fontWeight:any?600:400,flex:1,letterSpacing:'.03em'}}>{label}</div>

              {/* TEMP */}
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                {showPersist&&<span style={{fontSize:8,color:'#f87171',marginRight:1}}>T</span>}
                <button onClick={()=>adj(key,'normal',-1)} style={Btn}>−</button>
                <span style={{fontSize:15,fontWeight:700,minWidth:18,textAlign:'center',color:norm>0?(showPersist?'#f87171':color):'#2a2a2a'}}>{norm}</span>
                <button onClick={()=>adj(key,'normal',1)}  style={Btn}>+</button>
              </div>

              {/* PERSISTENT */}
              {showPersist&&(
                <div style={{display:'flex',alignItems:'center',gap:3,marginLeft:8,paddingLeft:8,borderLeft:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:8,color:'#4ade80',marginRight:1}}>∞</span>
                  <button onClick={()=>adj(key,'persistent',-1)} style={Btn}>−</button>
                  <span style={{fontSize:15,fontWeight:700,minWidth:18,textAlign:'center',color:pers>0?'#4ade80':'#2a2a2a'}}>{pers}</span>
                  <button onClick={()=>adj(key,'persistent',1)}  style={Btn}>+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ACTIONS */}
      <div style={{padding:'8px 12px',borderTop:'1px solid #1a1a1a',flexShrink:0,display:'flex',gap:6}}>
        {totalNormal>0&&(
          <button onClick={emptyNormal} style={{flex:1,padding:'7px 0',borderRadius:5,fontSize:10,cursor:'pointer',border:'1px solid #7f1d1d',background:'rgba(239,68,68,.07)',color:'#ef4444'}}>
            Empty temp ({totalNormal})
          </button>
        )}
        {total>0&&(
          <button onClick={emptyAll} style={{flex:1,padding:'7px 0',borderRadius:5,fontSize:10,cursor:'pointer',border:'1px solid #222',background:'#1a1a1a',color:'#555'}}>
            Clear all
          </button>
        )}
        {total===0&&(
          <div style={{flex:1,textAlign:'center',padding:'7px 0',fontSize:10,color:'#2a2a2a'}}>Pool is empty</div>
        )}
      </div>
    </div>
  )
}

const Btn = {padding:'1px 7px',border:'1px solid #222',borderRadius:3,background:'#0d0d0d',color:'#666',fontSize:13,cursor:'pointer',lineHeight:1.4,flexShrink:0}
