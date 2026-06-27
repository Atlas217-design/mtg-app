import React, { useState, useEffect, useCallback } from 'react'
import { useGameState } from '../hooks/useGameState.js'
import Battlefield from './Battlefield.jsx'
import Hand from './Hand.jsx'
import LifeTotal from './LifeTotal.jsx'
import PhaseBar from './PhaseBar.jsx'
import ZonePanel from './ZonePanel.jsx'
import LibraryPanel from './LibraryPanel.jsx'
import StackTracker from './StackTracker.jsx'
import PlaneChaseCenter from './PlaneChaseCenter.jsx'
import ContextMenu from './ContextMenu.jsx'

const PLAYER_CONFIG = {
  You:    { color:'#60a5fa', dot:'#16a34a', nameColor:'#2a6a4a', corner:'bottom-left', zoneId:'z-you', flip:false, gy:'right', exile:'right' },
  Alex:   { color:'#5a7aaa', dot:'#2563eb', nameColor:'#3a5a8a', corner:'top-left',    zoneId:'z-op1', flip:true,  gy:'left',  exile:'left'  },
  Sam:    { color:'#ef4444', dot:'#dc2626', nameColor:'#8a3a3a', corner:'top-right',   zoneId:'z-op2', flip:true,  gy:'right', exile:'right' },
  Jordan: { color:'#a78bfa', dot:'#7c3aed', nameColor:'#6a4a8a', corner:'bottom-right',zoneId:'z-op3', flip:false, gy:'left',  exile:'left'  },
}

