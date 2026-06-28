import React, { useState } from 'react'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

// CR 903.8: Tax applies ONLY when cast from command zone
// Does NOT apply: from hand, GY, library, or putting onto BF without casting

export default function CommanderZone({
  commander,
  onCastFromZone,
  onReturnToZone,
  onPutOntoBF,
  onCastFromHand,
  onContextMenu,
}) {
  const [imgErr,    setImgErr]    = useState(false)
  const [showRules, setShowRules] = useState(false)

  if (!commander) return null

  const tax       = commander.castCount * 2
  const castCount = commander.castCount || 0
  const inZone    = commander.inZone

  return (
    <div style={{
      position:'fixed',
      right:0,
      bottom:0,
      width:160,
      zIndex:25,
      display:'flex',
      flexDirection:'column',
      gap:0,
      background:'#0d0d0d',
      borderLeft:'1px solid #2a2050',
      borderTop:'1px solid #2a2050',
      borderRadius:'8px 0 0 0',
      boxShadow:'-4px -4px 20px rgba(0,0,0,.7)',
      userSelect:'none',
    }}>
      {/* HEADER */}
      <div style={{
        padding:'5px 8px',
        borderBottom:'1px solid #1a1a2a',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        background:'#0a0a18',
        borderRadius:'8px 0 0 0',
      }}>
        <span style={{fontSize:8,color:'#4c3a8a',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:600}}>
          ⬡ Commander
        </span>
        <span style={{
          fontSize:7,padding:'1px 5px',borderRadius:8,
          background: inZone?'rgba(124,58,237,.2)':'rgba(30,30,30,.8)',
          border:`1px solid ${inZone?'#4c3a8a':'#2a2a2a'}`,
          color: inZone?'#a78bfa':'#555',
        }}>
          {inZone?'CMD Zone':'On BF'}
        </span>
      </div>

      {/* CARD IMAGE — full size like a real card */}
      <div
        onContextMenu={onContextMenu}
        style={{
          position:'relative',
          cursor:'context-menu',
          opacity: inZone ? 1 : 0.55,
          transition:'opacity .2s',
          flexShrink:0,
        }}>
        {!imgErr ? (
          <img
            src={SF(commander.name)}
            alt={commander.name}
            draggable={false}
            style={{
              width:'100%',
              display:'block',
              borderBottom:'1px solid #1a1a2a',
              pointerEvents:'none',
              filter: inZone ? 'none' : 'grayscale(40%)',
            }}
            onError={()=>setImgErr(true)}
          />
        ) : (
          <div style={{
            height:224,
            background:'#14102a',
            display:'flex',flexDirection:'column',
            alignItems:'center',justifyContent:'center',
            padding:10,gap:6,
            borderBottom:'1px solid #1a1a2a',
          }}>
            <div style={{fontSize:20,color:'#4c3a8a'}}>⬡</div>
            <div style={{fontSize:9,color:'#a78bfa',textAlign:'center',lineHeight:1.4}}>{commander.name}</div>
          </div>
        )}

        {/* CAST COUNT BADGE */}
        {castCount > 0 && (
          <div style={{
            position:'absolute',top:4,left:4,
            fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:8,
            background:'rgba(0,0,0,.85)',color:'#f59e0b',
            border:'1px solid rgba(245,158,11,.3)',
          }}>
            Cast ×{castCount}
          </div>
        )}
      </div>

      {/* NAME */}
      <div style={{padding:'5px 8px',borderBottom:'1px solid #141420',background:'#0d0d0d'}}>
        <div style={{fontSize:9,color:inZone?'#c4b5fd':'#555',fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          {commander.name}
        </div>
      </div>

      {/* TAX DISPLAY */}
      <div
        style={{
          padding:'5px 8px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          borderBottom:'1px solid #141420',
          cursor:'help',
          background: tax>0?'rgba(245,158,11,.04)':'#0d0d0d',
        }}
        onClick={()=>setShowRules(s=>!s)}
        title="Click for commander tax rules">
        <span style={{fontSize:8,color:'#555'}}>Tax (CR 903.8)</span>
        <span style={{
          fontSize:11,fontWeight:700,
          color:tax>0?'#f59e0b':'#2a2050',
          letterSpacing:'-.01em',
        }}>
          {tax>0?`+${tax}`:'{0}'}
        </span>
      </div>

      {/* RULES TOOLTIP */}
      {showRules && (
        <div style={{
          position:'absolute',right:'100%',bottom:0,width:200,
          background:'#111',border:'1px solid #2a2050',borderRadius:8,
          padding:'10px 12px',zIndex:100,boxShadow:'-8px 0 24px rgba(0,0,0,.9)',
          marginRight:4,
        }} onClick={()=>setShowRules(false)}>
          <div style={{fontSize:10,fontWeight:600,color:'#a78bfa',marginBottom:6}}>Commander Tax (CR 903.8)</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <Row c="#4ade80" t="Cast from CMD zone → tax applies, +2 per cast"/>
            <Row c="#4ade80" t="Alternate costs (Dash) → tax still applies"/>
            <Row c="#ef4444" t="Cast from hand/GY/library → no tax"/>
            <Row c="#ef4444" t="Put onto BF without casting → no tax"/>
          </div>
          <div style={{marginTop:8,padding:'5px 6px',borderRadius:5,background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
            <div style={{fontSize:9,color:'#f59e0b'}}>Current: +{tax} mana (cast {castCount}× from CMD zone)</div>
          </div>
          <div style={{fontSize:8,color:'#2a2a2a',marginTop:4}}>Click to dismiss</div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div style={{padding:'6px 8px',display:'flex',flexDirection:'column',gap:4}}>
        {inZone ? (
          <button onClick={onCastFromZone} style={{
            padding:'6px 0',borderRadius:5,width:'100%',
            background:'#14102a',border:'1px solid #7c3aed',
            color:'#a78bfa',fontSize:10,cursor:'pointer',fontWeight:600,
          }}>
            Cast {tax>0&&<span style={{color:'#f59e0b'}}>+{tax}</span>} from Zone
          </button>
        ) : (
          <button onClick={onReturnToZone} style={{
            padding:'6px 0',borderRadius:5,width:'100%',
            background:'#0d0d0d',border:'1px solid #2a2050',
            color:'#7c3aed',fontSize:10,cursor:'pointer',
          }}>
            → Return to CMD Zone
          </button>
        )}

        <button onClick={onPutOntoBF} style={{
          padding:'5px 0',borderRadius:5,width:'100%',
          background:'#0d0d0d',border:'1px solid #1a1a1a',
          color:'#444',fontSize:9,cursor:'pointer',
        }}>
          → BF without casting
        </button>

        {!inZone && (
          <button onClick={onCastFromHand} style={{
            padding:'5px 0',borderRadius:5,width:'100%',
            background:'#0d0d0d',border:'1px solid #1a1a1a',
            color:'#333',fontSize:9,cursor:'pointer',
          }}>
            Cast from hand (no tax)
          </button>
        )}
      </div>
    </div>
  )
}

function Row({c,t}) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:5}}>
      <span style={{color:c,fontSize:9,flexShrink:0}}>{c==='#4ade80'?'✓':'✗'}</span>
      <span style={{fontSize:9,color:'#555',lineHeight:1.4}}>{t}</span>
    </div>
  )
}
