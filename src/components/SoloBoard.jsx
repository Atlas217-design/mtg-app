import React, { useState, useRef, useEffect } from 'react'
import TokenPanel from './TokenPanel.jsx'
import CardModify from './CardModify.jsx'
import CommanderZone from './CommanderZone.jsx'
import ManaTracker from './ManaTracker.jsx'
import DiceRoller from './DiceRoller.jsx'
import DeckManager from './DeckManager.jsx'
import { saveDeck, shuffleCards, parseDeckFromText } from '../utils/deckStorage.js'
import { getTokensForDeck } from '../utils/tokenRegistry.js'

const SF = (name, ver='normal') =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=${ver}`

// ── PARSE DECK ───────────────────────────────────────────────
function parseDeck(text) {
  const cards = []
  let inSide = false
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    if (line.toLowerCase().startsWith('sideboard')) { inSide=true; continue }
    if (inSide) continue
    const m = line.match(/^(\d+)\s+(.+)$/)
    if (m) for (let i=0;i<parseInt(m[1]);i++)
      cards.push({ name:m[2].trim(), id:'dk-'+m[2]+i+Math.random().toString(36).substr(2,4) })
  }
  return cards
}

function getDeckTokens(text) {
  const names=[]
  let inSide=false
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    if (line.toLowerCase().startsWith('sideboard')) { inSide=true; continue }
    if (inSide) continue
    const m=line.match(/^\d+\s+(.+)$/)
    if (m) names.push(m[1].trim())
  }
  return getTokensForDeck(names)
}

function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5) }

const DEFAULT_DECK = `1 Amulet of Vigor
1 Ancient Greenwarden
1 Arcane Signet
1 Azusa, Lost but Seeking
1 Birds of Paradise
1 Boseiju, Who Endures
1 Burgeoning
1 Cabaretti Courtyard
1 Cabin of the Dead
1 Case of the Locked Hothouse
1 Chaos Warp
1 Chrome Mox
1 Cinder Glade
1 Command Tower
1 Commercial District
1 Courser of Kruphix
1 Crucible of Worlds
1 Cultivate
1 Druid Class
1 Dryad of the Ilysian Grove
1 Entish Restoration
1 Evolving Wilds
1 Exploration
1 Exploration Broodship
1 Explore
1 Fabled Passage
1 Famished Worldsire
1 Farseek
1 Fiery Emancipation
10 Forest
1 Gaea's Cradle
1 Heroic Intervention
1 Horizon Explorer
1 Icetill Explorer
1 Impact Tremors
1 Keen Sense
1 Life from the Loam
1 Llanowar Elves
1 Llanowar Tribe
1 Loot, Exuberant Explorer
1 Lotus Cobra
1 Lotus Petal
1 Lumra, Bellow of the Woods
1 Mina and Denn, Wildborn
1 Misty Rainforest
10 Mountain
1 Mox Amber
1 Mox Diamond
1 Nahiri's Lithoforming
1 Nissa, Resurgent Animist
1 Oracle of Mul Daya
1 Planar Engineering
1 Ramunap Excavator
1 Riveteers Overlook
1 Sabotender
1 Scapeshift
1 Scute Swarm
1 Sheltered Thicket
1 Six
1 Skyshroud Claim
1 Snake Umbra
1 Sneak Attack
1 Sol Ring
1 Spelunking
1 Spitfire Lagac
1 Splendid Reclamation
1 Springheart Nantuko
1 Stomping Ground
1 Strip Mine
1 Taiga
1 Talon Gates of Madara
1 Terramorphic Expanse
1 Tireless Provisioner
1 Tunneling Geopede
1 Valakut Exploration
1 Wasteland
1 Wooded Foothills
1 Wooded Ridgeline
1 Zuran Orb`

const PHASES   = ['Untap','Upkeep','Draw','Main 1','Combat','Main 2','End']
const CSUBS    = ['Attackers','Blockers','Damage','Cleanup']

// ── CARD HOVER PREVIEW ───────────────────────────────────────
function CardPreview({ card }) {
  const [err, setErr] = useState(false)
  if (!card) return null
  return (
    <div style={{
      position:'fixed', bottom:16, right:16, zIndex:8000,
      width:220, borderRadius:12,
      boxShadow:'0 16px 48px rgba(0,0,0,.95)',
      border:'1px solid #444',
      overflow:'hidden',
      pointerEvents:'none',
      animation:'previewIn .12s ease',
    }}>
      <style>{`@keyframes previewIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
      {!err ? (
        <img src={SF(card.tokenScryfall||card.name,'normal')} alt={card.name}
          style={{width:'100%',display:'block'}}
          onError={()=>setErr(true)} />
      ) : (
        <div style={{background:'#1a1a2a',padding:16,color:'#ccc',fontSize:12,lineHeight:1.6}}>
          <div style={{fontWeight:600,marginBottom:4}}>{card.name}</div>
          <div style={{fontSize:10,color:'#555'}}>{card.type}</div>
          {card.pt&&<div style={{fontSize:11,marginTop:4}}>{card.pt}</div>}
        </div>
      )}
    </div>
  )
}

