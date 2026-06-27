import React, { useState } from 'react'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

const COUNTER_TYPES = [
  { key:'+1+1',  label:'+1/+1',   color:'#2563eb', icon:'＋' },
  { key:'-1-1',  label:'−1/−1',   color:'#dc2626', icon:'－' },
  { key:'loyalty',label:'Loyalty', color:'#7c3aed', icon:'◆' },
  { key:'charge', label:'Charge',  color:'#d97706', icon:'⚡' },
  { key:'time',   label:'Time',    color:'#059669', icon:'⏱' },
  { key:'fade',   label:'Fade',    color:'#6b7280', icon:'◎' },
  { key:'ice',    label:'Ice',     color:'#0ea5e9', icon:'❄' },
  { key:'verse',  label:'Verse',   color:'#8b5cf6', icon:'📜' },
  { key:'age',    label:'Age',     color:'#a16207', icon:'⧗' },
  { key:'custom', label:'Custom',  color:'#e0e0e0', icon:'◈' },
]

export default function CardModify({ card, onUpdate, onClose }) {
  const [imgErr, setImgErr] = useState(false)

  // Local editable state
  const [name,     setName]     = useState(card.name)
  const [power,    setPower]    = useState(card.customPower    ?? (card.pt ? card.pt.split('/')[0] : ''))
  const [tough,    setTough]    = useState(card.customToughness ?? (card.pt ? card.pt.split('/')[1] : ''))
  const [counters, setCounters] = useState(card.countersMap    ?? {})
  const [note,     setNote]     = useState(card.note           ?? '')
  const [flipped,  setFlipped]  = useState(card.flipped        ?? false)
  const [sick,     setSick]     = useState(card.sick           ?? false)
  const [phased,   setPhased]   = useState(card.phased         ?? false)

  function adjCounter(key, delta) {
    setCounters(c => {
      const cur = c[key] || 0
      const next = Math.max(0, cur + delta)
      if (next === 0) {
        const { [key]: _, ...rest } = c
        return rest
      }
      return { ...c, [key]: next }
    })
  }

  function save() {
    onUpdate(card.id, {
      name,
      customPower:     power,
      customToughness: tough,
      countersMap:     counters,
      // legacy single counter kept in sync with +1/+1
      counters:        counters['+1+1'] || 0,
      note,
      flipped,
      sick,
      phased,
    })
    onClose()
  }

  const hasPT = card.pt || power || tough

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:12, width:520, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,.9)' }}>

        {/* HEADER */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid #1a1a1a', flexShrink:0 }}>
          <span style={{ fontSize:14, fontWeight:600, color:'#e0e0e0', flex:1 }}>Modify Card</span>
          <button onClick={save} style={{ padding:'5px 18px', borderRadius:6, background:'#2563eb', border:'none', color:'#fff', fontSize:12, cursor:'pointer', fontWeight:600 }}>Save</button>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#444', fontSize:18, cursor:'pointer', marginLeft:4 }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', flex:1, overflow:'hidden' }}>

          {/* LEFT: card image */}
          <div style={{ padding:14, borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
            <div style={{ width:132, borderRadius:8, overflow:'hidden', border:'1px solid #333', flexShrink:0 }}>
              {!imgErr ? (
                <img src={SF(card.name)} alt={card.name} style={{ width:'100%', display:'block' }} onError={() => setImgErr(true)} />
              ) : (
                <div style={{ height:185, background:'#1a1a2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#555', textAlign:'center', padding:8 }}>{card.name}</div>
              )}
            </div>

            {/* STATUS BADGES */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
              {card.tapped   && <Badge color="#f59e0b">Tapped</Badge>}
              {card.attacking && <Badge color="#ef4444">Attacking</Badge>}
              {card.blocking  && <Badge color="#f59e0b">Blocking</Badge>}
              {card.targeted  && <Badge color="#60a5fa">Targeted</Badge>}
              {sick           && <Badge color="#6b7280">Sick</Badge>}
              {phased         && <Badge color="#8b5cf6">Phased</Badge>}
              {card.isToken   && <Badge color="#7c3aed">Token</Badge>}
            </div>
          </div>

          {/* RIGHT: edit fields */}
          <div style={{ padding:14, overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>

            {/* NAME */}
            <Field label="Name">
              <input value={name} onChange={e=>setName(e.target.value)}
                style={inputStyle} />
            </Field>

            {/* POWER / TOUGHNESS */}
            {hasPT && (
              <div>
                <Label>Power / Toughness</Label>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                  <input value={power} onChange={e=>setPower(e.target.value)} placeholder="P"
                    style={{ ...inputStyle, width:60, textAlign:'center', fontSize:16, fontWeight:700 }} />
                  <span style={{ color:'#444', fontSize:18 }}>/</span>
                  <input value={tough} onChange={e=>setTough(e.target.value)} placeholder="T"
                    style={{ ...inputStyle, width:60, textAlign:'center', fontSize:16, fontWeight:700 }} />
                  <span style={{ fontSize:11, color:'#333' }}>Original: {card.pt}</span>
                </div>
              </div>
            )}

            {/* COUNTERS */}
            <div>
              <Label>Counters</Label>
              <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:6 }}>
                {COUNTER_TYPES.map(ct => {
                  const val = counters[ct.key] || 0
                  return (
                    <div key={ct.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:5, background: val > 0 ? '#1a1a2a' : '#0d0d0d', border:`1px solid ${val>0?'#2a2a4a':'#111'}` }}>
                      <span style={{ fontSize:11, color:val>0?ct.color:'#333', flex:1, fontWeight: val>0?600:400 }}>
                        {ct.icon} {ct.label}
                      </span>
                      <button onClick={() => adjCounter(ct.key, -1)} style={cBtn}>−</button>
                      <span style={{ fontSize:14, fontWeight:700, color:val>0?ct.color:'#333', minWidth:20, textAlign:'center' }}>{val}</span>
                      <button onClick={() => adjCounter(ct.key, 1)}  style={cBtn}>+</button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* FLAGS */}
            <div>
              <Label>Status</Label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                <Toggle active={sick}   label="Summoning Sick" onClick={()=>setSick(s=>!s)} color="#6b7280"/>
                <Toggle active={phased} label="Phased Out"     onClick={()=>setPhased(s=>!s)} color="#8b5cf6"/>
                <Toggle active={flipped} label="Flipped"       onClick={()=>setFlipped(s=>!s)} color="#d97706"/>
              </div>
            </div>

            {/* NOTE */}
            <Field label="Battlefield note (reminder text)">
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="e.g. Has flying until end of turn..."
                style={{ ...inputStyle, height:56, resize:'none', lineHeight:1.5 }} />
            </Field>

            {/* SAVE */}
            <button onClick={save} style={{ padding:'9px', borderRadius:6, background:'#2563eb', border:'none', color:'#fff', fontSize:13, cursor:'pointer', fontWeight:600, marginTop:4 }}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ marginTop:4 }}>{children}</div>
    </div>
  )
}
function Label({ children }) {
  return <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'.07em' }}>{children}</div>
}
function Badge({ color, children }) {
  return <span style={{ fontSize:8, padding:'2px 6px', borderRadius:8, background:`${color}22`, border:`1px solid ${color}55`, color }}>{children}</span>
}
function Toggle({ active, label, onClick, color }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:5, background: active ? `${color}22` : '#1a1a1a', border:`1px solid ${active?color:'#222'}`, cursor:'pointer', fontSize:10, color: active ? color : '#444' }}>
      <div style={{ width:12, height:12, borderRadius:'50%', background: active ? color : '#2a2a2a', border:`1px solid ${active?color:'#333'}`, transition:'background .1s' }} />
      {label}
    </div>
  )
}

const inputStyle = { width:'100%', padding:'6px 10px', borderRadius:5, background:'#0d0d0d', border:'1px solid #222', color:'#ccc', fontSize:12, outline:'none', fontFamily:'inherit' }
const cBtn = { padding:'1px 7px', border:'1px solid #1a1a1a', borderRadius:3, background:'#0d0d0d', color:'#666', fontSize:12, cursor:'pointer' }
