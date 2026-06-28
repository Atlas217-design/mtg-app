import React, { useState } from 'react'

const DICE = [
  { sides:2,  label:'Flip Coin',     icon:'🪙' },
  { sides:4,  label:'d4',            icon:'△' },
  { sides:6,  label:'d6',            icon:'⬡' },
  { sides:8,  label:'d8',            icon:'◇' },
  { sides:10, label:'d10',           icon:'◈' },
  { sides:12, label:'d12',           icon:'⬟' },
  { sides:20, label:'d20',           icon:'⬟' },
  { sides:'planar', label:'Planar', icon:'✦' },
]

const PLANAR_FACES = ['blank','blank','blank','blank','chaos','planeswalk']
const PLANAR_COLORS = { blank:'#333', chaos:'#a78bfa', planeswalk:'#60a5fa' }

export default function DiceRoller({ onClose, onLog }) {
  const [result, setResult] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState([])

  function roll(sides) {
    setRolling(true)
    setTimeout(() => {
      let val, display, color='#e0e0e0'
      if (sides === 2) {
        val = Math.random() < 0.5 ? 'Heads' : 'Tails'
        display = val
        color = val==='Heads' ? '#4ade80' : '#f87171'
      } else if (sides === 'planar') {
        val = PLANAR_FACES[Math.floor(Math.random()*6)]
        display = val.charAt(0).toUpperCase()+val.slice(1)
        color = PLANAR_COLORS[val]
      } else {
        val = Math.floor(Math.random()*sides)+1
        display = String(val)
        // Color code for d20
        if (sides===20) color = val===20?'#4ade80':val===1?'#ef4444':val>=15?'#a78bfa':'#e0e0e0'
      }
      const entry = { sides, display, color, time:Date.now() }
      setResult(entry)
      setHistory(h=>[entry,...h.slice(0,9)])
      setRolling(false)
      onLog && onLog(`Rolled ${sides==='planar'?'planar die':sides==='2'?'coin':'d'+sides}: ${display}`)
    }, 300)
  }

  return (
    <div style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      background:'#111', border:'1px solid #333', borderRadius:12,
      padding:16, zIndex:6000, width:320,
      boxShadow:'0 12px 40px rgba(0,0,0,.9)',
    }}>
      <div style={{display:'flex',alignItems:'center',marginBottom:14}}>
        <span style={{fontSize:13,fontWeight:600,color:'#e0e0e0',flex:1}}>🎲 Dice Roller</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>

      {/* RESULT */}
      <div style={{
        textAlign:'center', padding:'16px 0', marginBottom:14,
        background:'#0d0d0d', borderRadius:8, border:'1px solid #1a1a1a',
        minHeight:72, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      }}>
        {rolling ? (
          <div style={{fontSize:28,animation:'spin .3s linear infinite',display:'inline-block'}}>⬡</div>
        ) : result ? (
          <>
            <div style={{fontSize:36,fontWeight:700,color:result.color,lineHeight:1}}>{result.display}</div>
            <div style={{fontSize:10,color:'#444',marginTop:4}}>
              {result.sides==='planar'?'Planar die':result.sides===2?'Coin flip':'d'+result.sides}
            </div>
          </>
        ) : (
          <div style={{fontSize:12,color:'#2a2a2a'}}>Roll a die below</div>
        )}
      </div>

      {/* DICE BUTTONS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
        {DICE.map(({sides,label,icon})=>(
          <button key={sides} onClick={()=>roll(sides)}
            style={{padding:'8px 0',borderRadius:6,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:10,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,transition:'all .1s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#a78bfa';e.currentTarget.style.color='#a78bfa'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#222';e.currentTarget.style.color='#888'}}>
            <span style={{fontSize:14}}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* HISTORY */}
      {history.length>1&&(
        <div style={{borderTop:'1px solid #1a1a1a',paddingTop:10}}>
          <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Recent rolls</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {history.slice(1).map((h,i)=>(
              <span key={i} style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'#1a1a1a',color:h.color,border:'1px solid #222'}}>
                {h.display}
              </span>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
