import React, { useState, useRef, useCallback, useEffect } from 'react'

// ── SCRYFALL ────────────────────────────────────────────────
const SF = (name, ver='normal') =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=${ver}`

// ── PARSE DECK LIST ─────────────────────────────────────────
function parseDeck(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const cards = []
  let inSideboard = false
  for (const line of lines) {
    if (line.toLowerCase().startsWith('sideboard')) { inSideboard = true; continue }
    if (inSideboard) continue
    const m = line.match(/^(\d+)\s+(.+)$/)
    if (m) {
      const qty = parseInt(m[1])
      const name = m[2].trim()
      for (let i = 0; i < qty; i++) {
        cards.push({ name, id: 'deck-' + name + '-' + i + '-' + Math.random().toString(36).substr(2,4) })
      }
    }
  }
  return cards
}

// ── DEFAULT DECK (your landfall deck) ───────────────────────
const DEFAULT_DECK_TEXT = `1 Amulet of Vigor
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

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

const PHASES = ['Untap','Upkeep','Draw','Main 1','Combat','Main 2','End']
const CSUBS  = ['Attackers','Blockers','Damage','Cleanup']

// ═══════════════════════════════════════════════════════════
export default function SoloBoard({ onBack }) {
  // ── DECK STATE ────────────────────────────────────────────
  const [deckList,   setDeckList]   = useState(() => shuffle(parseDeck(DEFAULT_DECK_TEXT)))
  const [library,   setLibrary]    = useState(() => shuffle(parseDeck(DEFAULT_DECK_TEXT)))
  const [hand,      setHand]       = useState([])
  const [bf,        setBF]         = useState([])
  const [gy,        setGY]         = useState([])
  const [exileZ,    setExileZ]     = useState([])
  const [cmdZ,      setCmdZ]       = useState([])

  // ── GAME STATE ────────────────────────────────────────────
  const [life,      setLife]       = useState(40)
  const [turn,      setTurn]       = useState(1)
  const [phase,     setPhaseVal]   = useState(3)
  const [csub,      setCsub]       = useState(null)
  const [counters,  setCounters]   = useState(0) // storm/poison/etc
  const [imgErr,    setImgErr]     = useState({})
  const [dragging,  setDragging]   = useState(null)

  // ── UI STATE ──────────────────────────────────────────────
  const [ctx,       setCtx]        = useState(null)
  const [panel,     setPanel]      = useState(null) // 'gy'|'exile'|'cmd'|'lib'|'import'|'topN'
  const [toast,     setToast]      = useState(null)
  const [importTxt, setImportTxt]  = useState('')
  const [topCards,  setTopCards]   = useState([])
  const [showCounters, setShowCounters] = useState(false)

  const bfRef    = useRef(null)
  const toastRef = useRef(null)

  // ── INIT: draw opening hand ───────────────────────────────
  useEffect(() => {
    drawN(7, true)
  }, [])

  function t(msg) {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2000)
  }

  // ── LIBRARY OPERATIONS ───────────────────────────────────
  function drawN(n, init = false) {
    setLibrary(lib => {
      if (lib.length === 0) { t('Library empty!'); return lib }
      const drawn = lib.slice(0, n).map(c => ({ ...c, id: 'h-'+Date.now()+Math.random() }))
      if (!init) t(`Drew ${n} card${n>1?'s':''}`)
      setHand(h => [...h, ...drawn])
      return lib.slice(n)
    })
  }

  function drawOne() { drawN(1) }

  function shuffleLib() {
    setLibrary(l => shuffle(l))
    t('Library shuffled')
  }

  function lookTopN(n) {
    setTopCards(library.slice(0, n))
    setPanel('topN')
  }

  function bottomCard(idx) {
    setLibrary(l => {
      const card = l[idx]
      const rest = l.filter((_,i)=>i!==idx)
      return [...rest, card]
    })
    setTopCards(tc => tc.filter((_,i)=>i!==0))
    t('Card moved to bottom')
  }

  // ── PHASE ────────────────────────────────────────────────
  function goPhase(i) {
    setPhaseVal(i)
    if (i !== 4) setCsub(null)
    else setCsub(0)
    t(PHASES[i])
  }

  // ── END TURN ─────────────────────────────────────────────
  function endTurn() {
    setBF(b => b.map(c => ({ ...c, tapped:false, attacking:false, blocking:false, targeted:false })))
    setTurn(n => n+1)
    setPhaseVal(3); setCsub(null)
    drawOne()
    t('Turn ' + (turn+1))
  }

  // ── RESTART ──────────────────────────────────────────────
  function restart() {
    const fresh = shuffle(parseDeck(DEFAULT_DECK_TEXT))
    setLibrary(fresh)
    setHand([])
    setBF([])
    setGY([])
    setExileZ([])
    setCmdZ([])
    setLife(40)
    setTurn(1)
    setPhaseVal(3)
    setCsub(null)
    setCounters(0)
    setTimeout(() => drawN(7, true), 50)
    t('Game restarted')
  }

  // ── ADD TOKEN ────────────────────────────────────────────
  function addToken(name, pt, col='cg') {
    const x = 50 + Math.random()*200
    const y = 50 + Math.random()*100
    setBF(b => [...b, { id:'tok-'+Date.now(), name, type:'Token', col, art:'◈', pt, x, y, tapped:false, attacking:false, blocking:false, targeted:false, counters:0, isToken:true }])
    t(`${name} token created`)
  }

  // ── PLAY FROM HAND ───────────────────────────────────────
  function playCard(handId, x, y) {
    const card = hand.find(c=>c.id===handId)
    if (!card) return
    setHand(h => h.filter(c=>c.id!==handId))
    setBF(b => [...b, { ...card, id:'bf-'+Date.now(), x:Math.max(0,x), y:Math.max(0,y), tapped:false, attacking:false, blocking:false, targeted:false, counters:0 }])
    t(card.name + ' played')
  }

  // ── MOVE ON BF ───────────────────────────────────────────
  function moveBF(id, x, y) {
    setBF(b => b.map(c => c.id===id ? {...c, x:Math.max(0,x), y:Math.max(0,y)} : c))
  }

  // ── TAP ──────────────────────────────────────────────────
  function tapCard(id) {
    setBF(b => b.map(c => c.id===id ? {...c, tapped:!c.tapped} : c))
  }

  // ── SEND TO ZONE ─────────────────────────────────────────
  function toZone(id, src, zone) {
    let card
    if (src==='hand') { card=hand.find(c=>c.id===id); setHand(h=>h.filter(c=>c.id!==id)) }
    else              { card=bf.find(c=>c.id===id);   setBF(b=>b.filter(c=>c.id!==id)) }
    if (!card) return
    const e = {...card, id:'z-'+Date.now()+Math.random()}
    if (zone==='gy')     { setGY(z=>[...z,e]);     t(card.name+' → graveyard') }
    if (zone==='exile')  { setExileZ(z=>[...z,e]); t(card.name+' → exile') }
    if (zone==='cmd')    { setCmdZ(z=>[...z,e]);   t(card.name+' → command zone') }
  }

  // ── RETRIEVE FROM ZONE ───────────────────────────────────
  function retrieve(zone, idx, dest) {
    let card, setter
    if (zone==='gy')    { card=gy[idx];    setter=setGY }
    if (zone==='exile') { card=exileZ[idx]; setter=setExileZ }
    if (zone==='cmd')   { card=cmdZ[idx];  setter=setCmdZ }
    if (!card) return
    setter(z => z.filter((_,i)=>i!==idx))
    if (dest==='hand') { setHand(h=>[...h,{...card,id:'r-'+Date.now()}]); t(card.name+' → hand') }
    if (dest==='bf')   { setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0}]); t(card.name+' → battlefield') }
    if (dest==='lib')  { setLibrary(l=>[...l,{...card,id:'lib-'+Date.now()}]); t(card.name+' → library') }
  }

  // ── CONTEXT MENU ─────────────────────────────────────────
  function doCtx(action) {
    if (!ctx) return
    const {card, src} = ctx
    setCtx(null)
    switch(action) {
      case 'tap':    tapCard(card.id); break
      case 'atk':    setBF(b=>b.map(c=>c.id===card.id?{...c,attacking:!c.attacking}:c)); break
      case 'blk':    setBF(b=>b.map(c=>c.id===card.id?{...c,blocking:!c.blocking}:c)); break
      case 'tgt':    setBF(b=>b.map(c=>({...c,targeted:c.id===card.id?!c.targeted:c.targeted}))); break
      case '+ctr':   setBF(b=>b.map(c=>c.id===card.id?{...c,counters:(c.counters||0)+1}:c)); t('+1/+1 on '+card.name); break
      case '-ctr':   setBF(b=>b.map(c=>c.id===card.id?{...c,counters:Math.max(0,(c.counters||0)-1)}:c)); break
      case 'dbl':    setBF(b=>b.map(c=>c.id===card.id?{...c,counters:(c.counters||0)+2}:c)); t('+2 on '+card.name); break
      case 'hand':
        const bcard = bf.find(c=>c.id===card.id)
        if(bcard){setBF(b=>b.filter(c=>c.id!==card.id));setHand(h=>[...h,{...bcard,id:'r-'+Date.now()}]);t(card.name+' → hand')}
        break
      case 'top':
        const btop = bf.find(c=>c.id===card.id)
        if(btop){setBF(b=>b.filter(c=>c.id!==card.id));setLibrary(l=>[{...btop,id:'lib-'+Date.now()},...l]);t(card.name+' → top of library')}
        break
      case 'gy':      toZone(card.id, src, 'gy'); break
      case 'exile':   toZone(card.id, src, 'exile'); break
      case 'cmd':     toZone(card.id, src, 'cmd'); break
      case 'destroy': toZone(card.id, src, 'gy'); break
      case 'copy':
        const orig = bf.find(c=>c.id===card.id)
        if(orig) setBF(b=>[...b,{...orig,id:'copy-'+Date.now(),x:orig.x+10,y:orig.y+10}])
        t('Copy of '+card.name+' created'); break
    }
  }

  // ── IMPORT DECK ───────────────────────────────────────────
  function importDeck() {
    const parsed = parseDeck(importTxt)
    if (parsed.length === 0) { t('No cards found — check format'); return }
    const shuffled = shuffle(parsed)
    setLibrary(shuffled)
    setHand([])
    setBF([])
    setGY([])
    setExileZ([])
    setCmdZ([])
    setLife(40)
    setTurn(1)
    setCounters(0)
    setPanel(null)
    setImportTxt('')
    setTimeout(() => drawN(7, true), 50)
    t(`Loaded ${parsed.length} cards, drew 7`)
  }

  // ── DRAG FROM HAND ───────────────────────────────────────
  const hDrag = useRef(null)

  function handDown(e, card) {
    if (e.button !== 0) return
    e.preventDefault()
    hDrag.current = { card, moved:false, sx:e.clientX, sy:e.clientY }

    const ghost = mkGhost(e.clientX-46, e.clientY-64, card.name, 92)
    document.body.appendChild(ghost)

    function mv(me) {
      ghost.style.left = (me.clientX-46)+'px'
      ghost.style.top  = (me.clientY-64)+'px'
      if (Math.abs(me.clientX-e.clientX)>4||Math.abs(me.clientY-e.clientY)>4) hDrag.current.moved=true
      const bf = bfRef.current
      if (bf) {
        const r=bf.getBoundingClientRect()
        const over=me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom
        bf.style.outline = over?'2px solid #a78bfa':''
      }
    }
    function up(me) {
      window.removeEventListener('mousemove',mv)
      window.removeEventListener('mouseup',up)
      ghost.remove()
      if (bfRef.current) bfRef.current.style.outline=''
      if (!hDrag.current?.moved) { hDrag.current=null; return }
      const bfEl = bfRef.current
      if (bfEl) {
        const r=bfEl.getBoundingClientRect()
        if (me.clientX>=r.left&&me.clientX<=r.right&&me.clientY>=r.top&&me.clientY<=r.bottom) {
          playCard(card.id, me.clientX-r.left-46, me.clientY-r.top-64)
        }
      }
      hDrag.current=null
    }
    window.addEventListener('mousemove',mv)
    window.addEventListener('mouseup',up)
  }

  // ── DRAG ON BF ───────────────────────────────────────────
  const bDrag = useRef(null)

  function bfDown(e, card) {
    if (e.button!==0) return
    e.preventDefault(); e.stopPropagation()
    const bfEl=bfRef.current
    if (!bfEl) return
    const r=bfEl.getBoundingClientRect()
    const offX=e.clientX-r.left-card.x
    const offY=e.clientY-r.top-card.y
    bDrag.current={card,moved:false,sx:e.clientX,sy:e.clientY,offX,offY}
    setDragging(card.id)

    const ghost=mkGhost(e.clientX-offX, e.clientY-offY, card.name, 92)
    document.body.appendChild(ghost)

    function mv(me) {
      ghost.style.left=(me.clientX-offX)+'px'
      ghost.style.top=(me.clientY-offY)+'px'
      if(Math.abs(me.clientX-e.clientX)>3||Math.abs(me.clientY-e.clientY)>3) bDrag.current.moved=true
      // pile highlight
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        const over=me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom
        p.style.borderColor=over?'#a78bfa':''
        p.style.background=over?'rgba(167,139,250,.1)':''
      })
    }
    function up(me) {
      window.removeEventListener('mousemove',mv)
      window.removeEventListener('mouseup',up)
      ghost.remove()
      setDragging(null)
      document.querySelectorAll('[data-pile]').forEach(p=>{p.style.borderColor='';p.style.background=''})

      if (!bDrag.current?.moved) { tapCard(card.id); bDrag.current=null; return }

      // check pile drop
      let droppedOnPile=false
      document.querySelectorAll('[data-pile]').forEach(p=>{
        const pr=p.getBoundingClientRect()
        if(me.clientX>=pr.left&&me.clientX<=pr.right&&me.clientY>=pr.top&&me.clientY<=pr.bottom){
          toZone(card.id,'bf',p.dataset.pile)
          droppedOnPile=true
        }
      })
      if(!droppedOnPile){
        const r2=bfRef.current?.getBoundingClientRect()
        if(r2) moveBF(card.id, me.clientX-r2.left-offX, me.clientY-r2.top-offY)
      }
      bDrag.current=null
    }
    window.addEventListener('mousemove',mv)
    window.addEventListener('mouseup',up)
  }

  function mkGhost(left, top, name, w=92) {
    const g=document.createElement('div')
    g.style.cssText=`position:fixed;pointer-events:none;z-index:9999;width:${w}px;height:${Math.round(w*1.4)}px;border-radius:6px;border:2px solid #a78bfa;box-shadow:0 12px 32px rgba(0,0,0,.9);background:#0d1a0d;display:flex;align-items:center;justify-content:center;font-size:11px;color:#aaa;opacity:.9;transform:rotate(3deg) scale(1.04);left:${left}px;top:${top}px;overflow:hidden;`
    const img=document.createElement('img')
    img.src=SF(name)
    img.style.cssText='width:100%;height:100%;object-fit:cover;'
    img.onerror=()=>{g.textContent=name}
    g.appendChild(img)
    return g
  }

  // ── RENDER ───────────────────────────────────────────────
  const lifeCol = life<=10?'#ef4444':life<=20?'#f59e0b':'#e0e0e0'
  const panelArr = panel==='gy'?gy:panel==='exile'?exileZ:panel==='cmd'?cmdZ:[]

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#1a1a1a',overflow:'hidden',fontFamily:'system-ui,sans-serif',color:'#e0e0e0',userSelect:'none'}}>

      {/* ── TOP BAR (Moxfield style) ── */}
      <div style={{display:'flex',alignItems:'center',gap:0,padding:'0 8px',background:'#111',borderBottom:'1px solid #333',flexShrink:0,height:40}}>
        {/* LEFT: life + counters + turn */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={()=>setLife(l=>Math.max(0,l-1))} style={topBtn}>−</button>
          <span style={{fontSize:18,fontWeight:700,color:lifeCol,minWidth:32,textAlign:'center'}}>{life}</span>
          <button onClick={()=>setLife(l=>l+1)} style={topBtn}>+</button>
          <div style={{width:1,height:20,background:'#333',margin:'0 4px'}}/>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowCounters(s=>!s)} style={{...topBtn,fontSize:11}}>Counters ▾</button>
            {showCounters&&(
              <div style={{position:'absolute',top:'100%',left:0,background:'#111',border:'1px solid #333',borderRadius:6,padding:8,zIndex:200,minWidth:140,boxShadow:'0 8px 24px rgba(0,0,0,.8)'}}>
                <div style={{fontSize:10,color:'#555',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Poison / Storm / Custom</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <button onClick={()=>setCounters(c=>Math.max(0,c-1))} style={topBtn}>−</button>
                  <span style={{fontSize:16,fontWeight:700,minWidth:24,textAlign:'center'}}>{counters}</span>
                  <button onClick={()=>setCounters(c=>c+1)} style={topBtn}>+</button>
                </div>
              </div>
            )}
          </div>
          <div style={{width:1,height:20,background:'#333',margin:'0 4px'}}/>
          <span style={{fontSize:12,color:'#888'}}>Turn <b style={{color:'#e0e0e0'}}>{turn}</b></span>
        </div>

        {/* CENTER: phase bar */}
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:1}}>
          {PHASES.map((p,i)=>(
            <React.Fragment key={p}>
              <div onClick={()=>goPhase(i)} style={{padding:'3px 9px',fontSize:9,borderRadius:3,cursor:'pointer',textTransform:'uppercase',letterSpacing:'.05em',color:phase===i?'#fff':phase>i?'#444':'#333',background:phase===i?'#2563eb':'transparent',transition:'all .1s'}}>
                {p}
              </div>
              {i<PHASES.length-1&&<span style={{color:'#2a2a2a',fontSize:10}}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* RIGHT: action buttons */}
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <button onClick={restart}              style={actionBtn}>Restart</button>
          <button onClick={()=>setPanel('token')} style={actionBtn}>Add Token</button>
          <button onClick={shuffleLib}            style={actionBtn}>Shuffle</button>
          <button onClick={()=>lookTopN(1)}       style={actionBtn}>Top Card</button>
          <button onClick={()=>setPanel('lib')}   style={actionBtn}>View Library</button>
          <button onClick={()=>setPanel('import')} style={actionBtn}>Import Deck</button>
          <button onClick={drawOne}               style={actionBtn}>Draw</button>
          <button onClick={endTurn}               style={{...actionBtn,background:'#2563eb',border:'1px solid #3b82f6',color:'#fff',fontWeight:600}}>Next Turn</button>
        </div>
      </div>

      {/* COMBAT SUB-PHASES */}
      {phase===4&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'3px 8px',background:'#0d0d0d',borderBottom:'1px solid #222',flexShrink:0}}>
          <span style={{fontSize:8,color:'#555',marginRight:6,textTransform:'uppercase',letterSpacing:'.06em'}}>Combat ›</span>
          {CSUBS.map((s,i)=>(
            <React.Fragment key={s}>
              <div onClick={()=>setCsub(i)} style={{padding:'2px 8px',fontSize:9,borderRadius:3,cursor:'pointer',textTransform:'uppercase',color:csub===i?'#a78bfa':'#333',background:csub===i?'#14102a':'transparent',border:csub===i?'1px solid #3a2d6a':'1px solid transparent'}}>
                {s}
              </div>
              {i<3&&<span style={{color:'#222',fontSize:10}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── BATTLEFIELD ── */}
      <div
        ref={bfRef}
        style={{flex:1,position:'relative',overflow:'hidden',background:'#141414',cursor:'default'}}
        onClick={()=>{setCtx(null);setShowCounters(false)}}
      >
        {bf.length===0&&(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#2a2a2a',pointerEvents:'none',flexDirection:'column',gap:8}}>
            <div>Drag cards from hand to play them here</div>
            <div style={{fontSize:11,color:'#222'}}>Click a card to tap · Right-click for options</div>
          </div>
        )}

        {bf.map(card=>{
          const err=imgErr[card.id+'bf']
          const borderCol=card.targeted?'#60a5fa':card.attacking?'#ef4444':card.blocking?'#f59e0b':'#444'
          return (
            <div key={card.id}
              onMouseDown={e=>bfDown(e,card)}
              onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,card,src:'bf'})}}
              style={{
                position:'absolute',left:card.x,top:card.y,
                width:92,height:128,
                borderRadius:7,border:`1.5px solid ${borderCol}`,
                background:'#0d1a0d',
                cursor:'grab',overflow:'hidden',
                transform:card.tapped?'rotate(15deg)':'none',
                transformOrigin:'50% 85%',
                opacity:dragging===card.id?0.2:1,
                zIndex:card.attacking?50:card.tapped?5:10,
                boxShadow:card.attacking?'0 0 0 2px rgba(239,68,68,.4),0 4px 12px rgba(0,0,0,.6)':card.targeted?'0 0 0 2px rgba(96,165,250,.4)':'0 3px 10px rgba(0,0,0,.7)',
                userSelect:'none',transition:'opacity .1s',
              }}>
              {!err?(
                <img src={SF(card.name)} alt={card.name} draggable={false}
                  style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                  onError={()=>setImgErr(p=>({...p,[card.id+'bf']:true}))}/>
              ):(
                <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:4}}>
                  <div style={{fontSize:9,color:'#aaa',textAlign:'center',lineHeight:1.3,wordBreak:'break-word'}}>{card.name}</div>
                  {card.pt&&<div style={{fontSize:10,fontWeight:700,color:'#ccc',marginTop:4}}>{card.pt}</div>}
                </div>
              )}
              {/* P/T badge */}
              {card.pt&&!err&&(
                <div style={{position:'absolute',bottom:3,right:4,fontSize:8,fontWeight:700,color:'#fff',textShadow:'0 1px 3px rgba(0,0,0,1)',background:'rgba(0,0,0,.4)',borderRadius:3,padding:'0 3px'}}>{card.pt}</div>
              )}
              {/* Counter badge */}
              {(card.counters||0)>0&&(
                <div style={{position:'absolute',top:-5,left:-5,width:18,height:18,borderRadius:'50%',background:'#2563eb',border:'2px solid #0a0a0a',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5}}>
                  {card.counters}
                </div>
              )}
              {/* Token badge */}
              {card.isToken&&(
                <div style={{position:'absolute',top:2,right:2,fontSize:7,padding:'1px 4px',borderRadius:3,background:'rgba(124,58,237,.7)',color:'#e0e0e0'}}>TOKEN</div>
              )}
              {/* Attacking indicator */}
              {card.attacking&&(
                <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:11,color:'#ef4444',filter:'drop-shadow(0 0 4px rgba(239,68,68,.8))'}}>⚔</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── BOTTOM BAR (Moxfield style) ── */}
      <div style={{background:'#111',borderTop:'1px solid #333',flexShrink:0}}>

        {/* HAND */}
        <div style={{display:'flex',alignItems:'flex-end',gap:5,padding:'8px 10px 6px',overflowX:'auto',overflowY:'visible',minHeight:148}}>
          {hand.map(card=>{
            const err=imgErr[card.id+'h']
            return (
              <div key={card.id}
                onMouseDown={e=>handDown(e,card)}
                onContextMenu={e=>{e.preventDefault();setCtx({x:e.clientX,y:e.clientY,card,src:'hand'})}}
                style={{flexShrink:0,width:92,height:128,borderRadius:7,border:'1.5px solid #444',background:'#0d1a0d',cursor:'grab',overflow:'hidden',position:'relative',transition:'transform .12s,border-color .1s,box-shadow .1s',boxShadow:'0 3px 10px rgba(0,0,0,.7)'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-12px)';e.currentTarget.style.borderColor='#a78bfa';e.currentTarget.style.boxShadow='0 10px 24px rgba(0,0,0,.9),0 0 0 1px rgba(167,139,250,.4)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='#444';e.currentTarget.style.boxShadow='0 3px 10px rgba(0,0,0,.7)'}}>
                {!err?(
                  <img src={SF(card.name)} alt={card.name} draggable={false}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                    onError={()=>setImgErr(p=>({...p,[card.id+'h']:true}))}/>
                ):(
                  <div style={{width:'100%',height:'100%',background:'#1a1a2a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:6}}>
                    <div style={{fontSize:9,color:'#aaa',textAlign:'center',lineHeight:1.4}}>{card.name}</div>
                  </div>
                )}
              </div>
            )
          })}
          {hand.length===0&&<div style={{fontSize:11,color:'#2a2a2a',padding:'0 8px',alignSelf:'center'}}>Hand is empty</div>}
        </div>

        {/* ZONE PILLS (bottom row — Moxfield style) */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px 6px',borderTop:'1px solid #222'}}>
          <div onClick={()=>setPanel('hand-cnt')} style={zonePill}>Hand ({hand.length})</div>
          <div onClick={()=>setPanel('lib')}      style={zonePill}>Library ({library.length})</div>
          <div onClick={()=>setPanel('gy')}        style={{...zonePill,color:gy.length>0?'#aaa':'#555'}}>Graveyard ({gy.length})</div>
          <div onClick={()=>setPanel('exile')}     style={{...zonePill,color:exileZ.length>0?'#aaa':'#555'}}>Exile ({exileZ.length})</div>
          <div onClick={()=>setPanel('cmd')}       style={{...zonePill,color:cmdZ.length>0?'#a78bfa':'#555'}}>Command ({cmdZ.length})</div>
        </div>
      </div>

      {/* ── CONTEXT MENU ── */}
      {ctx&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:9998}} onClick={()=>setCtx(null)}/>
          <div style={{position:'fixed',left:Math.min(ctx.x,window.innerWidth-190),top:Math.min(ctx.y,window.innerHeight-380),background:'#1a1a1a',border:'1px solid #333',borderRadius:8,padding:4,zIndex:9999,minWidth:185,boxShadow:'0 8px 32px rgba(0,0,0,.9)'}}>
            <div style={{fontSize:9,color:'#555',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #222',marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ctx.card.name}</div>
            {ctx.src==='bf'&&<>
              <CM onClick={()=>doCtx('tap')}>↻ Tap / Untap</CM>
              <CM onClick={()=>doCtx('atk')}>⚔ Declare attacker</CM>
              <CM onClick={()=>doCtx('blk')}>🛡 Declare blocker</CM>
              <CM onClick={()=>doCtx('tgt')}>◎ Target</CM>
              <Sep/>
              <CM onClick={()=>doCtx('+ctr')}>＋ Add +1/+1 counter</CM>
              <CM onClick={()=>doCtx('-ctr')}>－ Remove counter</CM>
              <CM onClick={()=>doCtx('dbl')}>＋＋ Add 2 counters</CM>
              <Sep/>
              <CM onClick={()=>doCtx('copy')}>⎘ Copy / Create token</CM>
              <CM onClick={()=>doCtx('hand')}>✋ Return to hand</CM>
              <CM onClick={()=>doCtx('top')}>📚 Put on top of library</CM>
              <CM onClick={()=>doCtx('cmd')}>⬡ Command zone</CM>
            </>}
            <Sep/>
            <CM onClick={()=>doCtx('gy')}>☠ To graveyard</CM>
            <CM onClick={()=>doCtx('exile')}>✦ Exile</CM>
            {ctx.src==='bf'&&<><Sep/><CM danger onClick={()=>doCtx('destroy')}>✕ Destroy</CM></>}
          </div>
        </>
      )}

      {/* ── PANELS (slide in from right) ── */}
      {panel&&panel!=='token'&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:340,background:'#111',borderLeft:'1px solid #333',display:'flex',flexDirection:'column',zIndex:801,animation:'sIn .2s ease'}}>
            <style>{`@keyframes sIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* PANEL HEADER */}
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #222',flexShrink:0}}>
              <span style={{fontSize:14,fontWeight:600,flex:1,color:'#e0e0e0'}}>
                {panel==='gy'?`Graveyard (${gy.length})`:panel==='exile'?`Exile (${exileZ.length})`:panel==='cmd'?`Command Zone (${cmdZ.length})`:panel==='lib'?`Library (${library.length})`:panel==='import'?'Import Deck':panel==='topN'?'Top of Library':'Zone'}
              </span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>

            {/* ZONE TABS */}
            {['gy','exile','cmd'].includes(panel)&&(
              <div style={{display:'flex',borderBottom:'1px solid #222',flexShrink:0}}>
                {[{k:'gy',l:'Graveyard'},{k:'exile',l:'Exile'},{k:'cmd',l:'Command'}].map(({k,l})=>(
                  <div key={k} onClick={()=>setPanel(k)}
                    style={{flex:1,padding:'8px 0',textAlign:'center',fontSize:11,cursor:'pointer',color:panel===k?'#a78bfa':'#555',borderBottom:panel===k?'2px solid #a78bfa':'2px solid transparent',transition:'color .1s'}}>
                    {l}
                  </div>
                ))}
              </div>
            )}

            {/* PANEL CONTENT */}
            <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>

              {/* IMPORT */}
              {panel==='import'&&(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.5}}>Paste your deck list below. Format: <code style={{color:'#888'}}>1 Card Name</code> per line. Moxfield, Archidekt, MTGO export all work.</div>
                  <textarea
                    value={importTxt}
                    onChange={e=>setImportTxt(e.target.value)}
                    placeholder="1 Sol Ring&#10;1 Command Tower&#10;10 Forest&#10;..."
                    style={{width:'100%',height:300,background:'#0d0d0d',border:'1px solid #333',borderRadius:6,color:'#ccc',fontSize:11,padding:10,resize:'vertical',fontFamily:'monospace',outline:'none',lineHeight:1.5}}
                  />
                  <button onClick={importDeck} style={{padding:'10px',borderRadius:6,background:'#2563eb',border:'none',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600}}>
                    Import & Shuffle
                  </button>
                  <div style={{fontSize:10,color:'#333',textAlign:'center'}}>Will replace current deck and deal 7 cards</div>
                </div>
              )}

              {/* LIBRARY */}
              {panel==='lib'&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
                    <button onClick={()=>{drawOne();setPanel(null)}}     style={libBtn}>Draw 1</button>
                    <button onClick={()=>{drawN(3);setPanel(null)}}       style={libBtn}>Draw 3</button>
                    <button onClick={()=>{drawN(7,true);setPanel(null)}}  style={libBtn}>Draw 7</button>
                    <button onClick={()=>{shuffleLib();setPanel(null)}}   style={libBtn}>Shuffle</button>
                    <button onClick={()=>lookTopN(1)}                     style={libBtn}>Look at top</button>
                    <button onClick={()=>lookTopN(3)}                     style={libBtn}>Look at top 3</button>
                    <button onClick={()=>lookTopN(7)}                     style={libBtn}>Scry 7</button>
                  </div>
                  <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Library contents ({library.length} cards)</div>
                  {library.map((c,i)=>(
                    <ZoneCard key={c.id} card={c} onHand={()=>retrieve_lib(i,'hand')} onBF={()=>retrieve_lib(i,'bf')} />
                  ))}
                </div>
              )}

              {/* TOP N CARDS */}
              {panel==='topN'&&(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:4}}>Top {topCards.length} card{topCards.length!==1?'s':''} of your library</div>
                  {topCards.map((c,i)=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,background:'#1a1a1a'}}>
                      <div style={{width:44,height:62,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333'}}>
                        <img src={SF(c.name)} alt={c.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,color:'#e0e0e0'}}>{c.name}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:3}}>
                        <button onClick={()=>{drawN(1);setTopCards(tc=>tc.filter((_,j)=>j!==i));if(topCards.length<=1)setPanel(null)}} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>Draw</button>
                        <button onClick={()=>bottomCard(i)} style={{padding:'3px 7px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#555',fontSize:9,cursor:'pointer'}}>Bottom</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{shuffleLib();setPanel(null)}} style={{...libBtn,marginTop:4}}>Shuffle after looking</button>
                </div>
              )}

              {/* TOKEN PANEL */}
              {panel==='token'&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:4}}>Quick tokens</div>
                  {[
                    ['Beast Token','3/3'],['Saproling','1/1'],['Goblin','1/1'],
                    ['Soldier','1/1'],['Zombie','2/2'],['Dragon','5/5 Flying'],
                    ['Elephant','3/3'],['Treasure','Artifact'],['Clue','Artifact'],
                    ['Food','Artifact'],['Plant','0/1'],['Spider','1/2 Reach'],
                  ].map(([name,pt])=>(
                    <button key={name} onClick={()=>{addToken(name,pt);setPanel(null)}}
                      style={{padding:'8px 10px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#ccc',fontSize:11,cursor:'pointer',textAlign:'left'}}>
                      {name} <span style={{color:'#555',fontSize:10}}>({pt})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* GY / EXILE / CMD */}
              {['gy','exile','cmd'].includes(panel)&&(
                panelArr.length===0?(
                  <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Nothing here yet</div>
                ):panelArr.map((card,i)=>(
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

      {/* TOKEN PANEL (triggered from top button) */}
      {panel==='token'&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:280,background:'#111',borderLeft:'1px solid #333',display:'flex',flexDirection:'column',zIndex:801,animation:'sIn .2s ease',padding:16,gap:6,overflowY:'auto'}}>
            <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:600,flex:1}}>Add Token</span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>
            {[
              ['Beast Token','3/3'],['Saproling Token','1/1'],['Goblin Token','1/1'],
              ['Soldier Token','1/1'],['Zombie Token','2/2'],['Dragon Token','5/5'],
              ['Elephant Token','3/3'],['Treasure Token','—'],['Clue Token','—'],
              ['Food Token','—'],['Plant Token','0/1'],['Spider Token','1/2'],
              ['Insect Token','1/1'],['Cat Token','2/2'],['Bird Token','1/1 Flying'],
            ].map(([name,pt])=>(
              <button key={name} onClick={()=>{addToken(name,pt);setPanel(null)}}
                style={{padding:'9px 12px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#ccc',fontSize:12,cursor:'pointer',textAlign:'left',width:'100%'}}>
                {name} <span style={{color:'#555',fontSize:10}}>· {pt}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:172,left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',border:'1px solid #333',borderRadius:20,padding:'6px 18px',fontSize:11,color:'#e0e0e0',zIndex:9000,pointerEvents:'none',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,.8)'}}>{toast}</div>}
    </div>
  )

  function retrieve_lib(idx, dest) {
    const card = library[idx]
    if (!card) return
    setLibrary(l => l.filter((_,i)=>i!==idx))
    if (dest==='hand') setHand(h=>[...h,{...card,id:'h-'+Date.now()}])
    if (dest==='bf')   setBF(b=>[...b,{...card,id:'bf-'+Date.now(),x:60,y:60,tapped:false,attacking:false,blocking:false,targeted:false,counters:0}])
    t(card.name + (dest==='hand'?' → hand':' → battlefield'))
  }
}

// ── SUB-COMPONENTS ─────────────────────────────────────────
function ZoneCard({ card, onHand, onBF, onLib }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:2,cursor:'default'}}
      onMouseEnter={e=>e.currentTarget.style.background='#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div style={{width:40,height:56,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333',background:'#0d1a0d'}}>
        {!err?(
          <img src={SF(card.name)} alt={card.name} draggable={false}
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
            onError={()=>setErr(true)}/>
        ):(
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#555',textAlign:'center',padding:2}}>{card.name}</div>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
        {card.pt&&<div style={{fontSize:9,color:'#555',marginTop:1}}>{card.pt}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:3}}>
        <button onClick={onHand} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ Hand</button>
        {onBF&&<button onClick={onBF} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#666',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ BF</button>}
        {onLib&&<button onClick={onLib} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #222',background:'#111',color:'#666',fontSize:9,cursor:'pointer',whiteSpace:'nowrap'}}>→ Lib</button>}
      </div>
    </div>
  )
}

function CM({onClick,children,danger}) {
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

const topBtn = {padding:'3px 10px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#888',fontSize:12,cursor:'pointer'}
const actionBtn = {padding:'5px 12px',borderRadius:4,border:'1px solid #333',background:'#1a1a1a',color:'#ccc',fontSize:11,cursor:'pointer',whiteSpace:'nowrap'}
const zonePill = {padding:'4px 10px',borderRadius:20,border:'1px solid #222',background:'#1a1a1a',color:'#555',fontSize:10,cursor:'pointer',whiteSpace:'nowrap',transition:'color .1s'}
const libBtn = {padding:'8px',borderRadius:5,border:'1px solid #222',background:'#1a1a1a',color:'#888',fontSize:11,cursor:'pointer'}
