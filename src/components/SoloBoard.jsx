import React, { useState, useRef, useEffect } from 'react'
import TokenPanel from './TokenPanel.jsx'
import CardModify from './CardModify.jsx'
import CommanderZone from './CommanderZone.jsx'
import ManaTracker from './ManaTracker.jsx'
import DiceRoller from './DiceRoller.jsx'
import DeckManager from './DeckManager.jsx'
import SideboardPanel from './SideboardPanel.jsx'
import ViewCard from './ViewCard.jsx'
import { getTokensForDeck } from '../utils/tokenRegistry.js'
import { shuffleCards, parseDeckFromText, cleanCardName } from '../utils/deckStorage.js'

// ── SCRYFALL IMAGE ─────────────────────────────────────────
const SF = (rawName, ver = 'normal') => {
  if (!rawName) return ''
  const name = rawName
    .replace(/\s*\([A-Z0-9a-z]+\)\s*\d*/g, '')
    .replace(/\s*\*CMDR\*/gi, '')
    .trim()
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=${ver}`
}

// ── DEFAULT DECK ────────────────────────────────────────────
const DEFAULT_DECK = `10 Forest
10 Mountain
1 Sol Ring
1 Command Tower
1 Llanowar Elves
1 Birds of Paradise
1 Azusa, Lost but Seeking
1 Oracle of Mul Daya
1 Scute Swarm
1 Lotus Cobra
1 Tireless Provisioner
1 Springheart Nantuko
1 Cultivate
1 Explore
1 Farseek
1 Skyshroud Claim
1 Splendid Reclamation
1 Crucible of Worlds
1 Valakut Exploration
1 Impact Tremors
1 Mina and Denn, Wildborn
1 Famished Worldsire
1 Arcane Signet
1 Amulet of Vigor`

const PHASES  = ['Untap','Upkeep','Draw','Main 1','Combat','Main 2','End']
const CSUBS   = ['Attackers','Blockers','Damage','Cleanup']
const POOL    = ['Forest','Mountain','Island','Swamp','Plains','Sol Ring','Llanowar Elves',
                 'Cultivate','Explore','Arcane Signet','Command Tower','Scute Swarm',
                 'Lotus Cobra','Beast Within','Cyclonic Rift','Craterhoof Behemoth']

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

function mkCard(name) {
  return { name, id: 'dk-'+name+'-'+Math.random().toString(36).substr(2,5) }
}

function parseDefault() {
  const cards = []
  for (const line of DEFAULT_DECK.split('\n').map(l=>l.trim()).filter(Boolean)) {
    const m = line.match(/^(\d+)\s+(.+)$/)
    if (m) for (let i=0;i<parseInt(m[1]);i++) cards.push(mkCard(m[2].trim()))
  }
  return cards
}

// ── CARD PREVIEW (bottom-right hover) ──────────────────────
function CardPreview({ name }) {
  const [err, setErr] = useState(false)
  if (!name) return null
  return (
    <div style={{
      position:'fixed',bottom:16,right:16,zIndex:7000,
      width:275,borderRadius:12,overflow:'hidden',
      boxShadow:'0 16px 48px rgba(0,0,0,.95)',
      border:'1px solid #444',pointerEvents:'none',
      animation:'previewIn .12s ease',
    }}>
      <style>{`@keyframes previewIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
      {!err
        ? <img src={SF(name)} alt={name} style={{width:'100%',display:'block'}} onError={()=>setErr(true)}/>
        : <div style={{background:'#1a1a2a',padding:12,fontSize:11,color:'#ccc'}}>{name}</div>
      }
    </div>
  )
}

// ── COUNTERS WIDGET ─────────────────────────────────────────
function CountersWidget({ poison, energy, exp, setPoison, setEnergy, setExp, onClose }) {
  const Btn = {padding:'1px 8px',border:'1px solid #222',borderRadius:3,background:'#0d0d0d',color:'#666',fontSize:12,cursor:'pointer'}
  return (
    <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:'#111',border:'1px solid #333',borderRadius:8,padding:12,zIndex:500,minWidth:200,boxShadow:'0 8px 24px rgba(0,0,0,.9)'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:600,color:'#e0e0e0'}}>Your Counters</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',cursor:'pointer'}}>✕</button>
      </div>
      {[['☠ Poison',poison,setPoison,10,'#4ade80'],['⚡ Energy',energy,setEnergy,999,'#fbbf24'],['✦ Experience',exp,setExp,999,'#a78bfa']].map(([lbl,val,set,warn,col])=>(
        <div key={lbl} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:5,background:'#1a1a1a',marginBottom:4}}>
          <span style={{fontSize:10,color:val>=warn?'#ef4444':col,flex:1}}>{lbl}</span>
          <button onClick={()=>set(v=>Math.max(0,v-1))} style={Btn}>−</button>
          <span style={{fontSize:14,fontWeight:700,color:val>=warn?'#ef4444':'#e0e0e0',minWidth:22,textAlign:'center'}}>{val}</span>
          <button onClick={()=>set(v=>v+1)} style={Btn}>+</button>
        </div>
      ))}
      {poison>=10&&<div style={{padding:'5px 8px',borderRadius:5,background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',fontSize:10,color:'#ef4444',marginTop:4}}>⚠ 10 poison — eliminated!</div>}
    </div>
  )
}

// ── ZONE CARD ────────────────────────────────────────────────
function ZoneCard({card, onHand, onBF, onLib}) {
  const [err, setErr] = useState(false)
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:3}}
      onMouseEnter={e=>e.currentTarget.style.background='#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{width:36,height:50,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333',background:'#0d1a0d'}}>
        {!err
          ? <img src={SF(card.name)} alt={card.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
          : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#555',textAlign:'center',padding:2}}>{card.name}</div>
        }
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
        {card.pt&&<div style={{fontSize:9,color:'#555',marginTop:1}}>{card.pt}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3,flexShrink:0}}>
        {onHand&&<button onClick={onHand} style={{padding:'2px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>→ Hand</button>}
        {onBF&&<button onClick={onBF} style={{padding:'2px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#555',fontSize:9,cursor:'pointer'}}>→ BF</button>}
        {onLib&&<button onClick={onLib} style={{padding:'2px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#444',fontSize:9,cursor:'pointer'}}>→ Lib</button>}
      </div>
    </div>
  )
}

// ── CONTEXT MENU ITEM ────────────────────────────────────────
function CM({onClick, children, danger}) {
  return (
    <div onClick={onClick}
      style={{padding:'7px 12px',fontSize:11,color:danger?'#777':'#888',cursor:'pointer',borderRadius:5,whiteSpace:'nowrap'}}
      onMouseEnter={e=>{e.currentTarget.style.background=danger?'#1a0808':'#222';e.currentTarget.style.color=danger?'#ef4444':'#e0e0e0'}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=danger?'#777':'#888'}}>
      {children}
    </div>
  )
}
function Sep() { return <div style={{borderTop:'1px solid #222',margin:'3px 0'}}/> }

const TB  = {padding:'3px 10px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#888',fontSize:12,cursor:'pointer'}
const AB  = {padding:'5px 10px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#ccc',fontSize:11,cursor:'pointer',whiteSpace:'nowrap'}
const ZP  = {padding:'4px 10px',borderRadius:20,border:'1px solid #222',background:'#1a1a1a',color:'#555',fontSize:10,cursor:'pointer',whiteSpace:'nowrap'}