export default function GameBoard({ config, onBack }) {
  const gs = useGameState(config)
  const [ctx, setCtx] = useState(null)          // { x,y,card,owner,isHand,isMine }
  const [panel, setPanel] = useState(null)       // { type:'zone'|'library', player?, zone? }
  const [showStack, setShowStack] = useState(false)
  const [toast, setToast] = useState(null)
  const [toastT, setToastT] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)

  // Init planechase
  useEffect(() => {
    if (config?.planechase) gs.initPlanechase()
  }, [config?.planechase])

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastT)
    setToastT(setTimeout(() => setToast(null), 2200))
  }

  // ── CARD MOVE ──
  const handleCardDrop = useCallback((id, fromOwner, toOwner, x, y, crossZone) => {
    gs.moveCard(id, fromOwner, toOwner, x, y)
    if (crossZone) showToast(`Card moved to ${toOwner}'s battlefield`)
  }, [gs])

  // ── CARD CLICK (tap/untap) ──
  const handleCardClick = useCallback((card, owner) => {
    gs.updateCard(card.id, owner, { tapped: !card.tapped })
    showToast((!card.tapped ? 'Tapped ' : 'Untapped ') + card.name)
  }, [gs])

  // ── BF DROP (pile or cross-zone) ──
  const handleBFDrop = useCallback((card, fromOwner, dest, targetOwner, targetZone) => {
    if (dest === 'pile') {
      gs.removeCard(card.id, fromOwner)
      gs.addToZone(targetOwner, targetZone, card)
      showToast(`${card.name} → ${targetOwner}'s ${targetZone}`)
    }
  }, [gs])

  // ── HAND PLAY ──
  const handlePlay = useCallback((handId, x, y) => {
    gs.playFromHand(handId, 'You', x, y)
    showToast('Card played')
  }, [gs])

  // ── HAND DISCARD ──
  const handleDiscard = useCallback((handId, zone) => {
    gs.discardFromHand(handId, zone)
    showToast(`Card → ${zone}`)
  }, [gs])

  // ── CONTEXT MENU ──
  function openCtx(e, card, owner, isHand = false) {
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY, card, owner, isHand, isMine: owner === 'You' })
  }

  function doCtxAction(action) {
    if (!ctx) return
    const { card, owner, isHand } = ctx

    if (isHand) {
      if (action === 'gy')     gs.discardFromHand(card.id, 'gy')
      if (action === 'exile')  gs.discardFromHand(card.id, 'exile')
      if (action === 'cmd')    gs.discardFromHand(card.id, 'cmd')
      setCtx(null); return
    }

    switch (action) {
      case 'tap':     gs.updateCard(card.id, owner, { tapped: !card.tapped }); break
      case 'atk':     gs.updateCard(card.id, owner, { attacking: !card.attacking }); break
      case 'blk':     gs.updateCard(card.id, owner, { blocking: !card.blocking }); break
      case 'tgt':
        // clear other targets first
        Object.keys(gs.cards).forEach(p => gs.cards[p].forEach(c => { if(c.targeted) gs.updateCard(c.id,p,{targeted:false}) }))
        gs.updateCard(card.id, owner, { targeted: true }); break
      case 'counter': gs.updateCard(card.id, owner, { counters: (card.counters||0) + 1 }); break
      case 'rmcounter': gs.updateCard(card.id, owner, { counters: Math.max(0,(card.counters||0)-1) }); break
      case 'steal':
        gs.moveCard(card.id, owner, 'You', 20, 20)
        showToast(`You took control of ${card.name}!`); break
      case 'hand':
        gs.removeCard(card.id, owner)
        gs.setHand(h => [...h, { id:'r-'+Date.now(), name:card.name, type:card.type, col:card.col, art:card.art, pt:card.pt||'' }])
        break
      case 'cmd':   gs.removeCard(card.id, owner); gs.addToZone(owner, 'cmd', card); break
      case 'gy':
      case 'destroy': gs.removeCard(card.id, owner); gs.addToZone(owner, 'gy', card); break
      case 'exile': gs.removeCard(card.id, owner); gs.addToZone(owner, 'exile', card); break
    }
    setCtx(null)
  }

  const PLAYERS = ['You','Alex','Sam','Jordan']
  const curPlayer = PLAYERS[gs.turnIdx]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#0a0a0a', overflow:'hidden' }}>

      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'#080808', borderBottom:'1px solid #1a1a1a', flexShrink:0 }}>
        <button onClick={onBack} style={{ padding:'3px 8px', borderRadius:4, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#444', fontSize:11, cursor:'pointer' }}>← Lobby</button>
        <span style={{ fontSize:12, fontWeight:700, color:'#a78bfa' }}>✦ MTG App</span>
        {config?.planechase && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#14102a', border:'1px solid #3a2d6a', color:'#a78bfa' }}>+ Planechase</span>}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:10, color:'#444' }}>Turn <b style={{ color:'#60a5fa' }}>{gs.turnNum}</b> · <b style={{ color: PLAYER_CONFIG[curPlayer]?.color }}>{curPlayer === 'You' ? 'Your turn' : `${curPlayer}'s turn`}</b></span>
        <button onClick={() => setShowStack(s => !s)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid '+(showStack?'#2a2050':'#1a1a1a'), background:showStack?'#0d0a1e':'#0d0d0d', color:showStack?'#a78bfa':'#444', fontSize:10, cursor:'pointer' }}>
          ⚡ Stack {gs.stack.length > 0 && `(${gs.stack.length})`}
        </button>
        <button onClick={() => setShareOpen(true)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:10, cursor:'pointer' }}>🔗 Share</button>
        <button onClick={gs.endTurn} style={{ padding:'5px 14px', borderRadius:6, background:'#2563eb', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>End turn →</button>
      </div>

      {/* PHASE BAR */}
      <PhaseBar phase={gs.phase} combatSubPhase={gs.combatSubPhase} onPhase={gs.setPhase} onCombatSub={gs.setCombatSubPhase} />

      {/* MAIN BATTLEFIELD GRID */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'44px 1fr 44px', gap:3, padding:4, overflow:'hidden', minHeight:0 }}>

        {/* LEFT PILES: Alex (top) + Jordan (bottom) */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {['Alex','Jordan'].map(p => ['gy','exile'].map(z => (
            <div key={p+z}
              data-pileowner={p} data-pilezone={z}
              onClick={() => setPanel({ type:'zone', player:p, zone:z })}
              style={{ flex:1, borderRadius:6, border:'1px dashed #1a1a1a', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, cursor:'pointer', padding:'4px 2px', transition:'border-color .12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#4c3a8a'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1a1a1a'}
            >
              <span style={{ fontSize:10, opacity:.2 }}>{z==='gy'?'☠':'✦'}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#2a2a2a' }}>{(gs.zones[p+'-'+z]||[]).length}</span>
              <span style={{ fontSize:6, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'center', lineHeight:1.4, color:'#1a1a1a' }}>{p}<br/>{z==='gy'?'GY':'Exile'}</span>
            </div>
          )))}
        </div>

        {/* CENTER: 2x2 GRID */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:3, position:'relative' }}>
          {/* PLANECHASE CENTER */}
          {config?.planechase && gs.planeCard && (
            <PlaneChaseCenter
              planeCard={gs.planeCard}
              planeDie={gs.planeDie}
              planeDiscard={gs.planeDiscard}
              onRoll={gs.rollPlaneDie}
              onPlaneswalk={() => {
                gs.setPlaneDiscard(d => gs.planeCard ? [...d, gs.planeCard] : d)
                gs.setPlaneCard(null)
                setTimeout(() => gs.initPlanechase(), 100)
              }}
            />
          )}

          {/* PLAYER ZONES */}
          {PLAYERS.map(player => {
            const cfg = PLAYER_CONFIG[player]
            return (
              <div key={player} style={{ position:'relative', borderRadius:8, border:'1px solid #1e1e1e', overflow:'hidden', background: player==='You'?'#0b1208':player==='Alex'?'#0c0f18':player==='Sam'?'#130c0c':'#0e0c15' }}>

                {/* ZONE HEADER */}
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderBottom:'1px solid #141414', flexShrink:0, fontSize:8, ...(cfg.flip?{order:3,borderBottom:'none',borderTop:'1px solid #141414'}:{}) }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
                  <span style={{ fontWeight:600, color:cfg.nameColor, flex:1 }}>{player}</span>
                  <span style={{ fontSize:7, color:'#2a2a2a' }}>D:{player==='You'?gs.deckCount:95}</span>
                  <span style={{ fontSize:6, padding:'1px 5px', borderRadius:3, border:'1px solid #3a2d6a', background:'#14102a', color:'#5a4a8a', cursor:'pointer' }}
                    onClick={() => setPanel({ type:'zone', player, zone:'cmd' })}>CMD</span>
                  <span style={{ fontSize:6, padding:'1px 5px', borderRadius:3, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#333', cursor:'pointer' }}
                    onClick={() => setPanel({ type:'library' })}>LIB</span>
                </div>

                {/* BATTLEFIELD */}
                <Battlefield
                  owner={player}
                  cards={gs.cards[player] || []}
                  isFlipped={cfg.flip}
                  onCardMove={handleCardDrop}
                  onCardClick={handleCardClick}
                  onCardContext={(e, card, owner) => openCtx(e, card, owner)}
                  onBFDrop={handleBFDrop}
                />

                {/* LIFE TOTAL IN CORNER */}
                <LifeTotal
                  player={player}
                  value={gs.life[player]}
                  color={cfg.color}
                  cmdrDmg={gs.cmdrDmg[player]}
                  onAdj={(d) => gs.adjLife(player, d)}
                  onAdjCmdr={(from, d) => gs.adjCmdrDmg(from, player, d)}
                  corner={cfg.corner}
                />
              </div>
            )
          })}
        </div>

        {/* RIGHT PILES: Sam (top) + You (bottom) */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {['Sam','You'].map(p => ['gy','exile'].map(z => (
            <div key={p+z}
              data-pileowner={p} data-pilezone={z}
              onClick={() => setPanel({ type:'zone', player:p, zone:z })}
              style={{ flex:1, borderRadius:6, border:'1px dashed #1a1a1a', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, cursor:'pointer', padding:'4px 2px', transition:'border-color .12s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#4c3a8a'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#1a1a1a'}
            >
              <span style={{ fontSize:10, opacity:.2 }}>{z==='gy'?'☠':'✦'}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#2a2a2a' }}>{(gs.zones[p+'-'+z]||[]).length}</span>
              <span style={{ fontSize:6, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'center', lineHeight:1.4, color:'#1a1a1a' }}>{p==='You'?'Your':p}<br/>{z==='gy'?'GY':'Exile'}</span>
            </div>
          )))}
        </div>
      </div>

      {/* BOTTOM HUD */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'6px 10px', background:'#080808', borderTop:'1px solid #141414', flexShrink:0 }}>
        {/* HAND */}
        <div style={{ flex:1 }}>
          <Hand
            cards={gs.hand}
            onPlay={handlePlay}
            onDiscard={handleDiscard}
            onContextMenu={(e, card) => openCtx(e, card, 'You', true)}
          />
        </div>
        {/* DECK */}
        <div
          onClick={() => setPanel({ type:'library' })}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer' }}
          data-pileowner="You" data-pilezone="library"
        >
          <div style={{ width:38, height:52, borderRadius:4, background:'#12102a', border:'1px solid #2a2050', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#2a2050' }}>✦</div>
          <div style={{ fontSize:7, color:'#2a2050' }}>{gs.deckCount}</div>
        </div>
        {/* ACTIONS */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <button onClick={() => gs.drawCard()} style={{ padding:'5px 10px', borderRadius:5, border:'1px solid #3b82f6', background:'#2563eb', color:'#fff', fontSize:10, cursor:'pointer' }}>Draw</button>
          <button onClick={() => gs.untapAll('You')} style={{ padding:'5px 10px', borderRadius:5, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#444', fontSize:10, cursor:'pointer' }}>Untap All</button>
          <button onClick={() => setPanel({ type:'zone', player:'You', zone:'gy' })} style={{ padding:'5px 10px', borderRadius:5, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#444', fontSize:10, cursor:'pointer' }}>Your GY</button>
        </div>
      </div>

      {/* OVERLAYS */}
      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          card={ctx.card} owner={ctx.owner}
          isHand={ctx.isHand} isMine={ctx.isMine}
          onAction={doCtxAction}
          onClose={() => setCtx(null)}
        />
      )}

      {panel?.type === 'zone' && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:799 }} onClick={() => setPanel(null)} />
          <ZonePanel
            player={panel.player} zone={panel.zone}
            zones={gs.zones}
            onRetrieve={gs.retrieveFromZone}
            onClose={() => setPanel(null)}
          />
        </>
      )}

      {panel?.type === 'library' && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:799 }} onClick={() => setPanel(null)} />
          <LibraryPanel
            count={gs.deckCount}
            library={gs.library}
            onDraw={(n) => { gs.drawFromLibrary(n); showToast(`Drew ${n} card${n>1?'s':''}`) }}
            onShuffle={() => { gs.shuffleLibrary(); showToast('Library shuffled') }}
            onLookTop={gs.lookAtTop}
            onBottomCard={gs.bottomCard}
            onClose={() => setPanel(null)}
          />
        </>
      )}

      {showStack && (
        <StackTracker
          stack={gs.stack}
          priority={gs.priority}
          onPass={() => { gs.passPriority(); showToast(`Priority → ${gs.priority}`) }}
          onResolve={() => { gs.popStack(); showToast('Top of stack resolved') }}
          onClose={() => setShowStack(false)}
        />
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShareOpen(false)}>
          <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:12, padding:24, maxWidth:400, width:'90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:10 }}>🔗 Share this game</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:6, background:'#0d0d0d', border:'1px solid #2a2a2a', marginBottom:12 }}>
              <span style={{ fontSize:11, color:'#a78bfa', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {window.location.origin}?room=mtg-{Math.random().toString(36).substr(2,6)}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Copied!'); setShareOpen(false) }} style={{ padding:'4px 12px', borderRadius:5, background:'#2563eb', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>Copy</button>
            </div>
            <button onClick={() => setShareOpen(false)} style={{ width:'100%', padding:8, borderRadius:6, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#888', fontSize:12, cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:88, left:'50%', transform:'translateX(-50%)', background:'#111', border:'1px solid #2a2050', borderRadius:20, padding:'6px 18px', fontSize:11, color:'#a78bfa', zIndex:9000, pointerEvents:'none', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
