import React, { useState } from 'react'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

export default function CommanderZone({
  commander,       // { name, castCount, inZone }
  onCast,
  onReturnToZone,
  onSendToBF,
  onContextMenu,
}) {
  const [imgErr, setImgErr] = useState(false)

  if (!commander) return null

  const tax      = commander.castCount * 2
  const castCount= commander.castCount || 0
  const inZone   = commander.inZone

  return (
    <div style={{
      position:'absolute', bottom:8, right:8, width:130, zIndex:30,
      display:'flex', flexDirection:'column', gap:5,
    }}>
      {/* CARD IMAGE */}
      <div onContextMenu={onContextMenu} style={{
        borderRadius:8, overflow:'hidden',
        border:`2px solid ${inZone?'#7c3aed':'#2a2a2a'}`,
        boxShadow: inZone
          ? '0 0 0 1px rgba(124,58,237,.3),0 6px 20px rgba(0,0,0,.8)'
          : '0 4px 14px rgba(0,0,0,.7)',
        cursor:'context-menu', position:'relative',
        opacity: inZone ? 1 : 0.6,
        transition:'opacity .2s,border-color .2s',
      }}>
        {!imgErr ? (
          <img src={SF(commander.name)} alt={commander.name} draggable={false}
            style={{width:'100%',display:'block',pointerEvents:'none'}}
            onError={()=>setImgErr(true)}/>
        ) : (
          <div style={{height:182,background:'#14102a',display:'flex',alignItems:'center',justifyContent:'center',padding:8}}>
            <div style={{fontSize:9,color:'#a78bfa',textAlign:'center',lineHeight:1.4}}>{commander.name}</div>
          </div>
        )}
        {/* LABELS */}
        <div style={{position:'absolute',top:3,left:3,fontSize:7,padding:'1px 5px',borderRadius:8,background:'rgba(124,58,237,.85)',color:'#e0e0e0',fontWeight:600}}>COMMANDER</div>
        <div style={{position:'absolute',top:3,right:3,fontSize:7,padding:'1px 5px',borderRadius:8,background:inZone?'rgba(124,58,237,.85)':'rgba(20,20,20,.85)',color:inZone?'#e0e0e0':'#555'}}>
          {inZone?'CMD ZONE':'ON BF'}
        </div>
        {castCount>0&&<div style={{position:'absolute',bottom:3,left:3,fontSize:8,padding:'1px 5px',borderRadius:8,background:'rgba(0,0,0,.8)',color:'#f59e0b',fontWeight:700}}>Cast ×{castCount}</div>}
      </div>

      {/* TAX */}
      <div style={{background:'#0d0d0d',border:'1px solid #2a2050',borderRadius:6,padding:'5px 8px',textAlign:'center'}}>
        <div style={{fontSize:9,color:'#4c3a8a',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Commander Tax</div>
        <div style={{fontSize:18,fontWeight:700,color:tax>0?'#f59e0b':'#a78bfa'}}>{tax>0?`+${tax}`:'0'}</div>
        <div style={{fontSize:8,color:'#2a2050',marginTop:1}}>{tax>0?`costs ${tax} extra`:'no tax yet'}</div>
      </div>

      {/* ACTIONS */}
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        {inZone&&(
          <button onClick={onCast} style={{padding:'6px 0',borderRadius:5,background:'#14102a',border:'1px solid #7c3aed',color:'#a78bfa',fontSize:10,cursor:'pointer',fontWeight:600,width:'100%'}}>
            Cast from CMD Zone
          </button>
        )}
        {!inZone&&(
          <button onClick={onReturnToZone} style={{padding:'6px 0',borderRadius:5,background:'#0d0d0d',border:'1px solid #2a2050',color:'#7c3aed',fontSize:10,cursor:'pointer',width:'100%'}}>
            Return to CMD Zone
          </button>
        )}
        <button onClick={onSendToBF} style={{padding:'5px 0',borderRadius:5,background:'#0d0d0d',border:'1px solid #1a1a1a',color:'#444',fontSize:10,cursor:'pointer',width:'100%'}}>
          Put on Battlefield
        </button>
      </div>
    </div>
  )
}