// ════════════════════════════════════════════════════════════
// MAIN BOARD
// ════════════════════════════════════════════════════════════
export default function SoloBoard({ onBack, config }) {
  // ── DECK / ZONES ─────────────────────────────────────────
  const [library,   setLibrary]   = useState(() => shuffle(parseDefault()))
  const [hand,      setHand]      = useState([])
  const [bf,        setBF]        = useState([])
  const [gy,        setGY]        = useState([])
  const [exileZ,    setExileZ]    = useState([])
  const [cmdZ,      setCmdZ]      = useState([])
  const [sideboard, setSideboard] = useState([])

  // ── GAME STATE ───────────────────────────────────────────
  const [life,    setLife]    = useState(config?.startingLife || 40)
  const [poison,  setPoison]  = useState(0)
  const [energy,  setEnergy]  = useState(0)
  const [exp,     setExp]     = useState(0)
  const [turn,    setTurn]    = useState(1)
  const [phase,   setPhaseV]  = useState(3)
  const [csub,    setCsub]    = useState(null)

  // ── COMMANDER ────────────────────────────────────────────
  const [commander, setCommander] = useState(null) // {name, castCount, inZone}

  // ── STACK / LOG ──────────────────────────────────────────
  const [stack,    setStack]    = useState([])
  const [priority, setPriority] = useState('You')
  const [actLog,   setActLog]   = useState([])

  // ── MANA POOL ────────────────────────────────────────────
  const [manaPool, setManaPool] = useState({
    W:{normal:0,persistent:0}, U:{normal:0,persistent:0},
    B:{normal:0,persistent:0}, R:{normal:0,persistent:0},
    G:{normal:0,persistent:0}, C:{normal:0,persistent:0},
    S:{normal:0,persistent:0}, X:{normal:0,persistent:0},
  })

  // ── UI STATE ─────────────────────────────────────────────
  const [dragging,    setDragging]    = useState(null)
  const [imgErr,      setImgErr]      = useState({})
  const [hovered,     setHovered]     = useState(null)
  const [ctx,         setCtx]         = useState(null)
  const [bfCtx,       setBfCtx]       = useState(null)
  const [panel,       setPanel]       = useState(null)
  const [toast,       setToast]       = useState(null)
  const [modifyCard,  setModifyCard]  = useState(null)
  const [viewCardName,setViewCardName]= useState(null)
  const [showStack,   setShowStack]   = useState(false)
  const [showCtrs,    setShowCtrs]    = useState(false)
  const [showMana,    setShowMana]    = useState(false)
  const [showDice,    setShowDice]    = useState(false)
  const [showDecks,   setShowDecks]   = useState(false)
  const [showGrid,    setShowGrid]    = useState(false)
  const [gridSize,    setGridSize]    = useState(20)
  const [bfZoom,      setBfZoom]      = useState(1)
  const [libSearch,   setLibSearch]   = useState('')
  const [topCards,    setTopCards]    = useState([])
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [importTxt,   setImportTxt]   = useState('')

  const deckTokens = getTokensForDeck(
    [...new Set(library.map(c=>c.name).concat(hand.map(c=>c.name)))]
  )

  const bfRef    = useRef(null)
  const toastRef = useRef(null)
  const hDrag    = useRef(null)
  const bDrag    = useRef(null)

  useEffect(() => { drawN(7, true) }, [])

  // ── HELPERS ──────────────────────────────────────────────
  function log(text) { setActLog(l => [...l, {text, turn, time:Date.now()}]) }
  function t(msg) {
    setToast(msg); clearTimeout(toastRef.current)
    toastRef.current = setTimeout(()=>setToast(null), 2000)
  }
  function snap(v) { return showGrid ? Math.round(v/gridSize)*gridSize : v }

  // ── PHASE ────────────────────────────────────────────────
  function goPhase(i) {
    setPhaseV(i); setCsub(i===4?0:null); t(PHASES[i]); log(`Phase → ${PHASES[i]}`)
    // Clear temp mana on phase change
    setManaPool(p => {
      const next={}; Object.keys(p).forEach(k=>{next[k]={normal:0,persistent:p[k].persistent||0}}); return next
    })
  }

  // ── END TURN ─────────────────────────────────────────────
  function endTurn() {
    setBF(b=>b.map(c=>({...c,tapped:false,attacking:false,blocking:false,targeted:false})))
    setTurn(n=>n+1); setPhaseV(3); setCsub(null)
    drawN(1); log('End turn')
  }

  // ── DRAW ─────────────────────────────────────────────────
  function drawN(n, init=false) {
    setLibrary(lib => {
      if (lib.length===0) { if(!init) t('Library empty!'); return lib }
      const n2 = Math.min(n, lib.length)
      const drawn = lib.slice(0,n2).map(c=>({...c, id:'h-'+Date.now()+Math.random()}))
      setHand(h=>[...h,...drawn])
      if (!init) { t(`Drew ${n2}`); log(`Drew: ${drawn.map(c=>c.name).join(', ')}`) }
      return lib.slice(n2)
    })
  }

  function shuffleLib() { setLibrary(l=>shuffle(l)); t('Shuffled'); log('Library shuffled') }
  function lookTopN(n)  { setTopCards(library.slice(0,n)); setPanel('topN') }

  // ── LOAD DECK ────────────────────────────────────────────
  function loadDeck(deck) {
    const cards = shuffle(deck.cards || [])
    setLibrary(cards); setHand([]); setBF([]); setGY([]); setExileZ([]); setCmdZ([])
    setSideboard(deck.sideboard || [])
    setLife(config?.startingLife || 40)
    setPoison(0); setEnergy(0); setExp(0)
    setTurn(1); setPhaseV(3); setCsub(null)
    setStack([]); setPriority('You'); setActLog([])
    setCurrentDeckId(deck.id || null)
    if (deck.commander?.trim()) {
      setCommander({ name: deck.commander.trim(), castCount:0, inZone:true })
      t(`Commander: ${deck.commander}`)
      log(`Commander set: ${deck.commander}`)
    } else {
      setCommander(null)
    }
    setTimeout(()=>drawN(7,true), 50)
    t(`Loaded: ${deck.name}`)
  }

  // ── RESTART ──────────────────────────────────────────────
  function restart() {
    const fresh = shuffle(parseDefault())
    setLibrary(fresh); setHand([]); setBF([]); setGY([]); setExileZ([]); setCmdZ([])
    setLife(config?.startingLife || 40); setPoison(0); setEnergy(0); setExp(0)
    setTurn(1); setPhaseV(3); setCsub(null)
    setStack([]); setPriority('You'); setActLog([])
    setCommander(null)
    setTimeout(()=>drawN(7,true), 50)
    t('Game restarted')
  }

  // ── IMPORT (quick) ───────────────────────────────────────
  function quickImport() {
    if (!importTxt.trim()) { t('Paste a deck list first'); return }
    const parsed = parseDeckFromText(importTxt)
    if (parsed.main.length===0) { t('No cards found'); return }
    const cards = shuffle(parsed.main)
    setLibrary(cards); setHand([]); setBF([]); setGY([]); setExileZ([]); setCmdZ([])
    if (parsed.commander) {
      setCommander({name:parsed.commander, castCount:0, inZone:true})
      t(`Commander: ${parsed.commander}`)
    }
    setTimeout(()=>drawN(7,true), 50)
    setPanel(null); setImportTxt('')
    t(`Loaded ${parsed.main.length} cards`)
  }

  // ── PLAY FROM HAND ───────────────────────────────────────
  function playCard(handId, x, y) {
    const card = hand.find(c=>c.id===handId)
    if (!card) return
    setHand(h=>h.filter(c=>c.id!==handId))
    const newCard = {...card, id:'bf-'+Date.now(), x:Math.max(0,snap(x)), y:Math.max(0,snap(y)),
      tapped:false, attacking:false, blocking:false, targeted:false, counters:0, countersMap:{}}
    setBF(b=>[...b, newCard])
    t(card.name+' played'); log('Played: '+card.name)
  }

  // ── MOVE ON BF ───────────────────────────────────────────
  function moveBF(id, x, y) {
    const bfEl = bfRef.current
    const r = bfEl ? bfEl.getBoundingClientRect() : {width:800,height:400}
    const clampX = Math.max(0, Math.min(snap(x), r.width  - 95))
    const clampY = Math.max(0, Math.min(snap(y), r.height - 130))
    setBF(b=>b.map(c=>c.id===id ? {...c,x:clampX,y:clampY} : c))
  }

  // ── TAP ──────────────────────────────────────────────────
  function tap(id) {
    setBF(b=>b.map(c=>{
      if(c.id!==id) return c
      const next={...c,tapped:!c.tapped}
      log(`${c.name} ${next.tapped?'tapped':'untapped'}`); return next
    }))
  }

  // ── SEND TO ZONE ─────────────────────────────────────────
  function toZone(id, src, zone) {
    let card
    if (src==='hand')  { card=hand.find(c=>c.id===id);  setHand(h=>h.filter(c=>c.id!==id))  }
    else               { card=bf.find(c=>c.id===id);    setBF(b=>b.filter(c=>c.id!==id))    }
    if (!card) return
    // Tokens cease to exist — never go to any zone
    if (card.isToken) { t(`${card.name} token removed`); log(`${card.name} token ceased to exist`); return }
    // Commanders go to command zone by default when destroyed
    if ((card.isCommander || (commander && card.name===commander.name)) && zone==='gy') {
      setCommander(cm=>cm?{...cm,inZone:true}:cm)
      t(`${card.name} → command zone`); log(`Commander returned to cmd zone`); return
    }
    const entry = {...card, id:'z-'+Date.now()+Math.random()}
    if (zone==='gy')    setGY(z=>[...z,entry])
    if (zone==='exile') setExileZ(z=>[...z,entry])
    if (zone==='cmd')   setCmdZ(z=>[...z,entry])
    log(`${card.name} → ${zone}`)
  }

  // ── RETRIEVE FROM ZONE ───────────────────────────────────
  function retrieve(zone, idx, dest) {
    const arr = zone==='gy'?gy : zone==='exile'?exileZ : cmdZ
    const set  = zone==='gy'?setGY : zone==='exile'?setExileZ : setCmdZ
    const card = arr[idx]; if(!card) return
    set(z=>z.filter((_,i)=>i!==idx))
    if(dest==='hand') { setHand(h=>[...h,{...card,id:'r-'+Date.now()}]); t(card.name+' → hand') }
    if(dest==='bf')   { setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]); t(card.name+' → BF') }
    if(dest==='lib')  { setLibrary(l=>[...l,{...card,id:'lib-'+Date.now()}]); t(card.name+' → library') }
  }

  function retrieveLib(idx, dest) {
    const card=library[idx]; if(!card) return
    setLibrary(l=>l.filter((_,i)=>i!==idx))
    if(dest==='hand') { setHand(h=>[...h,{...card,id:'h-'+Date.now()}]); t(card.name+' → hand') }
    if(dest==='bf')   { setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]); t(card.name+' → BF') }
  }

  // ── ADD TOKEN ────────────────────────────────────────────
  function addToken(tok, qty=1) {
    const newCards=[]
    for(let i=0;i<qty;i++) {
      newCards.push({
        id:'tok-'+Date.now()+i+Math.random().toString(36).substr(2,4),
        name:tok.name, type:tok.type||'Token',
        col:'ca', art:tok.art||'◈', pt:tok.pt||'',
        x:80+Math.random()*250+i*12, y:40+Math.random()*100+i*8,
        tapped:false,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{},
        isToken:true, tokenScryfall:tok.scryfall||tok.name,
      })
    }
    setBF(b=>[...b,...newCards])
    t(`${qty}× ${tok.name}`); log(`Created ${qty}× ${tok.name} token${qty>1?'s':''}`)
  }

  // ── COMMANDER ACTIONS ────────────────────────────────────
  // CR 903.8: tax applies ONLY when cast from command zone
  function castCommander() {
    if (!commander) return
    const newCard = {
      id:'cmd-bf-'+Date.now(), name:commander.name,
      type:'Creature', col:'cg', art:'⬡', pt:'',
      x:200, y:80,
      tapped:false, attacking:false, blocking:false, targeted:false,
      counters:0, countersMap:{}, isCommander:true,
    }
    setBF(b=>[...b, newCard])
    setCommander(cm=>({...cm, castCount:cm.castCount+1, inZone:false}))
    const tax = commander.castCount * 2
    t(`${commander.name} cast${tax>0?` (tax +${tax})`:''}`)
    log(`Commander cast from zone, tax was +${tax}`)
  }

  function returnCommanderToZone() {
    setBF(b=>b.filter(c=>!c.isCommander))
    setCommander(cm=>cm?{...cm,inZone:true}:cm)
    t(`${commander?.name} → command zone`)
    log('Commander returned to command zone')
  }

  function commanderToBF() {
    // No tax — putting onto BF without casting
    const newCard = {
      id:'cmd-bf-'+Date.now(), name:commander.name,
      type:'Creature', col:'cg', art:'⬡', pt:'',
      x:200, y:80,
      tapped:false, attacking:false, blocking:false, targeted:false,
      counters:0, countersMap:{}, isCommander:true,
    }
    setBF(b=>[...b, newCard])
    setCommander(cm=>cm?{...cm,inZone:false}:cm)
    t(`${commander?.name} → BF (no tax)`)
  }

  function castCommanderFromHand() {
    // No tax — cast from hand (CR 903.8)
    const newCard = {
      id:'cmd-bf-'+Date.now(), name:commander.name,
      type:'Creature', col:'cg', art:'⬡', pt:'',
      x:200, y:80,
      tapped:false, attacking:false, blocking:false, targeted:false,
      counters:0, countersMap:{}, isCommander:true,
    }
    setBF(b=>[...b, newCard])
    setCommander(cm=>cm?{...cm,inZone:false}:cm)
    t(`${commander?.name} cast from hand (no tax)`)
    log('Commander cast from hand — no tax (CR 903.8)')
  }

  // ── STACK ────────────────────────────────────────────────
  function pushStack(item)  { setStack(s=>[...s,item]); log(`Stack: ${item.name} added`) }
  function popStack()       { setStack(s=>{if(s.length===0)return s; log(`Resolved: ${s[s.length-1].name}`); return s.slice(0,-1)}) }
  function passPriority()   { setPriority(p=>{const i=(['You']).indexOf(p);return 'You'}); t('Priority passed'); log('Priority passed') }
  function clearStack()     { setStack([]); log('Stack cleared') }

  // ── SIDEBOARD SWAP ───────────────────────────────────────
  function doSideboardSwap(sbCard, libCard) {
    setSideboard(sb=>sb.filter(c=>c.id!==sbCard.id))
    setLibrary(lib=>[...lib.filter(c=>c.id!==libCard.id), {...sbCard,id:'lib-'+Date.now()}])
    setPanel(null)
    t(`Swapped: ${sbCard.name} in, ${libCard.name} out`)
    log(`Sideboard swap: ${sbCard.name} ↔ ${libCard.name}`)
  }

  // ── UPDATE CARD ──────────────────────────────────────────
  function updateCardOnBF(id, updates) {
    setBF(b=>b.map(c=>c.id===id?{...c,...updates}:c))
  }

  // ── CONTEXT MENU ─────────────────────────────────────────
  function doCtx(action) {
    if (!ctx) return
    const {card, src} = ctx; setCtx(null)
    switch(action) {
      case 'tap':      tap(card.id); break
      case 'atk':      setBF(b=>b.map(c=>c.id===card.id?{...c,attacking:!c.attacking}:c)); log(`${card.name} ${card.attacking?'not':'now'} attacking`); break
      case 'blk':      setBF(b=>b.map(c=>c.id===card.id?{...c,blocking:!c.blocking}:c)); break
      case 'tgt':      setBF(b=>b.map(c=>({...c,targeted:c.id===card.id?!c.targeted:c.targeted}))); break
      case '+ctr':     setBF(b=>b.map(c=>c.id===card.id?{...c,counters:(c.counters||0)+1}:c)); break
      case '-ctr':     setBF(b=>b.map(c=>c.id===card.id?{...c,counters:Math.max(0,(c.counters||0)-1)}:c)); break
      case 'modify':   const mc=bf.find(c=>c.id===card.id); if(mc)setModifyCard(mc); break
      case 'view':     setViewCardName(card.name); break
      case 'copy':     const orig=bf.find(c=>c.id===card.id); if(orig)setBF(b=>[...b,{...orig,id:'copy-'+Date.now(),x:orig.x+12,y:orig.y+12}]); break
      case 'stack':    pushStack({id:'s-'+Date.now(),name:card.name,caster:'You',art:'🌊'}); break
      case 'hand':     const bcard=bf.find(c=>c.id===card.id); if(bcard){setBF(b=>b.filter(c=>c.id!==card.id));setHand(h=>[...h,{...bcard,id:'r-'+Date.now()}]);log(bcard.name+' → hand')}; break
      case 'top':      const btop=bf.find(c=>c.id===card.id); if(btop){setBF(b=>b.filter(c=>c.id!==card.id));setLibrary(l=>[{...btop,id:'lib-'+Date.now()},...l]);t(btop.name+' → top of library')}; break
      case 'bot':      const bbot=bf.find(c=>c.id===card.id); if(bbot){setBF(b=>b.filter(c=>c.id!==card.id));setLibrary(l=>[...l,{...bbot,id:'lib-'+Date.now()}]);t(bbot.name+' → bottom of library')}; break
      case 'cmd':      toZone(card.id,src,'cmd'); break
      case 'gy':       if(card.isToken){setBF(b=>b.filter(c=>c.id!==card.id));log(`${card.name} token ceased to exist`);t('Token removed')}else toZone(card.id,src,'gy'); break
      case 'exile':    if(card.isToken){setBF(b=>b.filter(c=>c.id!==card.id));log(`${card.name} token ceased to exist`);t('Token removed')}else toZone(card.id,src,'exile'); break
      case 'destroy':  if(card.isToken){setBF(b=>b.filter(c=>c.id!==card.id));log(`${card.name} token ceased to exist`);t('Token removed')}else toZone(card.id,src,'gy'); break
    }
  }

  // ── DRAG: HAND → BF ──────────────────────────────────────
  function handDown(e, card) {
    if (e.button!==0) return; e.preventDefault()
    hDrag.current = {card, moved:false, sx:e.clientX, sy:e.clientY}
    const g = mkGhost(e.clientX-46, e.clientY-64, card.name)
    document.body.appendChild(g)
    function mv(me) {
      g.style.left=(me.clientX-46)+'px'; g.style.top=(me.clientY-64)+'px'
      if(Math.abs(me.clientX-e.clientX)>4||Math.abs(me.clientY-e.clientY)>4) hDrag.current.moved=true
      const bfEl=bfRef.current
      if(bfEl){const r=bfEl.getBoundingClientRect();const ov=me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom;bfEl.style.outline=ov?'2px solid #a78bfa':''}
    }
    function up(me) {
      window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up)
      g.remove(); if(bfRef.current)bfRef.current.style.outline=''
      if (!hDrag.current?.moved) { hDrag.current=null; return }
      const bfEl=bfRef.current
      if (bfEl) {
        const r=bfEl.getBoundingClientRect()
        if(me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom) {
          playCard(card.id, (me.clientX-r.left-46)/bfZoom, (me.clientY-r.top-64)/bfZoom)
        }
      }
      hDrag.current=null
    }
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up)
  }

  // ── DRAG: BF → BF/PILE ───────────────────────────────────
  function bfDown(e, card) {
    if (e.button!==0) return; e.preventDefault(); e.stopPropagation()
    const bfEl=bfRef.current; if(!bfEl) return
    const r=bfEl.getBoundingClientRect()
    const offX=(e.clientX-r.left)/bfZoom-card.x
    const offY=(e.clientY-r.top)/bfZoom-card.y
    bDrag.current={card,moved:false,sx:e.clientX,sy:e.clientY,offX,offY}
    setDragging(card.id)
    const g=mkGhost(e.clientX-offX*bfZoom, e.clientY-offY*bfZoom, card.name)
    document.body.appendChild(g)
    function mv(me) {
      g.style.left=(me.clientX-offX*bfZoom)+'px'; g.style.top=(me.clientY-offY*bfZoom)+'px'
      if(Math.abs(me.clientX-e.clientX)>3||Math.abs(me.clientY-e.clientY)>3) bDrag.current.moved=true
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        const ov=me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom
        p.style.borderColor=ov?'#a78bfa':''; p.style.background=ov?'rgba(167,139,250,.1)':''
      })
    }
    function up(me) {
      window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up)
      g.remove(); setDragging(null)
      document.querySelectorAll('[data-pile]').forEach(p=>{p.style.borderColor='';p.style.background=''})
      if(!bDrag.current?.moved) { tap(card.id); bDrag.current=null; return }
      let onPile=false
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        if(me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom){
          toZone(card.id,'bf',p.dataset.pile); onPile=true
        }
      })
      if(!onPile){
        const r2=bfRef.current?.getBoundingClientRect()
        if(r2) moveBF(card.id,(me.clientX-r2.left)/bfZoom-offX,(me.clientY-r2.top)/bfZoom-offY)
      }
      bDrag.current=null
    }
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up)
  }

  function mkGhost(left, top, name) {
    const g=document.createElement('div')
    g.style.cssText=`position:fixed;pointer-events:none;z-index:9999;width:92px;height:128px;border-radius:7px;border:2px solid #a78bfa;box-shadow:0 12px 32px rgba(0,0,0,.9);background:#0d1a0d;overflow:hidden;opacity:.9;transform:rotate(3deg) scale(1.04);left:${left}px;top:${top}px;`
    const img=document.createElement('img')
    img.src=SF(name); img.style.cssText='width:100%;height:100%;object-fit:cover;'
    img.onerror=()=>{g.innerHTML=`<div style="color:#aaa;font-size:9px;padding:4px;text-align:center;margin-top:50px">${name}</div>`}
    g.appendChild(img); return g
  }

  // ── LIFE / COLORS ─────────────────────────────────────────
  const lifeCol = life<=10?'#ef4444':life<=20?'#f59e0b':'#e0e0e0'

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#1a1a1a',overflow:'hidden',fontFamily:'system-ui,sans-serif',color:'#e0e0e0',userSelect:'none'}}>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:0,padding:'0 8px',background:'#111',borderBottom:'1px solid #333',flexShrink:0,height:42}}>

        {/* LIFE + COUNTERS */}
        <div style={{display:'flex',alignItems:'center',gap:4,position:'relative'}}>
          <button onClick={()=>setLife(l=>Math.max(0,l-1))} style={TB}>−</button>
          <span style={{fontSize:20,fontWeight:700,color:lifeCol,minWidth:34,textAlign:'center'}}>{life}</span>
          <button onClick={()=>setLife(l=>l+1)} style={TB}>+</button>
          <div style={{width:1,height:22,background:'#333',margin:'0 4px'}}/>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowCtrs(s=>!s)} style={{...TB,fontSize:11,padding:'3px 8px'}}>
              Counters{poison>0&&<span style={{color:'#4ade80',marginLeft:2}}>{poison}☠</span>} ▾
            </button>
            {showCtrs&&<CountersWidget poison={poison} energy={energy} exp={exp} setPoison={setPoison} setEnergy={setEnergy} setExp={setExp} onClose={()=>setShowCtrs(false)}/>}
          </div>
          <div style={{width:1,height:22,background:'#333',margin:'0 4px'}}/>
          <span style={{fontSize:11,color:'#777'}}>Turn <b style={{color:'#e0e0e0'}}>{turn}</b></span>
        </div>

        {/* PHASE BAR */}
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'0 8px'}}>
          {PHASES.map((p,i)=>(
            <React.Fragment key={p}>
              <div onClick={()=>goPhase(i)} style={{padding:'3px 8px',fontSize:9,borderRadius:3,cursor:'pointer',textTransform:'uppercase',letterSpacing:'.05em',color:phase===i?'#fff':phase>i?'#444':'#2a2a2a',background:phase===i?'#2563eb':'transparent',transition:'all .1s'}}>
                {p}
              </div>
              {i<PHASES.length-1&&<span style={{color:'#222',fontSize:10}}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* RIGHT ACTIONS */}
        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'nowrap'}}>
          <button onClick={()=>setShowStack(s=>!s)} style={{...AB,borderColor:showStack?'#2a2050':'#333',color:showStack?'#a78bfa':'#ccc'}}>⚡ Stack{stack.length>0&&` (${stack.length})`}</button>
          <button onClick={restart} style={AB}>Restart</button>
          <button onClick={()=>setPanel('tokens')} style={AB}>Add Token ▾</button>
          <button onClick={shuffleLib} style={AB}>Shuffle</button>
          <button onClick={()=>lookTopN(1)} style={AB}>Top Card</button>
          <button onClick={()=>setPanel('lib')} style={AB}>Library</button>
          <button onClick={()=>setShowMana(s=>!s)} style={{...AB,borderColor:showMana?'#1a4a2a':'#333',color:showMana?'#4ade80':'#ccc'}}>🔮 Mana</button>
          <button onClick={()=>setShowDice(s=>!s)} style={AB}>🎲 Dice</button>
          <button onClick={()=>setShowDecks(true)} style={AB}>📚 Decks</button>
          <div style={{display:'flex',gap:0,border:'1px solid #333',borderRadius:4,overflow:'hidden'}}>
            <button onClick={()=>setShowGrid(s=>!s)} style={{...AB,border:'none',borderRadius:0,borderRight:'1px solid #222',color:showGrid?'#a78bfa':'#555',padding:'5px 8px'}}>{showGrid?'⊞ Grid':'⊟ Grid'}</button>
            {showGrid&&<select value={gridSize} onChange={e=>setGridSize(Number(e.target.value))} style={{background:'#1a1a1a',border:'none',color:'#a78bfa',fontSize:10,padding:'0 4px',cursor:'pointer',outline:'none'}}><option value={10}>10</option><option value={20}>20</option><option value={40}>40</option><option value={60}>60</option></select>}
          </div>
          <button onClick={()=>setBfZoom(z=>Math.min(2,+(z+.1).toFixed(1)))} style={{...AB,padding:'5px 7px'}}>🔍+</button>
          <span style={{fontSize:10,color:'#444',minWidth:28,textAlign:'center'}}>{Math.round(bfZoom*100)}%</span>
          <button onClick={()=>setBfZoom(z=>Math.max(.5,+(z-.1).toFixed(1)))} style={{...AB,padding:'5px 7px'}}>🔍−</button>
          <button onClick={()=>setBfZoom(1)} style={{...AB,padding:'5px 7px',fontSize:9}}>1:1</button>
          <button onClick={endTurn} style={{...AB,background:'#2563eb',border:'1px solid #3b82f6',color:'#fff',fontWeight:600}}>Next Turn</button>
        </div>
      </div>

      {/* COMBAT SUB-PHASES */}
      {phase===4&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'2px 8px',background:'#0d0d0d',borderBottom:'1px solid #222',flexShrink:0}}>
          <span style={{fontSize:8,color:'#555',marginRight:6,textTransform:'uppercase',letterSpacing:'.06em'}}>Combat ›</span>
          {CSUBS.map((s,i)=>(
            <React.Fragment key={s}>
              <div onClick={()=>setCsub(i)} style={{padding:'2px 8px',fontSize:8,borderRadius:3,cursor:'pointer',textTransform:'uppercase',color:csub===i?'#a78bfa':'#333',background:csub===i?'#14102a':'transparent',border:csub===i?'1px solid #3a2d6a':'1px solid transparent'}}>{s}</div>
              {i<3&&<span style={{color:'#222',fontSize:9}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* BATTLEFIELD */}
      <div
        ref={bfRef}
        style={{flex:1,position:'relative',overflow:'hidden',background:'#141414',cursor:'default',minHeight:0}}
        onClick={()=>{setCtx(null);setBfCtx(null);setShowCtrs(false)}}
        onContextMenu={e=>{if(e.target===bfRef.current||e.target.dataset.bfbg){e.preventDefault();setBfCtx({x:e.clientX,y:e.clientY})}}}
      >
        {/* ZOOM + GRID CONTAINER */}
        <div style={{
          position:'absolute', top:0, left:0,
          width:`${100/bfZoom}%`, height:`${100/bfZoom}%`,
          transform:`scale(${bfZoom})`, transformOrigin:'top left',
        }}>
          {showGrid&&<div style={{position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)`,backgroundSize:`${gridSize}px ${gridSize}px`,pointerEvents:'none',zIndex:1}}/>}

          {/* EMPTY STATE */}
          {bf.length===0&&(
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:6,pointerEvents:'none'}}>
              <div style={{fontSize:13,color:'#1e1e1e'}}>Drag cards from your hand to play them</div>
              <div style={{fontSize:10,color:'#181818'}}>Click to tap · Right-click for options · Drag to reposition</div>
            </div>
          )}

          {/* BATTLEFIELD CARDS */}
          {bf.map(card=>{
            const err=imgErr[card.id]
            const bc=card.targeted?'#60a5fa':card.attacking?'#ef4444':card.blocking?'#f59e0b':'#3a3a3a'
            return (
              <div key={card.id}
                data-bfbg="1"
                onMouseDown={e=>bfDown(e,card)}
                onMouseEnter={()=>setHovered(card.name)}
                onMouseLeave={()=>setHovered(null)}
                onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,card,src:'bf'})}}
                style={{
                  position:'absolute',left:card.x,top:card.y,width:92,height:128,
                  borderRadius:7,border:`1.5px solid ${bc}`,background:'#0d1a0d',
                  cursor:'grab',overflow:'hidden',
                  transform:card.tapped?'rotate(15deg)':'none',transformOrigin:'50% 85%',
                  opacity:dragging===card.id?0.2:1,
                  zIndex:card.attacking?50:10,
                  boxShadow:card.attacking?'0 0 0 2px rgba(239,68,68,.35),0 4px 14px rgba(0,0,0,.7)':card.targeted?'0 0 0 2px rgba(96,165,250,.35)':'0 3px 10px rgba(0,0,0,.7)',
                  userSelect:'none',transition:'opacity .1s',
                }}>
                {!err
                  ? <img src={SF(card.tokenScryfall||card.name)} alt={card.name} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}} onError={()=>setImgErr(p=>({...p,[card.id]:true}))}/>
                  : <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:4}}><div style={{fontSize:8,color:'#aaa',textAlign:'center',lineHeight:1.3}}>{card.name}</div>{card.pt&&<div style={{fontSize:9,fontWeight:700,color:'#ccc',marginTop:3}}>{card.pt}</div>}</div>
                }
                {/* COUNTER BADGES */}
                {(card.counters||0)>0&&!card.countersMap&&(
                  <div style={{position:'absolute',top:-5,left:-5,width:18,height:18,borderRadius:'50%',background:'#2563eb',border:'2px solid #141414',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5}}>{card.counters}</div>
                )}
                {card.countersMap&&Object.entries(card.countersMap).filter(([,v])=>v>0).map(([k,v])=>(
                  <div key={k} style={{position:'absolute',top:-6,left:-6,minWidth:17,height:17,borderRadius:9,background:'#2563eb',border:'2px solid #141414',fontSize:7,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5,padding:'0 3px'}}>{v}</div>
                ))}
                {/* CUSTOM P/T */}
                {(card.customPower||card.customToughness)&&(
                  <div style={{position:'absolute',bottom:3,right:3,fontSize:9,fontWeight:700,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,1)',background:'rgba(37,99,235,.7)',borderRadius:3,padding:'0 4px',border:'1px solid rgba(59,130,246,.5)'}}>{card.customPower||'?'}/{card.customToughness||'?'}</div>
                )}
                {card.pt&&!card.customPower&&!err&&<div style={{position:'absolute',bottom:3,right:3,fontSize:8,fontWeight:700,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,1)',background:'rgba(0,0,0,.45)',borderRadius:3,padding:'0 3px'}}>{card.pt}</div>}
                {card.isToken&&<div style={{position:'absolute',top:2,right:2,fontSize:6,padding:'1px 3px',borderRadius:3,background:'rgba(124,58,237,.7)',color:'#e0e0e0'}}>TOKEN</div>}
                {card.sick&&<div style={{position:'absolute',bottom:18,left:'50%',transform:'translateX(-50%)',fontSize:7,padding:'1px 4px',borderRadius:3,background:'rgba(107,114,128,.7)',color:'#e0e0e0',whiteSpace:'nowrap'}}>SICK</div>}
                {card.note&&<div style={{position:'absolute',top:0,left:0,right:0,background:'rgba(0,0,0,.8)',fontSize:6,color:'#fbbf24',padding:'2px 4px',lineHeight:1.3,borderRadius:'6px 6px 0 0',overflow:'hidden',maxHeight:28}}>{card.note}</div>}
                {card.attacking&&<div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'#ef4444',filter:'drop-shadow(0 0 4px rgba(239,68,68,.8))'}}>⚔</div>}
              </div>
            )
          })}
        </div>{/* end zoom container */}
      </div>{/* end battlefield */}

      {/* BOTTOM AREA: hand + zone pills */}
      <div style={{background:'#111',borderTop:'1px solid #333',flexShrink:0,paddingRight:commander?164:0,transition:'padding-right .15s'}}>
        {/* HAND ROW */}
        <div style={{display:'flex',alignItems:'flex-end',gap:6,padding:'10px 12px 8px',overflowX:'auto',overflowY:'visible',minHeight:220}}>
          {hand.map(card=>{
            const err=imgErr[card.id+'h']
            return (
              <div key={card.id}
                onMouseDown={e=>handDown(e,card)}
                onMouseEnter={e=>{setHovered(card.name);e.currentTarget.style.transform='translateY(-18px)';e.currentTarget.style.borderColor='#a78bfa'}}
                onMouseLeave={e=>{setHovered(null);e.currentTarget.style.transform='';e.currentTarget.style.borderColor='#3a3a3a'}}
                onContextMenu={e=>{e.preventDefault();setCtx({x:e.clientX,y:e.clientY,card,src:'hand'})}}
                style={{flexShrink:0,width:138,height:193,borderRadius:8,border:'1.5px solid #3a3a3a',background:'#0d1a0d',cursor:'grab',overflow:'hidden',position:'relative',transition:'transform .12s,border-color .1s',boxShadow:'0 3px 10px rgba(0,0,0,.7)'}}>
                {!err
                  ? <img src={SF(card.name)} alt={card.name} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}} onError={()=>setImgErr(p=>({...p,[card.id+'h']:true}))}/>
                  : <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:6}}><div style={{fontSize:9,color:'#aaa',textAlign:'center',lineHeight:1.4}}>{card.name}</div></div>
                }
              </div>
            )
          })}
          {hand.length===0&&<div style={{fontSize:11,color:'#2a2a2a',padding:'0 8px',alignSelf:'center'}}>Hand is empty</div>}
        </div>

        {/* ZONE PILLS */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px 6px',borderTop:'1px solid #222',flexWrap:'wrap'}}>
          <div onClick={()=>setPanel('hand-view')} style={{...ZP,color:hand.length>0?'#aaa':'#555'}}>Hand ({hand.length})</div>
          <div onClick={()=>setPanel('lib')} style={ZP}>Library ({library.length})</div>
          <div onClick={()=>setPanel('gy')} style={{...ZP,color:gy.length>0?'#aaa':'#555'}}>Graveyard ({gy.length})</div>
          <div onClick={()=>setPanel('exile')} style={{...ZP,color:exileZ.length>0?'#aaa':'#555'}}>Exile ({exileZ.length})</div>
          {cmdZ.length>0&&<div onClick={()=>setPanel('cmd')} style={{...ZP,color:'#a78bfa'}}>Command ({cmdZ.length})</div>}
          {sideboard.length>0&&<div onClick={()=>setPanel('sideboard')} style={{...ZP,color:'#f59e0b'}}>Sideboard ({sideboard.length})</div>}
          <div onClick={()=>drawN(1)} style={{...ZP,color:'#60a5fa',borderColor:'#1a2a4a'}}>Draw</div>
        </div>
      </div>

      {/* COMMANDER PANEL — fixed bottom-right */}
      {commander&&(
        <CommanderZone
          commander={commander}
          onCastFromZone={castCommander}
          onReturnToZone={returnCommanderToZone}
          onPutOntoBF={commanderToBF}
          onCastFromHand={castCommanderFromHand}
          onContextMenu={e=>{
            if(!commander)return; e.preventDefault()
            const fc={id:'commander',name:commander.name,isCommander:true,type:'Creature',col:'cg',art:'⬡',pt:''}
            setCtx({x:e.clientX,y:e.clientY,card:fc,src:'cmd'})
          }}
        />
      )}

      {/* CARD HOVER PREVIEW */}
      <CardPreview name={hovered}/>

      {/* ── OVERLAYS ── */}

      {/* MANA TRACKER */}
      {showMana&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:5998,background:'rgba(0,0,0,.3)'}} onClick={()=>setShowMana(false)}/>
          <div style={{position:'fixed',right:0,top:42,bottom:0,width:300,zIndex:5999,display:'flex',flexDirection:'column',boxShadow:'-4px 0 24px rgba(0,0,0,.8)',animation:'manaIn .2s ease'}}>
            <style>{`@keyframes manaIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <ManaTracker manaPool={manaPool} onPoolChange={setManaPool} onClose={()=>setShowMana(false)}/>
          </div>
        </>
      )}

      {/* DICE ROLLER */}
      {showDice&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:5999}} onClick={()=>setShowDice(false)}/>
          <DiceRoller onClose={()=>setShowDice(false)} onLog={log}/>
        </>
      )}

      {/* DECK MANAGER */}
      {showDecks&&<DeckManager currentDeckId={currentDeckId} onLoad={loadDeck} onClose={()=>setShowDecks(false)}/>}

      {/* STACK TRACKER */}
      {showStack&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:6999}} onClick={()=>setShowStack(false)}/>
          <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:380,background:'#111',border:'1px solid #2a2050',borderRadius:12,zIndex:7000,boxShadow:'0 16px 48px rgba(0,0,0,.9)',display:'flex',flexDirection:'column',maxHeight:'80vh'}}>
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:600,color:'#e0e0e0',flex:1}}>⚡ Stack & Priority</span>
              <button onClick={()=>setShowStack(false)} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:'10px 16px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:6,background:'#0d0a1e',border:'1px solid #2a2050'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#a78bfa'}}/>
                <span style={{fontSize:11,color:'#888',flex:1}}>Priority: <b style={{color:'#a78bfa'}}>{priority}</b></span>
                <button onClick={passPriority} style={{padding:'3px 10px',borderRadius:4,border:'1px solid #2a2050',background:'#14102a',color:'#a78bfa',fontSize:10,cursor:'pointer'}}>Pass →</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px 16px'}}>
              <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>The Stack ({stack.length})</div>
              {stack.length===0?<div style={{textAlign:'center',padding:'16px 0',fontSize:11,color:'#1e1e1e'}}>Stack is empty</div>
                :[...stack].reverse().map((item,i)=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:6,background:i===0?'#0d1628':'#111',border:`1px solid ${i===0?'#1e3a6e':'#1a1a1a'}`,marginBottom:4}}>
                    <span style={{fontSize:13}}>{item.art||'🌊'}</span>
                    <div style={{flex:1}}><div style={{fontSize:11,color:'#ccc'}}>{item.name}</div><div style={{fontSize:9,color:'#444'}}>{item.caster}</div></div>
                    {i===0&&<span style={{fontSize:8,color:'#60a5fa'}}>TOP</span>}
                  </div>
                ))
              }
              {/* ADD TO STACK */}
              <div style={{marginTop:8,display:'flex',gap:6}}>
                {(() => {
                  const [stackInput, setStackInput] = React.useState('')
                  return <>
                    <input value={stackInput} onChange={e=>setStackInput(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&stackInput.trim()&&(pushStack({id:'s-'+Date.now(),name:stackInput.trim(),caster:'You',art:'🌊'}),setStackInput(''))}
                      placeholder="Add to stack..." style={{flex:1,padding:'6px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'inherit'}}/>
                    <button onClick={()=>{if(stackInput.trim()){pushStack({id:'s-'+Date.now(),name:stackInput.trim(),caster:'You',art:'🌊'});setStackInput('')}}} style={{padding:'6px 10px',borderRadius:5,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:11,cursor:'pointer'}}>Add</button>
                  </>
                })()}
              </div>
              {stack.length>0&&<div style={{display:'flex',gap:6,marginTop:8}}><button onClick={popStack} style={{flex:1,padding:'7px 0',borderRadius:5,background:'#2563eb',border:'none',color:'#fff',fontSize:11,cursor:'pointer',fontWeight:600}}>Resolve top</button><button onClick={clearStack} style={{padding:'7px 12px',borderRadius:5,border:'1px solid #1a1a1a',background:'#111',color:'#444',fontSize:11,cursor:'pointer'}}>Clear all</button></div>}
            </div>
          </div>
        </>
      )}

      {/* VIEW CARD */}
      {viewCardName&&<ViewCard cardName={viewCardName} onClose={()=>setViewCardName(null)}/>}

      {/* CARD MODIFY */}
      {modifyCard&&<CardModify card={modifyCard} onUpdate={(id,updates)=>{updateCardOnBF(id,updates);t('Card updated')}} onClose={()=>setModifyCard(null)}/>}

      {/* CONTEXT MENU */}
      {ctx&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={()=>setCtx(null)}/>
          <div style={{position:'fixed',left:Math.min(ctx.x,window.innerWidth-195),top:Math.min(ctx.y,window.innerHeight-440),background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:4,zIndex:9999,minWidth:195,boxShadow:'0 8px 32px rgba(0,0,0,.9)'}}>
            <div style={{fontSize:9,color:'#555',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #222',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ctx.card.name}</div>

            {/* HAND CARD OPTIONS */}
            {ctx.src==='hand'&&<>
              <CM onClick={()=>{const c=hand.find(x=>x.id===ctx.card.id);if(c){setHand(h=>h.filter(x=>x.id!==c.id));setBF(b=>[...b,{...c,id:'bf-'+Date.now(),x:100+Math.random()*200,y:60+Math.random()*80,tapped:false,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]);t(c.name+' → BF')};setCtx(null)}}>→ Move to Battlefield</CM>
              <CM onClick={()=>{const c=hand.find(x=>x.id===ctx.card.id);if(c){setHand(h=>h.filter(x=>x.id!==c.id));setBF(b=>[...b,{...c,id:'bf-'+Date.now(),x:100+Math.random()*200,y:60+Math.random()*80,tapped:true,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]);t(c.name+' → BF Tapped')};setCtx(null)}}>→ Move to BF Tapped</CM>
              <CM onClick={()=>{const c=hand.find(x=>x.id===ctx.card.id);if(c){setHand(h=>h.filter(x=>x.id!==c.id));setBF(b=>[...b,{...c,id:'bf-'+Date.now(),x:100+Math.random()*200,y:60+Math.random()*80,tapped:false,flipped:true,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]);t(c.name+' → BF Flipped')};setCtx(null)}}>→ Move to BF Flipped</CM>
              <Sep/>
              <CM onClick={()=>{const c=hand.find(x=>x.id===ctx.card.id);if(c){setHand(h=>h.filter(x=>x.id!==c.id));setLibrary(l=>[{...c,id:'lib-'+Date.now()},...l]);t(c.name+' → top of library')};setCtx(null)}}>📚 Top of Library</CM>
              <CM onClick={()=>{const c=hand.find(x=>x.id===ctx.card.id);if(c){setHand(h=>h.filter(x=>x.id!==c.id));setLibrary(l=>[...l,{...c,id:'lib-'+Date.now()}]);t(c.name+' → bottom')};setCtx(null)}}>📚 Bottom of Library</CM>
              <Sep/>
              <CM onClick={()=>doCtx('gy')}>☠ Move to Graveyard</CM>
              <CM onClick={()=>doCtx('exile')}>✦ Move to Exile</CM>
              <CM onClick={()=>doCtx('cmd')}>⬡ Command zone</CM>
              <Sep/>
              <CM onClick={()=>{setViewCardName(ctx.card.name);setCtx(null)}}>🔍 View Card</CM>
            </>}

            {/* BATTLEFIELD CARD OPTIONS */}
            {ctx.src==='bf'&&<>
              <CM onClick={()=>doCtx('tap')}>↻ Tap / Untap</CM>
              <CM onClick={()=>{setBF(b=>b.map(x=>x.id===ctx.card.id?{...x,tapped:true}:x));setCtx(null);t('Tapped')}}>↻ Move to BF Tapped</CM>
              <CM onClick={()=>doCtx('atk')}>⚔ Declare attacker</CM>
              <CM onClick={()=>doCtx('blk')}>🛡 Declare blocker</CM>
              <CM onClick={()=>doCtx('tgt')}>◎ Target</CM>
              <Sep/>
              <CM onClick={()=>doCtx('+ctr')}>＋ Add +1/+1 counter</CM>
              <CM onClick={()=>doCtx('-ctr')}>－ Remove counter</CM>
              <CM onClick={()=>doCtx('modify')}>✏ Modify card</CM>
              <CM onClick={()=>doCtx('copy')}>⎘ Copy / Token</CM>
              <CM onClick={()=>doCtx('stack')}>⚡ Add to stack</CM>
              <Sep/>
              <CM onClick={()=>doCtx('hand')}>✋ Return to hand</CM>
              <CM onClick={()=>doCtx('top')}>📚 Top of library</CM>
              <CM onClick={()=>doCtx('bot')}>📚 Bottom of library</CM>
              <CM onClick={()=>doCtx('cmd')}>⬡ Command zone</CM>
              <Sep/>
              <CM onClick={()=>doCtx('gy')}>☠ To graveyard</CM>
              <CM onClick={()=>doCtx('exile')}>✦ Exile</CM>
              <CM onClick={()=>{setViewCardName(ctx.card.name);setCtx(null)}}>🔍 View Card</CM>
              <Sep/>
              <CM danger onClick={()=>doCtx('destroy')}>✕ Destroy</CM>
            </>}
          </div>
        </>
      )}

      {/* BATTLEFIELD RIGHT-CLICK */}
      {bfCtx&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9997}} onClick={()=>setBfCtx(null)}/>
          <div style={{position:'fixed',left:Math.min(bfCtx.x,window.innerWidth-200),top:Math.min(bfCtx.y,window.innerHeight-240),background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:4,zIndex:9998,minWidth:195,boxShadow:'0 8px 32px rgba(0,0,0,.9)'}}>
            <div style={{fontSize:9,color:'#555',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #222',marginBottom:2}}>Battlefield</div>
            <CM onClick={()=>{setBF([]);setGY(g=>[...g,...bf.filter(c=>!c.isToken)]);setBfCtx(null);t('All → GY')}}>☠ Move All to Graveyard</CM>
            <CM onClick={()=>{setBF([]);setHand(h=>[...h,...bf.filter(c=>!c.isToken).map(c=>({...c,id:'h-'+Date.now()+Math.random()}))]);setBfCtx(null);t('All → hand')}}>✋ Move All to Hand</CM>
            <CM onClick={()=>{setBF(b=>b.map(c=>({...c,tapped:false})));setBfCtx(null);t('All untapped')}}>↻ Untap All</CM>
            <CM onClick={()=>{setBF(b=>b.map(c=>({...c,attacking:false,blocking:false,targeted:false})));setBfCtx(null);t('Combat cleared')}}>⚔ Clear Combat</CM>
          </div>
        </>
      )}

      {/* SLIDE-IN PANELS */}
      {panel&&!['tokens'].includes(panel)&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:360,background:'#111',borderLeft:'1px solid #333',display:'flex',flexDirection:'column',zIndex:801,animation:'sIn .2s ease'}}>
            <style>{`@keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #222',flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:600,flex:1,color:'#e0e0e0'}}>
                {panel==='hand-view'?`Hand (${hand.length})`:panel==='gy'?`Graveyard (${gy.length})`:panel==='exile'?`Exile (${exileZ.length})`:panel==='cmd'?`Command Zone (${cmdZ.length})`:panel==='lib'?`Library (${library.length})`:panel==='topN'?'Top of Library':panel==='import'?'Import Deck':panel==='sideboard'?`Sideboard (${sideboard.length})`:'Zone'}
              </span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>

            {['gy','exile','cmd'].includes(panel)&&(
              <div style={{display:'flex',borderBottom:'1px solid #222',flexShrink:0}}>
                {[{k:'gy',l:'Graveyard'},{k:'exile',l:'Exile'},{k:'cmd',l:'Command'}].map(({k,l})=>(
                  <div key={k} onClick={()=>setPanel(k)} style={{flex:1,padding:'7px 0',textAlign:'center',fontSize:11,cursor:'pointer',color:panel===k?'#a78bfa':'#555',borderBottom:panel===k?'2px solid #a78bfa':'2px solid transparent'}}>{l}</div>
                ))}
              </div>
            )}

            <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>

              {/* HAND VIEW */}
              {panel==='hand-view'&&(hand.length===0
                ? <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Hand is empty</div>
                : hand.map((card,i)=>(
                  <ZoneCard key={card.id} card={card}
                    onHand={()=>{}}
                    onBF={()=>{setHand(h=>h.filter(c=>c.id!==card.id));setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:80,y:80,tapped:false,attacking:false,blocking:false,targeted:false,counters:0,countersMap:{}}]);t(card.name+' → BF')}}
                    onLib={()=>{setHand(h=>h.filter(c=>c.id!==card.id));setLibrary(l=>[...l,{...card,id:'lib-'+Date.now()}]);t(card.name+' → library')}}
                  />
                ))
              )}

              {/* IMPORT */}
              {panel==='import'&&(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>Use <b style={{color:'#a78bfa'}}>📚 Decks</b> in the top bar to save and manage decks, or paste a quick deck list here:</div>
                  <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)} placeholder={'1 Sol Ring\n1 Command Tower\n10 Forest\n...'} style={{width:'100%',height:200,background:'#0d0d0d',border:'1px solid #222',borderRadius:6,color:'#ccc',fontSize:11,padding:10,resize:'vertical',fontFamily:'monospace',outline:'none',lineHeight:1.5}}/>
                  <button onClick={quickImport} style={{padding:'10px',borderRadius:6,background:'#2563eb',border:'none',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600}}>Quick Import</button>
                </div>
              )}

              {/* LIBRARY */}
              {panel==='lib'&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:4}}>
                    {[['Draw 1',()=>{drawN(1);setPanel(null)}],['Draw 3',()=>{drawN(3);setPanel(null)}],['Shuffle',()=>{shuffleLib();setPanel(null)}],['Top card',()=>lookTopN(1)],['Top 3',()=>lookTopN(3)],['Mill top',()=>{if(library.length>0){const m=library[0];setLibrary(l=>l.slice(1));setGY(g=>[...g,{...m,id:'z-'+Date.now()}]);t(m.name+' milled')}}]].map(([l,fn])=>(
                      <button key={l} onClick={fn} style={{padding:'8px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:11,cursor:'pointer'}}>{l}</button>
                    ))}
                  </div>
                  <input value={libSearch} onChange={e=>setLibSearch(e.target.value)} placeholder="Search library..." style={{width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'inherit'}}/>
                  <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>{libSearch?`Results: ${library.filter(c=>c.name.toLowerCase().includes(libSearch.toLowerCase())).length}`:`Contents (${library.length})`}</div>
                  {library.filter(c=>!libSearch||c.name.toLowerCase().includes(libSearch.toLowerCase())).map((c,i)=>{
                    const ri=library.findIndex(x=>x.id===c.id)
                    return <ZoneCard key={c.id} card={c} onHand={()=>retrieveLib(ri,'hand')} onBF={()=>retrieveLib(ri,'bf')}/>
                  })}
                </div>
              )}

              {/* TOP N */}
              {panel==='topN'&&(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:4}}>Top {topCards.length} card{topCards.length!==1?'s':''}</div>
                  {topCards.map((c,i)=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px',borderRadius:6,background:'#1a1a1a',border:'1px solid #222'}}>
                      <div style={{width:44,height:62,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333'}}><img src={SF(c.name)} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/></div>
                      <div style={{flex:1}}><div style={{fontSize:11,color:'#e0e0e0'}}>{c.name}</div></div>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <button onClick={()=>{drawN(1);setTopCards(tc=>tc.filter((_,j)=>j!==i));if(topCards.length<=1)setPanel(null)}} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>Draw</button>
                        <button onClick={()=>{setLibrary(l=>{const card=l[i];return[...l.filter((_,j)=>j!==i),card]});setTopCards(tc=>tc.filter((_,j)=>j!==i));t('→ bottom')}} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#555',fontSize:9,cursor:'pointer'}}>Bottom</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{shuffleLib();setPanel(null)}} style={{padding:'8px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:11,cursor:'pointer',marginTop:4}}>Shuffle after looking</button>
                </div>
              )}

              {/* SIDEBOARD */}
              {panel==='sideboard'&&<SideboardPanel sideboard={sideboard} library={library} onSwap={doSideboardSwap} onClose={()=>setPanel(null)}/>}

              {/* GY / EXILE / CMD */}
              {['gy','exile','cmd'].includes(panel)&&(
                (panel==='gy'?gy:panel==='exile'?exileZ:cmdZ).length===0
                  ? <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Nothing here yet</div>
                  : (panel==='gy'?gy:panel==='exile'?exileZ:cmdZ).map((card,i)=>(
                    <ZoneCard key={card.id||i} card={card}
                      onHand={()=>retrieve(panel,i,'hand')}
                      onBF={()=>retrieve(panel,i,'bf')}
                      onLib={()=>retrieve(panel,i,'lib')}
                    />
                  ))
              )}
            </div>
          </div>
        </>
      )}

      {/* TOKEN PANEL */}
      {panel==='tokens'&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:360,background:'#111',borderLeft:'1px solid #333',display:'flex',flexDirection:'column',zIndex:801,animation:'sIn .2s ease'}}>
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #222',flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:600,flex:1,color:'#e0e0e0'}}>Add Token</span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            <TokenPanel deckTokens={deckTokens} onAdd={(tok,qty)=>addToken(tok,qty)} onClose={()=>setPanel(null)}/>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:50,left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',border:'1px solid #333',borderRadius:20,padding:'6px 18px',fontSize:11,color:'#e0e0e0',zIndex:9000,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,.8)'}}>{toast}</div>}
    </div>
  )
}
