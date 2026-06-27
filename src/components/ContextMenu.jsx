import React, { useEffect, useRef } from 'react'

const ITEMS = [
  { action:'tap',       label:'↻ Tap / Untap',         mine:true,  opp:true  },
  { action:'atk',       label:'⚔ Declare attacker',    mine:true,  opp:false },
  { action:'blk',       label:'🛡 Declare blocker',     mine:true,  opp:false },
  { action:'tgt',       label:'◎ Target this',          mine:true,  opp:true  },
  { sep:true },
  { action:'counter',   label:'＋ Add +1/+1 counter',   mine:true,  opp:true  },
  { action:'rmcounter', label:'－ Remove counter',       mine:true,  opp:true  },
  { action:'steal',     label:'🔀 Take control',        mine:false, opp:true  },
  { sep:true },
  { action:'hand',      label:'✋ Return to hand',       mine:true,  opp:false },
  { action:'cmd',       label:'⬡ Command zone',         mine:true,  opp:false },
  { action:'gy',        label:'☠ To graveyard',         mine:true,  opp:true  },
  { action:'exile',     label:'✦ Exile',                mine:true,  opp:true  },
  { sep:true },
  { action:'destroy',   label:'✕ Destroy',              mine:true,  opp:true,  danger:true },
]

export default function ContextMenu({ x, y, card, owner, isHand, isMine, onAction, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  // Clamp to viewport
  const left = Math.min(x, window.innerWidth  - 180)
  const top  = Math.min(y, window.innerHeight - 320)

  const visible = ITEMS.filter(item => {
    if (item.sep) return true
    if (isHand) return ['gy','exile','cmd','hand'].includes(item.action)
    return isMine ? item.mine : item.opp
  })

  return (
    <div ref={ref} style={{
      position:'fixed', left, top, zIndex:10000,
      background:'#111', border:'1px solid #2a2a2a', borderRadius:8,
      padding:4, minWidth:170, boxShadow:'0 8px 28px rgba(0,0,0,.9)',
    }}>
      <div style={{ fontSize:9, color:'#444', padding:'4px 10px 4px', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'1px solid #1a1a1a', marginBottom:2 }}>
        {card?.name || 'Card'}
      </div>
      {visible.map((item, i) =>
        item.sep ? (
          <div key={i} style={{ borderTop:'1px solid #1a1a1a', margin:'3px 0' }} />
        ) : (
          <div key={item.action}
            onClick={() => { onAction(item.action); onClose() }}
            style={{
              padding:'6px 10px', fontSize:11, color: item.danger ? '#777' : '#777',
              cursor:'pointer', borderRadius:5, display:'flex', alignItems:'center', gap:8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#1a0808' : '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ color: item.danger ? '#ef4444' : 'inherit' }}>{item.label}</span>
          </div>
        )
      )}
    </div>
  )
}