// ── STACK TRACKER ────────────────────────────────────────────
function StackTracker({ stack, priority, log, onPush, onPop, onPass, onClear, onClose }) {
  const [newItem, setNewItem] = useState('')
  const PLAYERS = ['You']

  return (
    <div style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      width:380, background:'#111', border:'1px solid #2a2050',
      borderRadius:12, zIndex:7000, boxShadow:'0 16px 48px rgba(0,0,0,.9)',
      display:'flex', flexDirection:'column', maxHeight:'80vh',
    }}>
      <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
        <span style={{fontSize:14,fontWeight:600,color:'#e0e0e0',flex:1}}>⚡ Stack & Priority</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
      </div>

      {/* PRIORITY */}
      <div style={{padding:'10px 16px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:6,background:'#0d0a1e',border:'1px solid #2a2050'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#a78bfa',animation:'blink 1.2s ease infinite'}}/>
          <span style={{fontSize:11,color:'#888',flex:1}}>Priority: <b style={{color:'#a78bfa'}}>{priority}</b></span>
          <button onClick={onPass} style={{padding:'3px 10px',borderRadius:4,border:'1px solid #2a2050',background:'#14102a',color:'#a78bfa',fontSize:10,cursor:'pointer'}}>
            Pass priority →
          </button>
        </div>
        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      </div>

      {/* STACK */}
      <div style={{flex:1,overflowY:'auto',padding:'10px 16px'}}>
        <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>
          The Stack ({stack.length})
        </div>
        {stack.length===0 ? (
          <div style={{textAlign:'center',padding:'16px 0',fontSize:11,color:'#1e1e1e'}}>Stack is empty</div>
        ) : (
          [...stack].reverse().map((item,i)=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:6,background:i===0?'#0d1628':'#111',border:`1px solid ${i===0?'#1e3a6e':'#1a1a1a'}`,marginBottom:4}}>
              <span style={{fontSize:13}}>{item.art||'🌊'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.name}</div>
                <div style={{fontSize:9,color:'#444',marginTop:1}}>{item.caster} {item.target?`→ ${item.target}`:''}</div>
              </div>
              {i===0&&<span style={{fontSize:8,color:'#60a5fa',flexShrink:0}}>TOP</span>}
            </div>
          ))
        )}

        {/* ADD TO STACK */}
        <div style={{marginTop:10,display:'flex',gap:6}}>
          <input
            value={newItem} onChange={e=>setNewItem(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&newItem.trim()&&(onPush({id:'s-'+Date.now(),name:newItem.trim(),caster:'You',art:'🌊'}),setNewItem(''))}
            placeholder="Add spell to stack..."
            style={{flex:1,padding:'6px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'inherit'}}
          />
          <button onClick={()=>{if(newItem.trim()){onPush({id:'s-'+Date.now(),name:newItem.trim(),caster:'You',art:'🌊'});setNewItem('')}}}
            style={{padding:'6px 10px',borderRadius:5,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:11,cursor:'pointer'}}>
            Add
          </button>
        </div>

        {/* ACTIONS */}
        {stack.length>0&&(
          <div style={{display:'flex',gap:6,marginTop:8}}>
            <button onClick={onPop} style={{flex:1,padding:'7px 0',borderRadius:5,background:'#2563eb',border:'none',color:'#fff',fontSize:11,cursor:'pointer',fontWeight:600}}>
              Resolve top
            </button>
            <button onClick={onClear} style={{padding:'7px 12px',borderRadius:5,border:'1px solid #1a1a1a',background:'#111',color:'#444',fontSize:11,cursor:'pointer'}}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ACTION LOG */}
      {log.length>0&&(
        <div style={{borderTop:'1px solid #1a1a1a',flexShrink:0}}>
          <div style={{padding:'6px 16px 0',fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'.07em'}}>Action Log</div>
          <div style={{maxHeight:100,overflowY:'auto',padding:'4px 16px 10px',display:'flex',flexDirection:'column',gap:3}}>
            {[...log].reverse().slice(0,20).map((entry,i)=>(
              <div key={i} style={{fontSize:9,color:i===0?'#666':'#333',display:'flex',gap:6}}>
                <span style={{color:'#2a2a2a',flexShrink:0}}>T{entry.turn}</span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── HAND PANEL ───────────────────────────────────────────────
function HandPanel({ hand, onClose, onReturnToBF, onDiscard }) {
  const [preview, setPreview] = useState(null)
  const [imgErrs, setImgErrs] = useState({})

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'8px 12px',borderBottom:'1px solid #1a1a1a',flexShrink:0,fontSize:10,color:'#555'}}>
        {hand.length} card{hand.length!==1?'s':''} in hand · Hover to preview · Right-click for options
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 12px',display:'flex',flexDirection:'column',gap:6}}>
        {hand.length===0?(
          <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Hand is empty</div>
        ):hand.map((card,i)=>{
          const err=imgErrs[card.id]
          return (
            <div key={card.id}
              style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,border:'1px solid #1a1a1a',background: preview===card.id?'#14102a':'transparent',cursor:'default'}}
              onMouseEnter={()=>setPreview(card.id)}
              onMouseLeave={()=>setPreview(null)}>
              <div style={{width:40,height:56,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333',background:'#0d1a0d'}}>
                {!err?(
                  <img src={SF(card.name)} alt={card.name} style={{width:'100%',height:'100%',objectFit:'cover'}}
                    onError={()=>setImgErrs(p=>({...p,[card.id]:true}))}/>
                ):(
                  <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'#555',textAlign:'center',padding:2}}>{card.name}</div>
                )}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
                <div style={{fontSize:9,color:'#333',marginTop:1}}>{card.type||'Card'}</div>
              </div>
              <div style={{display:'flex',gap:3,flexShrink:0}}>
                <button onClick={()=>onReturnToBF&&onReturnToBF(card.id)}
                  style={{padding:'3px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>
                  Play
                </button>
                <button onClick={()=>onDiscard&&onDiscard(card.id,'gy')}
                  style={{padding:'3px 7px',borderRadius:4,border:'1px solid #1a1a1a',background:'#111',color:'#444',fontSize:9,cursor:'pointer'}}>
                  GY
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {/* PREVIEW IN PANEL */}
      {preview&&(()=>{
        const card=hand.find(c=>c.id===preview)
        if(!card)return null
        return(
          <div style={{borderTop:'1px solid #1a1a1a',padding:8,flexShrink:0,display:'flex',justifyContent:'center',background:'#0d0d0d'}}>
            <img src={SF(card.name)} alt={card.name} style={{width:120,borderRadius:7,border:'1px solid #333'}}
              onError={e=>e.target.style.display='none'}/>
          </div>
        )
      })()}
    </div>
  )
}

// ── COUNTERS WIDGET ──────────────────────────────────────────
function CountersWidget({ poison, energy, experience, onPoison, onEnergy, onExp, onClose }) {
  return (
    <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:'#111',border:'1px solid #333',borderRadius:8,padding:12,zIndex:500,minWidth:200,boxShadow:'0 8px 24px rgba(0,0,0,.8)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:600,color:'#e0e0e0'}}>Your Counters</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:14,cursor:'pointer'}}>✕</button>
      </div>
      {[
        {label:'☠ Poison',   val:poison,     set:onPoison,  warn:10,  color:'#4ade80'},
        {label:'⚡ Energy',  val:energy,     set:onEnergy,  warn:999, color:'#fbbf24'},
        {label:'✦ Experience',val:experience, set:onExp,    warn:999, color:'#a78bfa'},
      ].map(({label,val,set,warn,color})=>(
        <div key={label} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'5px 8px',borderRadius:5,background:'#1a1a1a'}}>
          <span style={{fontSize:10,color:val>=warn?'#ef4444':color,flex:1,fontWeight:500}}>{label}</span>
          <button onClick={()=>set(v=>Math.max(0,v-1))} style={ctrBtn}>−</button>
          <span style={{fontSize:14,fontWeight:700,color:val>=warn?'#ef4444':'#e0e0e0',minWidth:22,textAlign:'center'}}>{val}</span>
          <button onClick={()=>set(v=>v+1)} style={ctrBtn}>+</button>
        </div>
      ))}
      {poison>=10&&(
        <div style={{padding:'5px 8px',borderRadius:5,background:'#1a0a0a',border:'1px solid #4a1a1a',fontSize:10,color:'#ef4444',textAlign:'center'}}>
          ⚠ 10 poison counters — eliminated!
        </div>
      )}
    </div>
  )
}
const ctrBtn={padding:'1px 8px',border:'1px solid #2a2a2a',borderRadius:3,background:'#0d0d0d',color:'#666',fontSize:13,cursor:'pointer'}

// ═══════════════════════════════════════════════════════════
// MAIN BOARD
// ═══════════════════════════════════════════════════════════
export default function SoloBoard({ onBack }) {
  // ── DECK & ZONES ──────────────────────────────────────────
  const [library,  setLibrary]  = useState(()=>shuffle(parseDeck(DEFAULT_DECK)))
  const [hand,     setHand]     = useState([])
  const [bf,       setBF]       = useState([])
  const [gy,       setGY]       = useState([])
  const [exileZ,   setExileZ]   = useState([])
  const [cmdZ,     setCmdZ]     = useState([])
  const [commander, setCommander] = useState(null)
  // commander shape: { name:string, castCount:number, inZone:boolean }

  // ── GAME ──────────────────────────────────────────────────
  const [life,     setLife]     = useState(40)
  const [poison,   setPoison]   = useState(0)
  const [energy,   setEnergy]   = useState(0)
  const [exp,      setExp]      = useState(0)
  const [turn,     setTurn]     = useState(1)
  const [phase,    setPhaseVal] = useState(3)
  const [csub,     setCsub]     = useState(null)
  const [stack,    setStack]    = useState([])
  const [priority, setPriority] = useState('You')
  const [actLog,   setActLog]   = useState([])
  const [dragging,    setDragging]    = useState(null)
  const [imgErr,      setImgErr]      = useState({})
  const [modifyCard,  setModifyCard]  = useState(null) // card being modified

  // ── UI ────────────────────────────────────────────────────
  const [ctx,       setCtx]      = useState(null)
  const [panel,     setPanel]    = useState(null)
  const [toast,     setToast]    = useState(null)
  const [showStack, setShowStack]= useState(false)
  const [showCtrs,   setShowCtrs]  = useState(false)
  const [showMana,   setShowMana]  = useState(false)
  const [showDice,   setShowDice]  = useState(false)
  const [showDecks,  setShowDecks] = useState(false)
  const [showGrid,   setShowGrid]  = useState(false)
  const [gridSize,   setGridSize]  = useState(40) // px
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [bfCtxMenu,  setBfCtxMenu] = useState(null) // {x,y} for BF right-click
  const [importTxt, setImportTxt]= useState('')
  const [hovered,   setHovered]  = useState(null) // card object for preview
  const [topCards,  setTopCards] = useState([])
  const [libSearch, setLibSearch] = useState('')

  const bfRef    = useRef(null)
  const toastRef = useRef(null)
  const hDrag    = useRef(null)
  const bDrag    = useRef(null)

  const deckTokens = getDeckTokens(DEFAULT_DECK)

  useEffect(() => { drawN(7, true) }, [])

  // ── LOG ───────────────────────────────────────────────────
  function log(text) {
    setActLog(l => [...l, { text, turn, time: Date.now() }])
  }

  // ── TOAST ─────────────────────────────────────────────────
  function t(msg) {
    setToast(msg); clearTimeout(toastRef.current)
    toastRef.current = setTimeout(()=>setToast(null), 2000)
  }

  // ── PHASE ─────────────────────────────────────────────────
  function goPhase(i) {
    setPhaseVal(i)
    setCsub(i===4?0:null)
    t(PHASES[i])
    log(`Phase → ${PHASES[i]}`)
  }

  // ── END TURN ──────────────────────────────────────────────
  function endTurn() {
    setBF(b=>b.map(c=>({...c,tapped:false,attacking:false,blocking:false,targeted:false})))
    setTurn(n=>n+1); setPhaseVal(3); setCsub(null)
    drawN(1)
    log('End turn → untap, draw')
  }

  // ── DRAW ──────────────────────────────────────────────────
  function drawN(n, init=false) {
    setLibrary(lib=>{
      if(lib.length===0){t('Library empty!');return lib}
      const drawn=lib.slice(0,n).map(c=>({...c,id:'h-'+Date.now()+Math.random()}))
      setHand(h=>[...h,...drawn])
      if(!init){ t(`Drew ${n}`); log(`Drew ${n} card${n>1?'s':''}: ${drawn.map(c=>c.name).join(', ')}`) }
      return lib.slice(n)
    })
  }

  function drawOne() { drawN(1) }

  // ── LIBRARY ACTIONS ───────────────────────────────────────
  function shuffleLib() { setLibrary(l=>shuffle(l)); t('Shuffled'); log('Library shuffled') }
  function lookTopN(n) { setTopCards(library.slice(0,n)); setPanel('topN') }

  // ── RESTART ───────────────────────────────────────────────
  function restart() {
    const fresh=shuffle(parseDeck(DEFAULT_DECK))
    setLibrary(fresh); setHand([]); setBF([]); setGY([]); setExileZ([]); setCmdZ([])
    setLife(40); setPoison(0); setEnergy(0); setExp(0)
    setTurn(1); setPhaseVal(3); setCsub(null)
    setStack([]); setPriority('You'); setActLog([])
    setTimeout(()=>drawN(7,true),50)
    t('Game restarted'); log('=== GAME RESTARTED ===')
  }

  // ── IMPORT ────────────────────────────────────────────────
  function importDeck() {
    const parsed=parseDeck(importTxt)
    if(parsed.length===0){t('No cards found');return}
    const shuffled=shuffle(parsed)
    setLibrary(shuffled); setHand([]); setBF([]); setGY([]); setExileZ([]); setCmdZ([])
    setLife(40); setPoison(0); setEnergy(0); setExp(0)
    setTurn(1); setPhaseVal(3); setCsub(null); setStack([]); setPriority('You')
    setPanel(null); setImportTxt('')
    setTimeout(()=>drawN(7,true),50)
    t(`Loaded ${parsed.length} cards`); log(`Deck imported: ${parsed.length} cards`)
  }

  // ── PLAY FROM HAND ────────────────────────────────────────
  function playCard(handId, x, y) {
    const card=hand.find(c=>c.id===handId)
    if(!card)return
    setHand(h=>h.filter(c=>c.id!==handId))
    const newCard={...card,id:'bf-'+Date.now(),x:Math.max(0,x),y:Math.max(0,y),tapped:false,attacking:false,blocking:false,targeted:false,counters:0}
    setBF(b=>[...b,newCard])
    t(card.name+' played'); log(`Played ${card.name}`)
  }

  // ── MOVE ON BF ────────────────────────────────────────────
  function moveBF(id,x,y) {
    const bfEl = bfRef.current
    const bfRect = bfEl ? bfEl.getBoundingClientRect() : {width:800,height:400}
    const snappedX = snapToGrid(Math.max(0, Math.min(x, bfRect.width  - 95)),  gridSize)
    const snappedY = snapToGrid(Math.max(0, Math.min(y, bfRect.height - 130)), gridSize)
    setBF(b => b.map(c => c.id===id ? {...c, x:snappedX, y:snappedY} : c))
  }

  // ── TAP ───────────────────────────────────────────────────
  function tapCard(id) {
    setBF(b=>b.map(c=>{
      if(c.id!==id)return c
      const next={...c,tapped:!c.tapped}
      log(`${c.name} ${next.tapped?'tapped':'untapped'}`)
      return next
    }))
  }

  // ── SEND TO ZONE ──────────────────────────────────────────
  function toZone(id,src,zone) {
    let card
    if(src==='hand'){card=hand.find(c=>c.id===id);setHand(h=>h.filter(c=>c.id!==id))}
    else            {card=bf.find(c=>c.id===id);  setBF(b=>b.filter(c=>c.id!==id))}
    if(!card)return
    // Tokens cease to exist when they leave the battlefield — they don't go to any zone
    if(card.isToken) {
      log(`${card.name} token ceased to exist`)
      t(`${card.name} token removed`)
      return
    }
    // If this is the commander going to cmd zone, update commander state
    if(card.isCommander || (commander && card.name === commander.name)) {
      if(zone === 'cmd') {
        setCommander(c => c ? { ...c, inZone: true } : c)
        log(`${card.name} returned to command zone`)
        t(`${card.name} → command zone`)
        setBF(b => b.filter(c => c.id !== id))
        return
      }
    }
    const e={...card,id:'z-'+Date.now()+Math.random()}
    if(zone==='gy')    {setGY(z=>[...z,e])}
    if(zone==='exile') {setExileZ(z=>[...z,e])}
    if(zone==='cmd')   {setCmdZ(z=>[...z,e])}
    log(`${card.name} → ${zone}`)
  }

  // ── RETRIEVE FROM ZONE ────────────────────────────────────
  function retrieve(zone,idx,dest) {
    let card,setter
    if(zone==='gy')   {card=gy[idx];   setter=setGY}
    if(zone==='exile'){card=exileZ[idx];setter=setExileZ}
    if(zone==='cmd')  {card=cmdZ[idx]; setter=setCmdZ}
    if(!card)return
    setter(z=>z.filter((_,i)=>i!==idx))
    if(dest==='hand'){setHand(h=>[...h,{...card,id:'r-'+Date.now()}]);t(card.name+' → hand')}
    if(dest==='bf')  {setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0}]);t(card.name+' → BF')}
    if(dest==='lib') {setLibrary(l=>[...l,{...card,id:'lib-'+Date.now()}]);t(card.name+' → library')}
    log(`${card.name} retrieved from ${zone} → ${dest}`)
  }

  function retrieveLib(idx,dest) {
    const card=library[idx]
    if(!card)return
    setLibrary(l=>l.filter((_,i)=>i!==idx))
    if(dest==='hand'){setHand(h=>[...h,{...card,id:'h-'+Date.now()}]);t(card.name+' → hand')}
    if(dest==='bf')  {setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0}]);t(card.name+' → BF')}
    log(`${card.name} from library → ${dest}`)
  }

  // ── ADD TOKEN ─────────────────────────────────────────────
  function addToken(tok,qty=1) {
    const newCards=[]
    for(let i=0;i<qty;i++){
      const x=80+Math.random()*280+i*12
      const y=40+Math.random()*100+i*8
      newCards.push({
        id:'tok-'+Date.now()+i+Math.random().toString(36).substr(2,4),
        name:tok.name, type:tok.type||'Token',
        col: tok.color==='Green'?'cg':tok.color==='Red'?'cr':tok.color==='White'?'cw':tok.color==='Blue'?'cu':tok.color==='Black'?'cb':'ca',
        art:tok.art||'◈', pt:tok.pt||'', x, y,
        tapped:false,attacking:false,blocking:false,targeted:false,counters:0,
        isToken:true, tokenScryfall:tok.scryfall||tok.name,
      })
    }
    setBF(b=>[...b,...newCards])
    t(`${qty}× ${tok.name}`); log(`Created ${qty}× ${tok.name} token${qty>1?'s':''}`)
  }

  // ── STACK ─────────────────────────────────────────────────
  function updateCardOnBF(id, updates) {
    setBF(b => b.map(c => c.id === id ? { ...c, ...updates } : c))
    log(`Modified ${updates.name || id}`)
  }

  // ── COMMANDER ──────────────────────────────────────────────
  function setCommanderCard(name) {
    setCommander({ name, castCount: 0, inZone: true })
    log(`Commander set: ${name}`)
    t(`${name} set as commander`)
  }

  function castCommander() {
    if (!commander) return
    // Move from command zone to battlefield
    const newCard = {
      id: 'cmd-bf-'+Date.now(),
      name: commander.name,
      type: 'Creature',
      col: 'cg', art: '⬡', pt: '',
      x: 200, y: 60,
      tapped: false, attacking: false, blocking: false, targeted: false, counters: 0,
      isCommander: true,
    }
    setBF(b => [...b, newCard])
    setCommander(c => ({ ...c, castCount: c.castCount + 1, inZone: false }))
    const tax = commander.castCount * 2
    t(`${commander.name} cast${tax > 0 ? ` (+${tax} tax)` : ''}`)
    log(`Commander cast: ${commander.name}, tax was ${tax}`)
  }

  function returnCommanderToZone() {
    // Remove from battlefield, mark as back in zone
    setBF(b => b.filter(c => !c.isCommander))
    setCommander(c => c ? { ...c, inZone: true } : c)
    t(`${commander?.name} returned to command zone`)
    log(`Commander returned to command zone`)
  }

  function commanderToBF() {
    // Put directly onto battlefield without casting (cheat effects)
    const newCard = {
      id: 'cmd-bf-'+Date.now(),
      name: commander.name,
      type: 'Creature',
      col: 'cg', art: '⬡', pt: '',
      x: 200, y: 60,
      tapped: false, attacking: false, blocking: false, targeted: false, counters: 0,
      isCommander: true,
    }
    setBF(b => [...b, newCard])
    setCommander(c => ({ ...c, inZone: false }))
    t(`${commander.name} put onto battlefield`)
    log(`Commander put onto BF directly (no cast)`)
  }

  function pushStack(item){ setStack(s=>[...s,item]); log(`Stack: ${item.name} added`) }
  function popStack(){
    setStack(s=>{
      if(s.length===0)return s
      log(`Stack: ${s[s.length-1].name} resolved`)
      return s.slice(0,-1)
    })
  }
  function passPriority(){ log(`Priority passed`); t('Priority passed') }
  function clearStack(){ setStack([]); log('Stack cleared') }

  // ── CONTEXT MENU ─────────────────────────────────────────
  function doCtx(action) {
    if(!ctx)return
    const {card,src}=ctx; setCtx(null)
    switch(action){
      case 'tap': tapCard(card.id); break
      case 'atk': setBF(b=>b.map(c=>c.id===card.id?{...c,attacking:!c.attacking}:c)); log(`${card.name} ${card.attacking?'no longer attacking':'attacking'}`); break
      case 'blk': setBF(b=>b.map(c=>c.id===card.id?{...c,blocking:!c.blocking}:c)); log(`${card.name} blocking`); break
      case 'tgt': setBF(b=>b.map(c=>({...c,targeted:c.id===card.id?!c.targeted:c.targeted}))); log(`${card.name} targeted`); break
      case '+ctr': setBF(b=>b.map(c=>c.id===card.id?{...c,counters:(c.counters||0)+1}:c)); log(`+1/+1 on ${card.name}`); break
      case '-ctr': setBF(b=>b.map(c=>c.id===card.id?{...c,counters:Math.max(0,(c.counters||0)-1)}:c)); break
      case '+2ctr':setBF(b=>b.map(c=>c.id===card.id?{...c,counters:(c.counters||0)+2}:c)); log(`+2/+2 on ${card.name}`); break
      case 'copy':
        const orig=bf.find(c=>c.id===card.id)
        if(orig){setBF(b=>[...b,{...orig,id:'copy-'+Date.now(),x:orig.x+12,y:orig.y+12}]);log(`Copied ${card.name}`)}
        break
      case 'modify':
        const mcard=bf.find(c=>c.id===card.id)
        if(mcard) setModifyCard(mcard)
        break
      case 'top':
        const btop=bf.find(c=>c.id===card.id)
        if(btop){setBF(b=>b.filter(c=>c.id!==card.id));setLibrary(l=>[{...btop,id:'lib-'+Date.now()},...l]);log(`${card.name} → top of library`)}
        break
      case 'stack':
        pushStack({id:'s-'+Date.now(),name:card.name,caster:'You',art:'🌊'})
        break
      case 'hand':
        const bcard=bf.find(c=>c.id===card.id)
        if(bcard){setBF(b=>b.filter(c=>c.id!==card.id));setHand(h=>[...h,{...bcard,id:'r-'+Date.now()}]);log(`${card.name} returned to hand`)}
        break
      case 'gy':      toZone(card.id,src,'gy'); break
      case 'exile':   toZone(card.id,src,'exile'); break
      case 'cmd':     toZone(card.id,src,'cmd'); break
      case 'destroy':
        if(card.isToken){
          setBF(b=>b.filter(c=>c.id!==card.id))
          log(`${card.name} token ceased to exist`)
          t('Token removed')
        } else if(card.isCommander||(commander&&card.name===commander.name)) {
          // Commander goes to command zone when destroyed
          setBF(b=>b.filter(c=>c.id!==card.id))
          setCommander(c=>c?{...c,inZone:true}:c)
          log(`${card.name} (commander) → command zone`)
          t(`${card.name} went to command zone`)
        } else {
          toZone(card.id,src,'gy')
          log(`${card.name} destroyed`)
        }
        break
    }
  }

  // ── DRAG: HAND → BF ──────────────────────────────────────
  function handDown(e,card) {
    if(e.button!==0)return; e.preventDefault()
    hDrag.current={card,moved:false,sx:e.clientX,sy:e.clientY}
    const g=mkGhost(e.clientX-46,e.clientY-64,card.name)
    document.body.appendChild(g)
    function mv(me){
      g.style.left=(me.clientX-46)+'px'; g.style.top=(me.clientY-64)+'px'
      if(Math.abs(me.clientX-e.clientX)>4||Math.abs(me.clientY-e.clientY)>4) hDrag.current.moved=true
      const bfEl=bfRef.current
      if(bfEl){const r=bfEl.getBoundingClientRect();const ov=me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom;bfEl.style.outline=ov?'2px solid #a78bfa':''}
    }
    function up(me){
      window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up)
      g.remove(); if(bfRef.current)bfRef.current.style.outline=''
      if(!hDrag.current?.moved){hDrag.current=null;return}
      const bfEl=bfRef.current
      if(bfEl){const r=bfEl.getBoundingClientRect();if(me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom){playCard(card.id,me.clientX-r.left-46,me.clientY-r.top-64)}}
      hDrag.current=null
    }
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up)
  }

  // ── DRAG: BF → BF / PILE ─────────────────────────────────
  function bfDown(e,card) {
    if(e.button!==0)return; e.preventDefault(); e.stopPropagation()
    const bfEl=bfRef.current; if(!bfEl)return
    const r=bfEl.getBoundingClientRect()
    const offX=e.clientX-r.left-card.x, offY=e.clientY-r.top-card.y
    bDrag.current={card,moved:false,sx:e.clientX,sy:e.clientY,offX,offY}
    setDragging(card.id)
    const g=mkGhost(e.clientX-offX,e.clientY-offY,card.name)
    document.body.appendChild(g)
    function mv(me){
      g.style.left=(me.clientX-offX)+'px'; g.style.top=(me.clientY-offY)+'px'
      if(Math.abs(me.clientX-e.clientX)>3||Math.abs(me.clientY-e.clientY)>3) bDrag.current.moved=true
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        const ov=me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom
        p.style.borderColor=ov?'#a78bfa':''; p.style.background=ov?'rgba(167,139,250,.1)':''
      })
    }
    function up(me){
      window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up)
      g.remove(); setDragging(null)
      document.querySelectorAll('[data-pile]').forEach(p=>{p.style.borderColor='';p.style.background=''})
      if(!bDrag.current?.moved){tapCard(card.id);bDrag.current=null;return}
      let onPile=false
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        if(me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom){toZone(card.id,'bf',p.dataset.pile);onPile=true}
      })
      if(!onPile){const r2=bfRef.current?.getBoundingClientRect();if(r2)moveBF(card.id,me.clientX-r2.left-offX,me.clientY-r2.top-offY)}
      bDrag.current=null
    }
    window.addEventListener('mousemove',mv); window.addEventListener('mouseup',up)
  }

  // ── GRID SNAP ──────────────────────────────────────────────
  function snapToGrid(val, size) {
    if (!showGrid) return val
    return Math.round(val / size) * size
  }

  // ── LOAD DECK ──────────────────────────────────────────────
  function loadDeck(deck) {
    const shuffled = shuffleCards(deck.cards || [])
    setLibrary(shuffled)
    setHand([])
    setBF([])
    setGY([])
    setExileZ([])
    setCmdZ([])
    setLife(40)
    setPoison(0); setEnergy(0); setExp(0)
    setTurn(1); setPhaseVal(3); setCsub(null)
    setStack([]); setPriority('You'); setActLog([])
    setCurrentDeckId(deck.id || null)
    // Set commander if declared
    if (deck.commander) {
      setCommander({ name: deck.commander, castCount: 0, inZone: true })
      log(`Commander: ${deck.commander}`)
    } else {
      setCommander(null)
    }
    setTimeout(() => drawN(7, true), 50)
    t(`Loaded: ${deck.name || 'deck'}`)
    log(`=== Deck loaded: ${deck.name} ===`)
  }

  function mkGhost(left,top,name) {
    const g=document.createElement('div')
    g.style.cssText=`position:fixed;pointer-events:none;z-index:9999;width:92px;height:128px;border-radius:7px;border:2px solid #a78bfa;box-shadow:0 12px 32px rgba(0,0,0,.9);background:#0d1a0d;overflow:hidden;opacity:.9;transform:rotate(3deg) scale(1.04);left:${left}px;top:${top}px;`
    const img=document.createElement('img')
    img.src=SF(name); img.style.cssText='width:100%;height:100%;object-fit:cover;'
    img.onerror=()=>{g.textContent=name;g.style.display='flex';g.style.alignItems='center';g.style.justifyContent='center';g.style.fontSize='10px';g.style.color='#aaa';g.style.padding='6px';g.style.textAlign='center';}
    g.appendChild(img); return g
  }

  // ── RENDER ────────────────────────────────────────────────
  const lifeCol=life<=10?'#ef4444':life<=20?'#f59e0b':'#e0e0e0'
  const panelCards=panel==='gy'?gy:panel==='exile'?exileZ:panel==='cmd'?cmdZ:[]
  const hoveredCard = hovered ? (bf.find(c=>c.id===hovered)||hand.find(c=>c.id===hovered)) : null

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#1a1a1a',overflow:'hidden',fontFamily:'system-ui,sans-serif',color:'#e0e0e0',userSelect:'none'}}>

      {/* ── TOP BAR ── */}
      <div style={{display:'flex',alignItems:'center',gap:0,padding:'0 8px',background:'#111',borderBottom:'1px solid #333',flexShrink:0,height:42}}>

        {/* LIFE + COUNTERS */}
        <div style={{display:'flex',alignItems:'center',gap:4,position:'relative'}}>
          <button onClick={()=>setLife(l=>Math.max(0,l-1))} style={TB}>−</button>
          <span style={{fontSize:20,fontWeight:700,color:lifeCol,minWidth:34,textAlign:'center'}}>{life}</span>
          <button onClick={()=>setLife(l=>l+1)} style={TB}>+</button>
          <div style={{width:1,height:22,background:'#333',margin:'0 4px'}}/>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowCtrs(s=>!s)} style={{...TB,fontSize:11,padding:'3px 8px'}}>
              Counters {poison>0&&<span style={{color:'#4ade80',marginLeft:2}}>{poison}☠</span>} ▾
            </button>
            {showCtrs&&<CountersWidget poison={poison} energy={energy} experience={exp} onPoison={setPoison} onEnergy={setEnergy} onExp={setExp} onClose={()=>setShowCtrs(false)}/>}
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
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <button onClick={()=>setShowStack(s=>!s)} style={{...AB,borderColor:showStack?'#2a2050':'#333',background:showStack?'#0d0a1e':'#1a1a1a',color:showStack?'#a78bfa':'#ccc'}}>
            ⚡ Stack{stack.length>0?` (${stack.length})`:''}
          </button>
          <button onClick={restart}               style={AB}>Restart</button>
          <button onClick={()=>setPanel('tokens')} style={AB}>Add Token ▾</button>
          <button onClick={shuffleLib}             style={AB}>Shuffle</button>
          <button onClick={()=>lookTopN(1)}        style={AB}>Top Card</button>
          <button onClick={()=>setPanel('lib')}    style={AB}>Library</button>
          <button onClick={()=>setShowMana(s=>!s)} style={{...AB,borderColor:showMana?'#1a4a2a':'#333',color:showMana?'#4ade80':'#ccc'}}>🔮 Mana</button>
          <button onClick={()=>setShowDice(s=>!s)} style={AB}>🎲 Dice</button>
          <button onClick={()=>setShowDecks(true)} style={AB}>📚 Decks</button>
          <button onClick={()=>setShowGrid(s=>!s)} style={{...AB,borderColor:showGrid?'#2a2050':'#333',color:showGrid?'#a78bfa':'#ccc'}}>
            {showGrid?'Grid ON':'Grid OFF'}
          </button>
          <button onClick={()=>setPanel('import')} style={AB}>Import</button>
          <button onClick={drawOne}                style={AB}>Draw</button>
          <button onClick={endTurn}                style={{...AB,background:'#2563eb',border:'1px solid #3b82f6',color:'#fff',fontWeight:600}}>Next Turn</button>
        </div>
      </div>

      {/* COMBAT SUB-PHASES */}
      {phase===4&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'2px 8px',background:'#0d0d0d',borderBottom:'1px solid #222',flexShrink:0}}>
          <span style={{fontSize:8,color:'#555',marginRight:6,textTransform:'uppercase',letterSpacing:'.06em'}}>Combat ›</span>
          {CSUBS.map((s,i)=>(
            <React.Fragment key={s}>
              <div onClick={()=>setCsub(i)} style={{padding:'2px 8px',fontSize:8,borderRadius:3,cursor:'pointer',textTransform:'uppercase',color:csub===i?'#a78bfa':'#333',background:csub===i?'#14102a':'transparent',border:csub===i?'1px solid #3a2d6a':'1px solid transparent'}}>
                {s}
              </div>
              {i<3&&<span style={{color:'#222',fontSize:9}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── BATTLEFIELD ── */}
      <div ref={bfRef} style={{flex:1,position:'relative',overflow:'hidden',background:'#141414',cursor:'default'}} onClick={()=>{setCtx(null);setShowCtrs(false)}}>
        {/* GRID OVERLAY */}
        {showGrid&&(
          <div style={{position:'absolute',inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)`,backgroundSize:`${gridSize}px ${gridSize}px`,pointerEvents:'none',zIndex:1}}/>
        )}

        {bf.length===0&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#1e1e1e',flexDirection:'column',gap:6,pointerEvents:'none'}}>
            <div>Drag cards from your hand to play them</div>
            <div style={{fontSize:10,color:'#181818'}}>Click to tap · Right-click for options · Drag to reposition</div>
          </div>
        )}

        {bf.map(card=>{
          const err=imgErr[card.id]
          const bc=card.targeted?'#60a5fa':card.attacking?'#ef4444':card.blocking?'#f59e0b':'#3a3a3a'
          return (
            <div key={card.id}
              onMouseDown={e=>bfDown(e,card)}
              onMouseEnter={()=>setHovered(card.id)}
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
              {!err?(
                <img src={SF(card.tokenScryfall||card.name)} alt={card.name} draggable={false}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                  onError={()=>setImgErr(p=>({...p,[card.id]:true}))}/>
              ):(
                <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:4}}>
                  <div style={{fontSize:8,color:'#aaa',textAlign:'center',lineHeight:1.3}}>{card.name}</div>
                  {card.pt&&<div style={{fontSize:9,fontWeight:700,color:'#ccc',marginTop:3}}>{card.pt}</div>}
                </div>
              )}
              {/* COUNTER BADGES — show all counter types */}
              {card.countersMap && Object.entries(card.countersMap).map(([key,val])=>{
                if(!val) return null
                const CMAP={'+1+1':'#2563eb','-1-1':'#dc2626','loyalty':'#7c3aed','charge':'#d97706','time':'#059669','fade':'#6b7280','ice':'#0ea5e9','verse':'#8b5cf6','age':'#a16207','custom':'#e0e0e0'}
                const col=CMAP[key]||'#2563eb'
                return(
                  <div key={key} style={{position:'absolute',top:-6,left:-6,minWidth:17,height:17,borderRadius:9,background:col,border:'2px solid #141414',fontSize:7,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5,padding:'0 3px'}}>
                    {val}
                  </div>
                )
              })}
              {/* Legacy single counter (backwards compat) */}
              {!card.countersMap && (card.counters||0)>0&&(
                <div style={{position:'absolute',top:-6,left:-6,width:17,height:17,borderRadius:'50%',background:'#2563eb',border:'2px solid #141414',fontSize:7,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5}}>
                  {card.counters}
                </div>
              )}
              {/* CUSTOM P/T override */}
              {(card.customPower||card.customToughness) ? (
                <div style={{position:'absolute',bottom:3,right:3,fontSize:9,fontWeight:700,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,1)',background:'rgba(37,99,235,.7)',borderRadius:3,padding:'0 4px',border:'1px solid rgba(59,130,246,.5)'}}>
                  {card.customPower||'?'}/{card.customToughness||'?'}
                </div>
              ) : card.pt&&!err&&(
                <div style={{position:'absolute',bottom:3,right:3,fontSize:8,fontWeight:700,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,1)',background:'rgba(0,0,0,.45)',borderRadius:3,padding:'0 3px'}}>
                  {card.pt}
                </div>
              )}
              {/* STATUS OVERLAYS */}
              {card.isToken&&<div style={{position:'absolute',top:2,right:2,fontSize:6,padding:'1px 3px',borderRadius:3,background:'rgba(124,58,237,.7)',color:'#e0e0e0'}}>TOKEN</div>}
              {card.sick&&<div style={{position:'absolute',bottom:18,left:'50%',transform:'translateX(-50%)',fontSize:7,padding:'1px 4px',borderRadius:3,background:'rgba(107,114,128,.7)',color:'#e0e0e0',whiteSpace:'nowrap'}}>SICK</div>}
              {card.phased&&<div style={{position:'absolute',inset:0,background:'rgba(139,92,246,.15)',border:'2px dashed rgba(139,92,246,.5)',borderRadius:7,pointerEvents:'none'}}/>}
              {/* BATTLEFIELD NOTE */}
              {card.note&&(
                <div style={{position:'absolute',top:0,left:0,right:0,background:'rgba(0,0,0,.8)',fontSize:6,color:'#fbbf24',padding:'2px 4px',lineHeight:1.3,borderRadius:'6px 6px 0 0',overflow:'hidden',maxHeight:28}}>
                  {card.note}
                </div>
              )}
              {card.attacking&&<div style={{position:'absolute',top:-13,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'#ef4444',filter:'drop-shadow(0 0 4px rgba(239,68,68,.8))'}}>⚔</div>}
            </div>
          )
        })}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{background:'#111',borderTop:'1px solid #333',flexShrink:0}}>
        {/* HAND */}
        <div style={{display:'flex',alignItems:'flex-end',gap:5,padding:'8px 10px 6px',overflowX:'auto',overflowY:'visible',minHeight:148}}>
          {hand.map(card=>{
            const err=imgErr[card.id+'h']
            return (
              <div key={card.id}
                onMouseDown={e=>handDown(e,card)}
                onMouseEnter={()=>setHovered(card.id)}
                onMouseLeave={()=>setHovered(null)}
                onContextMenu={e=>{e.preventDefault();setCtx({x:e.clientX,y:e.clientY,card,src:'hand'})}}
                style={{flexShrink:0,width:92,height:128,borderRadius:7,border:'1.5px solid #3a3a3a',background:'#0d1a0d',cursor:'grab',overflow:'hidden',position:'relative',transition:'transform .12s,border-color .1s,box-shadow .1s',boxShadow:'0 3px 10px rgba(0,0,0,.7)'}}
                onMouseEnter2={e=>{e.currentTarget.style.transform='translateY(-12px)';e.currentTarget.style.borderColor='#a78bfa';e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,.9),0 0 0 1px rgba(167,139,250,.4)'}}
                onMouseLeave2={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='#3a3a3a';e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,.7)'}}>
                {!err?(
                  <img src={SF(card.name)} alt={card.name} draggable={false}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                    onError={()=>setImgErr(p=>({...p,[card.id+'h']:true}))}/>
                ):(
                  <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:6}}>
                    <div style={{fontSize:8,color:'#aaa',textAlign:'center',lineHeight:1.4}}>{card.name}</div>
                  </div>
                )}
              </div>
            )
          })}
          {hand.length===0&&<div style={{fontSize:11,color:'#2a2a2a',padding:'0 8px',alignSelf:'center'}}>Hand is empty — draw some cards</div>}
        </div>

        {/* ZONE PILLS */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px 6px',borderTop:'1px solid #222'}}>
          <div onClick={()=>setPanel('hand-view')} style={{...ZP,color:hand.length>0?'#aaa':'#555'}}>Hand ({hand.length})</div>
          <div onClick={()=>setPanel('lib')}       style={ZP}>Library ({library.length})</div>
          <div onClick={()=>setPanel('gy')}         style={{...ZP,color:gy.length>0?'#aaa':'#555'}}>Graveyard ({gy.length})</div>
          <div onClick={()=>setPanel('exile')}      style={{...ZP,color:exileZ.length>0?'#aaa':'#555'}}>Exile ({exileZ.length})</div>
          <div onClick={()=>setPanel('cmd')}        style={{...ZP,color:cmdZ.length>0?'#a78bfa':'#555'}}>Command ({cmdZ.length})</div>
        </div>
      </div>

      {/* ── COMMANDER ZONE — always visible bottom-right of BF ── */}
      <CommanderZone
        commander={commander}
        onSetCommander={setCommanderCard}
        onCast={castCommander}
        onReturnToZone={returnCommanderToZone}
        onSendToBF={commanderToBF}
        onContextMenu={(e) => {
          if (!commander) return
          e.preventDefault()
          const fakeCard = { id:'commander', name:commander.name, isCommander:true, type:'Creature', col:'cg', art:'⬡', pt:'' }
          setCtx({ x:e.clientX, y:e.clientY, card:fakeCard, src:'cmd' })
        }}
      />

      {/* ── CARD HOVER PREVIEW (bottom-right) ── */}
      {hoveredCard && !commander && <CardPreview card={hoveredCard} />}
      {hoveredCard && commander && (
        <div style={{position:'fixed',bottom:16,right:150,zIndex:8000,pointerEvents:'none'}}>
          <CardPreview card={hoveredCard} />
        </div>
      )}

      {/* ── STACK TRACKER ── */}
      {showStack&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:6999}} onClick={()=>setShowStack(false)}/>
          <StackTracker
            stack={stack} priority={priority} log={actLog}
            onPush={pushStack} onPop={popStack}
            onPass={passPriority} onClear={clearStack}
            onClose={()=>setShowStack(false)}
          />
        </>
      )}

      {/* ── CONTEXT MENU ── */}
      {ctx&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={()=>setCtx(null)}/>
          <div style={{position:'fixed',left:Math.min(ctx.x,window.innerWidth-195),top:Math.min(ctx.y,window.innerHeight-420),background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:4,zIndex:9999,minWidth:190,boxShadow:'0 8px 32px rgba(0,0,0,.9)'}}>
            <div style={{fontSize:9,color:'#555',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #222',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ctx.card.name}</div>
            {ctx.src==='bf'&&<>
              <CM onClick={()=>doCtx('tap')}>↻ Tap / Untap</CM>
              <CM onClick={()=>{setBF(b=>b.map(x=>x.id===ctx.card.id?{...x,tapped:true}:x));setCtx(null);t('Moved tapped')}}>↻ Move to BF Tapped</CM>
              <CM onClick={()=>doCtx('atk')}>⚔ Declare attacker</CM>
              <CM onClick={()=>doCtx('blk')}>🛡 Declare blocker</CM>
              <CM onClick={()=>doCtx('tgt')}>◎ Target</CM>
              <Sep/>
              <CM onClick={()=>doCtx('+ctr')}>＋ Add +1/+1 counter</CM>
              <CM onClick={()=>doCtx('-ctr')}>－ Remove counter</CM>
              <CM onClick={()=>doCtx('+2ctr')}>＋＋ Add 2 counters</CM>
              <CM onClick={()=>doCtx('copy')}>⎘ Copy / Create token</CM>
              <CM onClick={()=>doCtx('modify')}>✏ Modify card</CM>
              <Sep/>
              <CM onClick={()=>doCtx('stack')}>⚡ Add to stack</CM>
              <CM onClick={()=>doCtx('hand')}>✋ Return to hand</CM>
              <CM onClick={()=>doCtx('top')}>📚 Top of library</CM>
              <CM onClick={()=>doCtx('cmd')}>⬡ Command zone</CM>
              <CM onClick={()=>{const x=bf.find(z=>z.id===ctx.card.id);if(x){setBF(b=>b.filter(z=>z.id!==ctx.card.id));setLibrary(l=>[...l,{...x,id:'lib-'+Date.now()}]);t(x.name+' → bottom');log(x.name+' → bottom')};setCtx(null)}}>📚 Bottom of library</CM>
              {ctx?.card?.isCommander && <>
                <Sep/>
                <CM onClick={()=>{returnCommanderToZone();setCtx(null)}}>⬡ Return to CMD zone</CM>
              </>}
            </>}
            <Sep/>
            <CM onClick={()=>doCtx('gy')}>☠ To graveyard</CM>
            <CM onClick={()=>doCtx('exile')}>✦ Exile</CM>
            {ctx.src==='bf'&&<><Sep/><CM danger onClick={()=>doCtx('destroy')}>✕ Destroy</CM></>}
          </div>
        </>
      )}

      {/* ── SLIDE-IN PANELS ── */}
      {panel&&!['tokens'].includes(panel)&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:360,background:'#111',borderLeft:'1px solid #333',display:'flex',flexDirection:'column',zIndex:801,animation:'sIn .2s ease'}}>
            <style>{`@keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* PANEL HEADER */}
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #222',flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:600,flex:1,color:'#e0e0e0'}}>
                {panel==='hand-view'?`Hand (${hand.length})`:
                 panel==='gy'?`Graveyard (${gy.length})`:
                 panel==='exile'?`Exile (${exileZ.length})`:
                 panel==='cmd'?`Command Zone (${cmdZ.length})`:
                 panel==='lib'?`Library (${library.length})`:
                 panel==='topN'?'Top of Library':
                 panel==='import'?'Import Deck':'Zone'}
              </span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>

            {/* ZONE TABS for GY/Exile/Cmd */}
            {['gy','exile','cmd'].includes(panel)&&(
              <div style={{display:'flex',borderBottom:'1px solid #222',flexShrink:0}}>
                {[{k:'gy',l:'Graveyard'},{k:'exile',l:'Exile'},{k:'cmd',l:'Command'}].map(({k,l})=>(
                  <div key={k} onClick={()=>setPanel(k)} style={{flex:1,padding:'7px 0',textAlign:'center',fontSize:11,cursor:'pointer',color:panel===k?'#a78bfa':'#555',borderBottom:panel===k?'2px solid #a78bfa':'2px solid transparent'}}>
                    {l}
                  </div>
                ))}
              </div>
            )}

            {/* CONTENT */}
            <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>

              {/* HAND VIEW */}
              {panel==='hand-view'&&(
                <HandPanel
                  hand={hand}
                  onClose={()=>setPanel(null)}
                  onReturnToBF={(handId)=>{
                    const c=hand.find(x=>x.id===handId)
                    if(c){setHand(h=>h.filter(x=>x.id!==handId));setBF(b=>[...b,{...c,id:'bf-'+Date.now(),x:80,y:80,tapped:false,attacking:false,blocking:false,targeted:false,counters:0}]);t(c.name+' → BF');log(c.name+' played from hand panel')}
                  }}
                  onDiscard={(handId,zone)=>{toZone(handId,'hand',zone);t('Card → '+zone)}}
                />
              )}

              {/* IMPORT */}
              {panel==='import'&&(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>Paste your deck list. Format: <code style={{color:'#888',background:'#0d0d0d',padding:'1px 4px',borderRadius:3}}>1 Card Name</code> per line.</div>
                  <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)}
                    placeholder={'1 Sol Ring\n1 Command Tower\n10 Forest\n...'}
                    style={{width:'100%',height:280,background:'#0d0d0d',border:'1px solid #333',borderRadius:6,color:'#ccc',fontSize:11,padding:10,resize:'vertical',fontFamily:'monospace',outline:'none',lineHeight:1.5}}/>
                  <button onClick={importDeck} style={{padding:'10px',borderRadius:6,background:'#2563eb',border:'none',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600}}>
                    Import & Shuffle
                  </button>
                  <div style={{fontSize:10,color:'#333',textAlign:'center'}}>Replaces current deck · deals 7 cards automatically</div>
                </div>
              )}

              {/* LIBRARY */}
              {panel==='lib'&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:4}}>
                    {[['Draw 1',()=>{drawN(1);setPanel(null)}],['Draw 3',()=>{drawN(3);setPanel(null)}],['Draw 7',()=>{drawN(7,true);setPanel(null)}],['Shuffle',()=>{shuffleLib();setPanel(null)}],['Top card',()=>lookTopN(1)],['Top 3',()=>lookTopN(3)],['Mill top',()=>{if(library.length>0){const milled=library[0];setLibrary(l=>l.slice(1));setGY(g=>[...g,{...milled,id:'z-'+Date.now()}]);t(milled.name+' milled → GY')}}]].map(([l,fn])=>(
                      <button key={l} onClick={fn} style={{padding:'8px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:11,cursor:'pointer'}}>{l}</button>
                    ))}
                  </div>
                  {/* SEARCH */}
                  <input
                    value={libSearch} onChange={e=>setLibSearch(e.target.value)}
                    placeholder="Search library..."
                    style={{width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'inherit'}}
                  />
                  <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:2}}>
                    {libSearch ? `Results: ${library.filter(c=>c.name.toLowerCase().includes(libSearch.toLowerCase())).length}` : `Contents (${library.length})`}
                  </div>
                  {library
                    .filter(c => !libSearch || c.name.toLowerCase().includes(libSearch.toLowerCase()))
                    .map((c,i)=>{
                      const realIdx = library.indexOf(c)
                      return <ZoneCard key={c.id} card={c} onHand={()=>retrieveLib(realIdx,'hand')} onBF={()=>retrieveLib(realIdx,'bf')} />
                    })
                  }
                  {libSearch && library.filter(c=>c.name.toLowerCase().includes(libSearch.toLowerCase())).length===0&&(
                    <div style={{textAlign:'center',padding:'20px 0',fontSize:12,color:'#222'}}>Not found in library</div>
                  )}
                </div>
              )}

              {/* TOP N */}
              {panel==='topN'&&(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:4}}>Top {topCards.length} card{topCards.length!==1?'s':''}</div>
                  {topCards.map((c,i)=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px',borderRadius:6,background:'#1a1a1a',border:'1px solid #222'}}>
                      <div style={{width:44,height:62,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333'}}>
                        <img src={SF(c.name)} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      </div>
                      <div style={{flex:1}}><div style={{fontSize:11,color:'#e0e0e0'}}>{c.name}</div></div>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <button onClick={()=>{drawN(1);setTopCards(tc=>tc.filter((_,j)=>j!==i));if(topCards.length<=1)setPanel(null)}} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>Draw</button>
                        <button onClick={()=>{setLibrary(l=>{const card=l[i];return[...l.filter((_,j)=>j!==i),card]});setTopCards(tc=>tc.filter((_,j)=>j!==i));t('Card → bottom')}} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#555',fontSize:9,cursor:'pointer'}}>Bottom</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{shuffleLib();setPanel(null)}} style={{padding:'8px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:11,cursor:'pointer',marginTop:4}}>Shuffle after looking</button>
                </div>
              )}

              {/* GY / EXILE / CMD */}
              {['gy','exile','cmd'].includes(panel)&&(
                panelCards.length===0?(
                  <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Nothing here yet</div>
                ):panelCards.map((card,i)=>(
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

      {/* ── TOKEN PANEL ── */}
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

      {/* MANA TRACKER */}
      {showMana&&<ManaTracker onClose={()=>setShowMana(false)}/>}

      {/* DICE ROLLER */}
      {showDice&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:5999}} onClick={()=>setShowDice(false)}/>
          <DiceRoller onClose={()=>setShowDice(false)} onLog={log}/>
        </>
      )}

      {/* DECK MANAGER */}
      {showDecks&&<DeckManager currentDeckId={currentDeckId} onLoad={loadDeck} onClose={()=>setShowDecks(false)}/>}

      {/* BATTLEFIELD RIGHT-CLICK MENU */}
      {bfCtxMenu&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9997}} onClick={()=>setBfCtxMenu(null)}/>
          <div style={{position:'fixed',left:Math.min(bfCtxMenu.x,window.innerWidth-200),top:Math.min(bfCtxMenu.y,window.innerHeight-340),background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:4,zIndex:9998,minWidth:195,boxShadow:'0 8px 32px rgba(0,0,0,.9)'}}>
            <div style={{fontSize:9,color:'#555',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #222',marginBottom:2}}>Battlefield</div>
            <CM onClick={()=>{setBF([]);setGY(g=>[...g,...bf.filter(c=>!c.isToken)]);setBfCtxMenu(null);t('All permanents → GY')}}>☠ Move All to Graveyard</CM>
            <CM onClick={()=>{const nonTok=bf.filter(c=>!c.isToken);setBF([]);setLibrary(l=>[...shuffleCards(nonTok.map(c=>({...c,id:'lib-'+Date.now()+Math.random()}))), ...l]);setBfCtxMenu(null);t('All → library (shuffled)')}}>📚 Move All to Library</CM>
            <CM onClick={()=>{const nonTok=bf.filter(c=>!c.isToken);setBF([]);setHand(h=>[...h,...nonTok.map(c=>({...c,id:'h-'+Date.now()+Math.random()}))]);setBfCtxMenu(null);t('All → hand')}}>✋ Move All to Hand</CM>
            <Sep/>
            <CM onClick={()=>{const cr=bf.filter(c=>c.type==='Creature'&&!c.isToken);setBF(b=>b.filter(c=>c.type!=='Creature'||c.isToken));setHand(h=>[...h,...cr.map(c=>({...c,id:'h-'+Date.now()+Math.random()}))]);setBfCtxMenu(null);t('All creatures → hand')}}>🐾 Move All Creatures to Hand</CM>
            <CM onClick={()=>{const la=bf.filter(c=>c.type==='Land'&&!c.isToken);setBF(b=>b.filter(c=>c.type!=='Land'||c.isToken));setHand(h=>[...h,...la.map(c=>({...c,id:'h-'+Date.now()+Math.random()}))]);setBfCtxMenu(null);t('All lands → hand')}}>🌲 Move All Lands to Hand</CM>
            <CM onClick={()=>{const ar=bf.filter(c=>c.type==='Artifact'&&!c.isToken);setBF(b=>b.filter(c=>c.type!=='Artifact'||c.isToken));setHand(h=>[...h,...ar.map(c=>({...c,id:'h-'+Date.now()+Math.random()}))]);setBfCtxMenu(null);t('All artifacts → hand')}}>⭕ Move All Artifacts to Hand</CM>
            <Sep/>
            <CM onClick={()=>{setBF(b=>b.map(c=>({...c,tapped:false})));setBfCtxMenu(null);t('All untapped')}}>↻ Untap All</CM>
            <CM onClick={()=>{setBF(b=>b.map(c=>({...c,attacking:false,blocking:false,targeted:false})));setBfCtxMenu(null);t('Combat cleared')}}>⚔ Clear Combat</CM>
          </div>
        </>
      )}

      {/* CARD MODIFY MODAL */}
      {modifyCard && (
        <CardModify
          card={modifyCard}
          onUpdate={(id, updates) => { updateCardOnBF(id, updates); t('Card updated') }}
          onClose={() => setModifyCard(null)}
        />
      )}

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:172,left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',border:'1px solid #333',borderRadius:20,padding:'6px 18px',fontSize:11,color:'#e0e0e0',zIndex:9000,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,.8)'}}>{toast}</div>}
    </div>
  )
}

// ── SHARED SUB-COMPONENTS ────────────────────────────────────
function ZoneCard({ card, onHand, onBF, onLib }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:3,cursor:'default',border:'1px solid transparent'}}
      onMouseEnter={e=>{e.currentTarget.style.background='#1a1a1a';e.currentTarget.style.borderColor='#222'}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent'}}>
      <div style={{width:40,height:56,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333',background:'#0d1a0d'}}>
        {!err?(<img src={SF(card.name)} alt={card.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>):(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#555',textAlign:'center',padding:2}}>{card.name}</div>)}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
        {card.pt&&<div style={{fontSize:9,color:'#555',marginTop:1}}>{card.pt}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3,flexShrink:0}}>
        {onHand&&<button onClick={onHand} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ Hand</button>}
        {onBF&&<button onClick={onBF} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#555',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ BF</button>}
        {onLib&&<button onClick={onLib} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#444',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ Lib</button>}
      </div>
    </div>
  )
}

function CM({onClick,children,danger}) {
  return (
    <div onClick={onClick}
      style={{padding:'7px 12px',fontSize:11,color:danger?'#777':'#888',cursor:'pointer',borderRadius:5}}
      onMouseEnter={e=>{e.currentTarget.style.background=danger?'#1a0808':'#222';e.currentTarget.style.color=danger?'#ef4444':'#e0e0e0'}}
      onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=danger?'#777':'#888'}}>
      {children}
    </div>
  )
}
function Sep(){return <div style={{borderTop:'1px solid #222',margin:'3px 0'}}/>}

// Style constants
const TB={padding:'3px 10px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#888',fontSize:12,cursor:'pointer'}
const AB={padding:'5px 10px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#ccc',fontSize:11,cursor:'pointer',whiteSpace:'nowrap'}
const ZP={padding:'4px 10px',borderRadius:20,border:'1px solid #222',background:'#1a1a1a',color:'#555',fontSize:10,cursor:'pointer',whiteSpace:'nowrap',transition:'color .1s'}
