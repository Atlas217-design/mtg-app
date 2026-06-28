import React, { useState } from 'react'

// Each mana entry has a type, amount, and whether it's persistent
// persistent = true means it carries between phases (e.g. Omnath, Upwelling)
// persistent = false = normal mana, empties at end of step

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

// Each bucket: { normal: number, persistent: number }
function empty() {
  const r = {}
  MANA_TYPES.forEach(m => { r[m.key] = { normal: 0, persistent: 0 } })
  return r
}

export default function ManaTracker({ onClose, onEmptyNormal }) {
  const [pool,        setPool]        = useState(empty)
  const [showPersist, setShowPersist] = useState(false) // show persistent column

  function adj(key, kind, delta) {
    setPool(p => {
      const cur = p[key][kind]
      const next = Math.max(0, cur + delta)
      return { ...p, [key]: { ...p[key], [kind]: next } }
    })
  }

  function emptyNormal() {
    setPool(p => {
      const next = {}
      MANA_TYPES.forEach(m => {
        next[m.key] = { normal: 0, persistent: p[m.key].persistent }
      })
      return next
    })
    onEmptyNormal && onEmptyNormal()
  }

  function emptyAll() {
    setPool(empty())
  }

  const totalNormal     = MANA_TYPES.reduce((s,m) => s + (pool[m.key].normal     || 0), 0)
  const totalPersistent = MANA_TYPES.reduce((s,m) => s + (pool[m.key].persistent || 0), 0)
  const total           = totalNormal + totalPersistent
  const hasAny          = total > 0

  return (
    <div style={{
      position:'fixed', top:50, left:'50%', transform:'translateX(-50%)',
      background:'#111', border:'1px solid #2a2a2a', borderRadius:10,
      padding:14, zIndex:6000, width:370,
      boxShadow:'0 12px 40px rgba(0,0,0,.95)',
      userSelect:'none',
    }}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
        <span style={{fontSize:12,fontWeight:600,color:'#e0e0e0',flex:1}}>
          🔮 Mana Pool
          {hasAny && (
            <span style={{marginLeft:8,fontSize:10,color:'#555'}}>
              {totalNormal>0 && <span style={{color:'#f87171'}}>{totalNormal} temp</span>}
              {totalNormal>0 && totalPersistent>0 && <span style={{color:'#444'}}> · </span>}
              {totalPersistent>0 && <span style={{color:'#4ade80'}}>{totalPersistent} persistent</span>}
            </span>
          )}
        </span>
        <button
          onClick={() => setShowPersist(s => !s)}
          style={{
            padding:'3px 9px', borderRadius:4, fontSize:10, cursor:'pointer',
            border:`1px solid ${showPersist?'#166534':'#222'}`,
            background: showPersist?'rgba(74,222,128,.1)':'#1a1a1a',
            color: showPersist?'#4ade80':'#555',
          }}>
          {showPersist ? '✓ Showing persistent' : 'Show persistent'}
        </button>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:16,cursor:'pointer'}}>✕</button>
      </div>

      {/* LEGEND */}
      {showPersist && (
        <div style={{display:'flex',gap:12,marginBottom:8,padding:'5px 8px',borderRadius:5,background:'#0d0d0d',border:'1px solid #1a1a1a'}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:'#ef4444',border:'1px solid #991b1b'}}/>
            <span style={{fontSize:9,color:'#555'}}>Temporary — empties at end of step</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:'#4ade80',border:'1px solid #166534'}}/>
            <span style={{fontSize:9,color:'#555'}}>Persistent — carries between phases</span>
          </div>
        </div>
      )}

      {/* MANA ROWS */}
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {MANA_TYPES.map(({key,label,color,bg,border,symbol})=>{
          const norm = pool[key].normal     || 0
          const pers = pool[key].persistent || 0
          const hasAnyHere = norm > 0 || pers > 0

          return (
            <div key={key} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'5px 8px', borderRadius:6,
              background: hasAnyHere ? bg : '#0d0d0d',
              border:`1px solid ${hasAnyHere ? border : '#1a1a1a'}`,
              transition:'background .15s, border-color .15s',
            }}>
              {/* COLOR SYMBOL */}
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background: hasAnyHere ? bg : '#111',
                border:`1.5px solid ${hasAnyHere ? border : '#222'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, flexShrink:0,
              }}>{symbol}</div>

              {/* LABEL */}
              <div style={{fontSize:10,color:hasAnyHere?color:'#333',fontWeight:hasAnyHere?600:400,flex:1,letterSpacing:'.03em'}}>
                {label}
              </div>

              {/* TEMPORARY MANA */}
              <div style={{display:'flex',alignItems:'center',gap:3}}>
                {showPersist && (
                  <span style={{fontSize:8,color:'#444',marginRight:2}}>temp</span>
                )}
                <button onClick={()=>adj(key,'normal',-1)} style={MBtn('#ef4444')}>−</button>
                <span style={{
                  fontSize:15, fontWeight:700, minWidth:18, textAlign:'center',
                  color: norm>0 ? (showPersist?'#f87171':color) : '#2a2a2a',
                }}>{norm}</span>
                <button onClick={()=>adj(key,'normal',1)} style={MBtn('#ef4444')}>+</button>
              </div>

              {/* PERSISTENT MANA (only shown when toggled) */}
              {showPersist && (
                <div style={{display:'flex',alignItems:'center',gap:3,marginLeft:8,paddingLeft:8,borderLeft:'1px solid #1a1a1a'}}>
                  <span style={{fontSize:8,color:'#444',marginRight:2}}>∞</span>
                  <button onClick={()=>adj(key,'persistent',-1)} style={MBtn('#4ade80')}>−</button>
                  <span style={{
                    fontSize:15, fontWeight:700, minWidth:18, textAlign:'center',
                    color: pers>0 ? '#4ade80' : '#2a2a2a',
                  }}>{pers}</span>
                  <button onClick={()=>adj(key,'persistent',1)} style={MBtn('#4ade80')}>+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* TOTALS + ACTIONS */}
      <div style={{marginTop:10,display:'flex',gap:6}}>
        {totalNormal > 0 && (
          <button onClick={emptyNormal} style={{
            flex:1, padding:'7px 0', borderRadius:5, fontSize:10, cursor:'pointer',
            border:'1px solid #7f1d1d', background:'rgba(239,68,68,.08)', color:'#ef4444',
          }}>
            Empty temp mana ({totalNormal})
          </button>
        )}
        {hasAny && (
          <button onClick={emptyAll} style={{
            flex:1, padding:'7px 0', borderRadius:5, fontSize:10, cursor:'pointer',
            border:'1px solid #222', background:'#1a1a1a', color:'#555',
          }}>
            Clear all
          </button>
        )}
        {!hasAny && (
          <div style={{flex:1,textAlign:'center',padding:'7px 0',fontSize:10,color:'#222'}}>
            Pool is empty
          </div>
        )}
      </div>

      <div style={{marginTop:8,fontSize:9,color:'#1e1e1e',textAlign:'center',lineHeight:1.5}}>
        Temp mana empties at end of each step · Persistent mana carries between phases
        {!showPersist && ' · Click "Show persistent" to add persistent mana'}
      </div>
    </div>
  )
}

function MBtn(accentColor) {
  return {
    padding:'1px 7px', border:'1px solid #222', borderRadius:3,
    background:'#0d0d0d', color:'#666', fontSize:13, cursor:'pointer', lineHeight:1.4,
    flexShrink:0,
  }
}
