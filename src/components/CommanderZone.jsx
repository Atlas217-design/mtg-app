import React, { useState } from 'react'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

// Per CR 903.8:
// Tax applies ONLY when casting from command zone
// Tax does NOT apply: from hand, graveyard, library
// Tax does NOT apply: putting onto BF without casting (Sneak Attack, etc.)
// Each cast from command zone increments castCount → tax = castCount * 2

export default function CommanderZone({
  commander,        // { name, castCount, inZone }
  onCastFromZone,   // increments tax
  onReturnToZone,
  onPutOntoBF,      // NO tax — doesn't increment castCount
  onCastFromHand,   // NO tax — doesn't increment castCount  
  onContextMenu,
}) {
  const [imgErr,    setImgErr]    = useState(false)
  const [showRules, setShowRules] = useState(false)

  if (!commander) return null

  const tax      = commander.castCount * 2
  const castCount= commander.castCount || 0
  const inZone   = commander.inZone

  return (
    // Rendered inline in the bottom zone pill bar — not absolute positioned
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'4px 8px',
      borderRadius:8,
      border:`1px solid ${inZone?'#4c3a8a':'#2a2a2a'}`,
      background: inZone ? '#0d0a1e' : '#0d0d0d',
      position:'relative',
    }}>
      {/* CARD THUMBNAIL */}
      <div
        onContextMenu={onContextMenu}
        style={{
          width:32, height:44, borderRadius:4, overflow:'hidden', flexShrink:0,
          border:`1.5px solid ${inZone?'#7c3aed':'#2a2a2a'}`,
          cursor:'context-menu', position:'relative',
          opacity: inZone ? 1 : 0.55,
          transition:'opacity .2s',
        }}>
        {!imgErr ? (
          <img src={SF(commander.name)} alt={commander.name} draggable={false}
            style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}
            onError={()=>setImgErr(true)}/>
        ) : (
          <div style={{width:'100%',height:'100%',background:'#14102a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#a78bfa',textAlign:'center',padding:2}}>
            {commander.name.split(' ').slice(0,2).join(' ')}
          </div>
        )}
        {/* LOCATION DOT */}
        <div style={{
          position:'absolute',bottom:1,right:1,width:6,height:6,borderRadius:'50%',
          background:inZone?'#7c3aed':'#2a2a2a',
          border:'1px solid #0a0a0a',
        }}/>
      </div>

      {/* INFO */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:8,color:'#4c3a8a',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:1}}>Commander</div>
        <div style={{fontSize:10,fontWeight:500,color:inZone?'#a78bfa':'#555',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:100}}>
          {commander.name}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
          {/* LOCATION */}
          <span style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:inZone?'rgba(124,58,237,.2)':'#111',border:`1px solid ${inZone?'#4c3a8a':'#222'}`,color:inZone?'#a78bfa':'#444'}}>
            {inZone?'CMD Zone':'On BF'}
          </span>
          {/* TAX */}
          <span
            onClick={()=>setShowRules(s=>!s)}
            style={{fontSize:8,padding:'1px 5px',borderRadius:8,
              background: tax>0?'rgba(245,158,11,.1)':'#111',
              border:`1px solid ${tax>0?'#b45309':'#222'}`,
              color:tax>0?'#f59e0b':'#444',
              cursor:'help',
            }}
            title="Click for tax explanation">
            Tax: {tax>0?`+${tax}{G}`:'{0}'} {castCount>0&&`(cast ×${castCount})`}
          </span>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{display:'flex',flexDirection:'column',gap:3,flexShrink:0}}>
        {inZone ? (
          <button onClick={onCastFromZone}
            style={{padding:'4px 8px',borderRadius:4,background:'#14102a',border:'1px solid #7c3aed',color:'#a78bfa',fontSize:9,cursor:'pointer',fontWeight:600,whiteSpace:'nowrap'}}>
            Cast (+tax)
          </button>
        ) : (
          <button onClick={onReturnToZone}
            style={{padding:'4px 8px',borderRadius:4,background:'#0d0d0d',border:'1px solid #2a2050',color:'#7c3aed',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
            → CMD Zone
          </button>
        )}
        <button onClick={onPutOntoBF}
          style={{padding:'3px 8px',borderRadius:4,background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#333',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
          → BF (no tax)
        </button>
        {!inZone && (
          <button onClick={onCastFromHand}
            style={{padding:'3px 8px',borderRadius:4,background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#333',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>
            Cast from hand
          </button>
        )}
      </div>

      {/* RULES TOOLTIP */}
      {showRules && (
        <div style={{
          position:'absolute',bottom:'110%',left:0,right:0,
          background:'#111',border:'1px solid #2a2050',borderRadius:6,
          padding:'8px 10px',zIndex:100,boxShadow:'0 8px 24px rgba(0,0,0,.9)',
        }} onClick={()=>setShowRules(false)}>
          <div style={{fontSize:9,fontWeight:600,color:'#a78bfa',marginBottom:5}}>Commander Tax (CR 903.8)</div>
          <div style={{fontSize:9,color:'#555',lineHeight:1.6}}>
            <div style={{color:'#4ade80',marginBottom:3}}>✓ Tax applies when casting from Command Zone</div>
            <div style={{color:'#4ade80',marginBottom:3}}>✓ Tax applies with alternate costs (Dash, etc.)</div>
            <div style={{color:'#ef4444',marginBottom:3}}>✗ No tax when casting from hand, GY, or library</div>
            <div style={{color:'#ef4444',marginBottom:3}}>✗ No tax when putting onto BF without casting</div>
            <div style={{color:'#f59e0b',marginTop:4}}>Current tax: +{tax} generic mana (cast {castCount}× from CMD zone)</div>
          </div>
          <div style={{fontSize:8,color:'#2a2a2a',marginTop:4}}>Click to dismiss</div>
        </div>
      )}
    </div>
  )
}
