import React, { useState, useEffect, useCallback, useRef } from 'react'
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

const PLAYER_CFG = {
  You:    { color:'#60a5fa', dot:'#16a34a', nameColor:'#2a6a4a', corner:'bottom-left',  flip:false },
  Alex:   { color:'#5a7aaa', dot:'#2563eb', nameColor:'#3a5a8a', corner:'top-left',     flip:true  },
  Sam:    { color:'#ef4444', dot:'#dc2626', nameColor:'#8a3a3a', corner:'top-right',    flip:true  },
  Jordan: { color:'#a78bfa', dot:'#7c3aed', nameColor:'#6a4a8a', corner:'bottom-right', flip:false },
}

const BG = {
  You:'#0b1208', Alex:'#0c0f18', Sam:'#130c0c', Jordan:'#0e0c15',
}
const BORDER = {
  You:'#182218', Alex:'#16233a', Sam:'#2a1414', Jordan:'#1c1430',
}

export default function GameBoard({ config, onBack }) {
  const gs = useGameState(config)
  const [ctx, setCtx] = useState(null)
  const [panel, setPanel] = useState(null)
  const [showStack, setShowStack] = useState(false)
  const [toast, setToast] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const toastRef = useRef(null)

  useEffect(() => {
    if (config?.planechase) gs.initPlanechase()
  }, [])

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2200)
  }

  // ── CARD MOVE between battlefields ──
  const handleCardMove = useCallback((id, fromOwner, toOwner, x, y) => {
    gs.moveCard(id, fromOwner, toOwner, x, y)
    if (fromOwner !== toOwner) showToast(`Card moved to ${toOwner}'s battlefield`)
  }, [gs])

  // ── CARD CLICK = tap/untap ──
  const handleCardClick = useCallback((card, owner) => {
    gs.updateCard(card.id, owner, { tapped: !card.tapped })
    showToast((card.tapped ? 'Untapped ' : 'Tapped ') + card.name)
  }, [gs])

  // ── DROP ON PILE ──
  const handleBFDrop = useCallback((card, fromOwner, dest, targetOwner, targetZone) => {
    if (dest === 'pile') {
      gs.removeCard(card.id, fromOwner)
      gs.addToZone(targetOwner, targetZone, card)
      showToast(`${card.name} → ${targetOwner}'s ${targetZone}`)
    }
  }, [gs])

  // ── PLAY FROM HAND ──
  const handlePlay = useCallback((handId, x, y) => {
    gs.playFromHand(handId, 'You', x, y)
    showToast('Card played to battlefield')
  }, [gs])

  // ── DISCARD FROM HAND ──
  const handleDiscard = useCallback((handId, zone) => {
    gs.discardFromHand(handId, zone)
    showToast(`Card → ${zone}`)
  }, [gs])

  // ── CONTEXT MENU ──
  function openCtx(e, card, owner, isHand = false) {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY, card, owner, isHand, isMine: owner === 'You' })
  }

  function doCtxAction(action) {
    if (!ctx) return
    const { card, owner, isHand } = ctx

    if (isHand) {
      const hIdx = gs.hand.findIndex(c => c.id === card.id)
      if (action === 'gy')    { if(hIdx>-1) gs.setHand(h=>h.filter((_,i)=>i!==hIdx)); gs.addToZone('You','gy',card) }
      if (action === 'exile') { if(hIdx>-1) gs.setHand(h=>h.filter((_,i)=>i!==hIdx)); gs.addToZone('You','exile',card) }
      if (action === 'cmd')   { if(hIdx>-1) gs.setHand(h=>h.filter((_,i)=>i!==hIdx)); gs.addToZone('You','cmd',card) }
      setCtx(null); return
    }

    switch(action) {
      case 'tap':
        gs.updateCard(card.id, owner, { tapped: !card.tapped })
        showToast((card.tapped?'Untapped ':'Tapped ')+card.name); break
      case 'atk':
        gs.updateCard(card.id, owner, { attacking: !card.attacking })
        showToast(card.name+(card.attacking?' no longer attacking':' attacking')); break
      case 'blk':
        gs.updateCard(card.id, owner, { blocking: !card.blocking })
        showToast(card.name+' blocking'); break
      case 'tgt':
        // clear existing targets
        Object.keys(gs.cards).forEach(p =>
          (gs.cards[p]||[]).forEach(c => { if(c.targeted) gs.updateCard(c.id,p,{targeted:false}) })
        )
        gs.updateCard(card.id, owner, { targeted: true })
        showToast('Targeting '+card.name); break
      case 'counter':
        gs.updateCard(card.id, owner, { counters: (card.counters||0)+1 })
        showToast('+1/+1 counter on '+card.name); break
      case 'rmcounter':
        gs.updateCard(card.id, owner, { counters: Math.max(0,(card.counters||0)-1) }); break
      case 'steal':
        gs.moveCard(card.id, owner, 'You', 30, 30)
        showToast('You took control of '+card.name+'!'); break
      case 'hand':
        gs.removeCard(card.id, owner)
        gs.setHand(h => [...h, { id:'r-'+Date.now(), name:card.name, type:card.type, col:card.col, art:card.art, pt:card.pt||'' }])
        showToast(card.name+' returned to hand'); break
      case 'cmd':
        gs.removeCard(card.id, owner); gs.addToZone(owner,'cmd',card)
        showToast(card.name+' → command zone'); break
      case 'gy': case 'destroy':
        gs.removeCard(card.id, owner); gs.addToZone(owner,'gy',card)
        showToast(card.name+' → graveyard'); break
      case 'exile':
        gs.removeCard(card.id, owner); gs.addToZone(owner,'exile',card)
        showToast(card.name+' exiled'); break
    }
    setCtx(null)
  }

  const PLAYERS = ['You','Alex','Sam','Jordan']
  const curPlayer = PLAYERS[gs.turnIdx]

  // ── PILE COMPONENT ──
  function Pile({ player, zone }) {
    const count = (gs.zones[`${player}-${zone}`]||[]).length
    const icon = zone==='gy' ? '☠' : '✦'
    const label = zone==='gy' ? 'GY' : 'Exile'
    const shortName = player==='You' ? 'Your' : player
    return (
      <div
        data-pileowner={player}
        data-pilezone={zone}
        onClick={() => setPanel({ type:'zone', player, zone })}
        style={{
          flex:1, borderRadius:6, border:'1px dashed #1a1a1a', background:'#080808',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:1, cursor:'pointer', padding:'4px 2px', transition:'border-color .12s',
          minHeight:0,
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#4c3a8a'}
        onMouseLeave={e => e.currentTarget.style.borderColor='#1a1a1a'}
      >
        <span style={{ fontSize:10, opacity:.2 }}>{icon}</span>
        <span style={{ fontSize:14, fontWeight:700, color: count>0?'#888':'#2a2a2a' }}>{count}</span>
        <span style={{ fontSize:6, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'center', lineHeight:1.4, color:'#1a1a1a' }}>
          {shortName}<br/>{label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#0a0a0a', overflow:'hidden' }}>

      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'#080808', borderBottom:'1px solid #1a1a1a', flexShrink:0 }}>
        <button onClick={onBack} style={{ padding:'3px 8px', borderRadius:4, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#444', fontSize:11, cursor:'pointer' }}>← Lobby</button>
        <span style={{ fontSize:12, fontWeight:700, color:'#a78bfa' }}>✦ MTG App</span>
        {config?.planechase && (
          <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#14102a', border:'1px solid #3a2d6a', color:'#a78bfa' }}>+ Planechase</span>
        )}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:10, color:'#444' }}>
          Turn <b style={{ color:'#60a5fa' }}>{gs.turnNum}</b> ·{' '}
          <b style={{ color: PLAYER_CFG[curPlayer]?.color }}>
            {curPlayer==='You' ? 'Your turn' : `${curPlayer}'s turn`}
          </b>
        </span>
        <button onClick={() => setShowStack(s=>!s)} style={{ padding:'4px 10px', borderRadius:5, border:`1px solid ${showStack?'#2a2050':'#1a1a1a'}`, background:showStack?'#0d0a1e':'#0d0d0d', color:showStack?'#a78bfa':'#444', fontSize:10, cursor:'pointer' }}>
          ⚡ Stack{gs.stack.length>0&&` (${gs.stack.length})`}
        </button>
        <button onClick={() => setShareOpen(true)} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:10, cursor:'pointer' }}>🔗 Share</button>
        <button onClick={gs.endTurn} style={{ padding:'5px 14px', borderRadius:6, background:'#2563eb', border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>End turn →</button>
      </div>

      {/* PHASE BAR */}
      <PhaseBar phase={gs.phase} combatSubPhase={gs.combatSubPhase} onPhase={gs.setPhase} onCombatSub={gs.setCombatSubPhase} />

      {/* MAIN: side piles + 2x2 grid + side piles */}
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'48px 1fr 48px', gap:3, padding:4, overflow:'hidden', minHeight:0 }}>

        {/* LEFT PILES */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <Pile player="Alex"   zone="gy"    />
          <Pile player="Alex"   zone="exile" />
          <Pile player="Jordan" zone="gy"    />
          <Pile player="Jordan" zone="exile" />
        </div>

        {/* CENTER 2x2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:3, position:'relative', minHeight:0 }}>

          {/* PLANECHASE */}
          {config?.planechase && gs.planeCard && (
            <PlaneChaseCenter
              planeCard={gs.planeCard} planeDie={gs.planeDie} planeDiscard={gs.planeDiscard}
              onRoll={gs.rollPlaneDie}
              onPlaneswalk={() => {
                gs.setPlaneDiscard(d => gs.planeCard ? [...d,gs.planeCard] : d)
                gs.setPlaneCard(null)
                setTimeout(gs.initPlanechase, 100)
              }}
            />
          )}

          {/* PLAYER ZONES */}
          {PLAYERS.map(player => {
            const cfg = PLAYER_CFG[player]
            return (
              <div key={player} style={{ position:'relative', borderRadius:8, border:`1px solid ${BORDER[player]}`, overflow:'hidden', background:BG[player], display:'flex', flexDirection:'column', minHeight:0 }}>

                {/* HEADER */}
                <div style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'3px 8px', fontSize:8,
                  borderBottom: cfg.flip ? 'none' : '1px solid #141414',
                  borderTop:    cfg.flip ? '1px solid #141414' : 'none',
                  flexShrink:0,
                  order: cfg.flip ? 2 : 0,
                }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot }} />
                  <span style={{ fontWeight:600, color:cfg.nameColor, flex:1 }}>{player}</span>
                  <span style={{ fontSize:7, color:'#252525' }}>
                    {player==='You' ? `D:${gs.deckCount}` : 'D:95'}
                  </span>
                  <span
                    style={{ fontSize:6, padding:'1px 5px', borderRadius:3, border:'1px solid #3a2d6a', background:'#14102a', color:'#5a4a8a', cursor:'pointer' }}
                    onClick={() => setPanel({ type:'zone', player, zone:'cmd' })}
                  >CMD</span>
                  {player==='You' && (
                    <span
                      style={{ fontSize:6, padding:'1px 5px', borderRadius:3, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#333', cursor:'pointer' }}
                      onClick={() => setPanel({ type:'library' })}
                    >LIB</span>
                  )}
                </div>

                {/* BATTLEFIELD */}
                <div style={{ flex:1, transform: cfg.flip ? 'rotate(180deg)' : 'none', minHeight:0, position:'relative' }}>
                  <Battlefield
                    owner={player}
                    cards={gs.cards[player] || []}
                    isFlipped={false}
                    onCardMove={handleCardMove}
                    onCardClick={handleCardClick}
                    onCardContext={(e,card,owner) => openCtx(e,card,owner)}
                    onBFDrop={handleBFDrop}
                  />
                </div>

                {/* LIFE TOTAL IN CORNER */}
                <LifeTotal
                  player={player}
                  value={gs.life[player]}
                  color={cfg.color}
                  cmdrDmg={gs.cmdrDmg[player]}
                  onAdj={d => gs.adjLife(player, d)}
                  onAdjCmdr={(from,d) => gs.adjCmdrDmg(from, player, d)}
                  corner={cfg.corner}
                />
              </div>
            )
          })}
        </div>

        {/* RIGHT PILES */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          <Pile player="Sam" zone="gy"    />
          <Pile player="Sam" zone="exile" />
          <Pile player="You" zone="gy"    />
          <Pile player="You" zone="exile" />
        </div>
      </div>

      {/* BOTTOM HUD */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'6px 10px', background:'#080808', borderTop:'1px solid #141414', flexShrink:0, minHeight:150 }}>

        {/* HAND */}
        <div style={{ flex:1, overflow:'hidden' }}>
          <Hand
            cards={gs.hand}
            onPlay={handlePlay}
            onDiscard={handleDiscard}
            onContextMenu={(e,card) => openCtx(e,card,'You',true)}
          />
        </div>

        {/* DECK */}
        <div
          data-pileowner="You" data-pilezone="library"
          onClick={() => setPanel({ type:'library' })}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, cursor:'pointer', flexShrink:0 }}
        >
          <div style={{ width:60, height:84, borderRadius:5, background:'#12102a', border:'1px solid #2a2050', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#2a2050' }}>✦</div>
          <div style={{ fontSize:8, color:'#2a2050' }}>{gs.deckCount} cards</div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
          <button onClick={() => { const c = gs.drawCard(); if(c) showToast('Drew '+c.name) }}
            style={{ padding:'6px 12px', borderRadius:5, border:'1px solid #3b82f6', background:'#2563eb', color:'#fff', fontSize:11, cursor:'pointer', fontWeight:600 }}>
            Draw
          </button>
          <button onClick={() => { gs.untapAll('You'); showToast('All permanents untapped') }}
            style={{ padding:'6px 12px', borderRadius:5, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:11, cursor:'pointer' }}>
            Untap All
          </button>
          <button onClick={() => setPanel({ type:'zone', player:'You', zone:'gy' })}
            style={{ padding:'6px 12px', borderRadius:5, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:11, cursor:'pointer' }}>
            Your GY
          </button>
          <button onClick={() => setPanel({ type:'zone', player:'You', zone:'cmd' })}
            style={{ padding:'6px 12px', borderRadius:5, border:'1px solid #3a2d6a', background:'#14102a', color:'#a78bfa', fontSize:11, cursor:'pointer' }}>
            CMD Zone
          </button>
        </div>
      </div>

      {/* ── OVERLAYS ── */}

      {/* CONTEXT MENU */}
      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          card={ctx.card} owner={ctx.owner}
          isHand={ctx.isHand} isMine={ctx.isMine}
          onAction={doCtxAction}
          onClose={() => setCtx(null)}
        />
      )}

      {/* ZONE PANEL */}
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

      {/* LIBRARY PANEL */}
      {panel?.type === 'library' && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:799 }} onClick={() => setPanel(null)} />
          <LibraryPanel
            count={gs.deckCount}
            library={gs.library}
            onDraw={n => { gs.drawFromLibrary(n); showToast(`Drew ${n} card${n>1?'s':''}`) }}
            onShuffle={() => { gs.shuffleLibrary(); showToast('Library shuffled') }}
            onLookTop={gs.lookAtTop}
            onBottomCard={gs.bottomCard}
            onClose={() => setPanel(null)}
          />
        </>
      )}

      {/* STACK */}
      {showStack && (
        <StackTracker
          stack={gs.stack} priority={gs.priority}
          onPass={() => { gs.passPriority(); showToast(`Priority passed`) }}
          onResolve={() => { gs.popStack(); showToast('Stack resolved') }}
          onClose={() => setShowStack(false)}
        />
      )}

      {/* SHARE */}
      {shareOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShareOpen(false)}>
          <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:12, padding:24, maxWidth:420, width:'90%' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:10 }}>🔗 Share this game</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderRadius:6, background:'#0d0d0d', border:'1px solid #2a2a2a', marginBottom:12 }}>
              <span style={{ fontSize:11, color:'#a78bfa', fontFamily:'monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {`https://mtg-app-three.vercel.app/?room=mtg-${Math.random().toString(36).substr(2,6)}`}
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Copied!'); setShareOpen(false) }}
                style={{ padding:'4px 12px', borderRadius:5, background:'#2563eb', border:'none', color:'#fff', fontSize:11, cursor:'pointer' }}>
                Copy
              </button>
            </div>
            <button onClick={() => setShareOpen(false)} style={{ width:'100%', padding:8, borderRadius:6, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#888', fontSize:12, cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', bottom:160, left:'50%', transform:'translateX(-50%)', background:'#111', border:'1px solid #2a2050', borderRadius:20, padding:'6px 18px', fontSize:11, color:'#a78bfa', zIndex:9000, pointerEvents:'none', whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
