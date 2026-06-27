import React, { useState, useRef, useCallback, useEffect } from 'react'

// ── SCRYFALL IMAGE ──────────────────────────────────────────
function sfImg(name) {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`
}

// ── CARD COLORS ─────────────────────────────────────────────
const BG = {
  cg:'#0d1a0d',cu:'#0d1220',cr:'#180d0d',cb:'#100d18',
  cw:'#1a1a0d',ca:'#161616',cforest:'#0d1a0d',cisland:'#0d1220',
  cmtn:'#180d0d',cswamp:'#100d18',cplains:'#1a1a0d',
}
const BD = {
  cg:'#1e3a1e',cu:'#1a2a5a',cr:'#4a1a1a',cb:'#2a1a4a',
  cw:'#3a3a1a',ca:'#2a2a2a',cforest:'#1a3a1a',cisland:'#1a2a4a',
  cmtn:'#3a1a1a',cswamp:'#2a1a3a',cplains:'#2a2a1a',
}

// ── INITIAL STATE ────────────────────────────────────────────
const INIT_HAND = [
  {id:'h1',name:'Llanowar Elves',    type:'Creature',    col:'cg',    art:'🌿',pt:'1/1'},
  {id:'h2',name:'Cultivate',         type:'Sorcery',     col:'cg',    art:'🌿',pt:''},
  {id:'h3',name:'Counterspell',      type:'Instant',     col:'cu',    art:'🌊',pt:''},
  {id:'h4',name:'Forest',            type:'Land',        col:'cforest',art:'🌲',pt:''},
  {id:'h5',name:'Rhystic Study',     type:'Enchantment', col:'cu',    art:'📚',pt:''},
  {id:'h6',name:'Sol Ring',          type:'Artifact',    col:'ca',    art:'⭕',pt:''},
  {id:'h7',name:'Craterhoof Behemoth',type:'Creature',   col:'cg',    art:'🐾',pt:'5/5'},
]
const INIT_BF = [
  {id:'b1',name:'Forest',x:20, y:20,type:'Land',    col:'cforest',art:'🌲',pt:'',tapped:false,counters:0},
  {id:'b2',name:'Forest',x:90, y:20,type:'Land',    col:'cforest',art:'🌲',pt:'',tapped:true, counters:0},
  {id:'b3',name:'Island',x:160,y:20,type:'Land',    col:'cisland',art:'💧',pt:'',tapped:false,counters:0},
  {id:'b4',name:'Sol Ring',x:240,y:20,type:'Artifact',col:'ca',art:'⭕',pt:'',tapped:true,counters:0},
]
const DRAW_POOL = [
  {name:'Llanowar Elves',    type:'Creature',    col:'cg',    art:'🌿',pt:'1/1'},
  {name:'Explore',           type:'Sorcery',     col:'cg',    art:'🌿',pt:''},
  {name:'Ponder',            type:'Sorcery',     col:'cu',    art:'🌊',pt:''},
  {name:'Forest',            type:'Land',        col:'cforest',art:'🌲',pt:''},
  {name:'Island',            type:'Land',        col:'cisland',art:'💧',pt:''},
  {name:'Beast Within',      type:'Instant',     col:'cg',    art:'🐾',pt:''},
  {name:'Arcane Signet',     type:'Artifact',    col:'ca',    art:'⭕',pt:''},
  {name:'Cyclonic Rift',     type:'Instant',     col:'cu',    art:'🌊',pt:''},
  {name:'Command Tower',     type:'Land',        col:'cforest',art:'🌲',pt:''},
]
const PHASES = ['Untap','Upkeep','Draw','Main 1','Combat','Main 2','End']
const COMBAT_SUBS = ['Attackers','Blockers','Damage','Cleanup']

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function SoloBoard({ onBack }) {
  const [hand,    setHand]    = useState(INIT_HAND)
  const [bf,      setBF]      = useState(INIT_BF)
  const [life,    setLife]    = useState(40)
  const [gy,      setGY]      = useState([])
  const [exile,   setExile]   = useState([])
  const [cmd,     setCmd]     = useState([])
  const [deck,    setDeck]    = useState(91)
  const [turn,    setTurn]    = useState(1)
  const [phase,   setPhase]   = useState(3)
  const [csub,    setCsub]    = useState(null)
  const [toast,   setToast]   = useState(null)
  const [ctx,     setCtx]     = useState(null)  // {x,y,card,src}
  const [panel,   setPanel]   = useState(null)  // 'gy'|'exile'|'cmd'|'lib'
  const [imgErr,  setImgErr]  = useState({})
  const [draggingId, setDraggingId] = useState(null)

  const bfRef    = useRef(null)
  const toastRef = useRef(null)

  function toast_(msg) {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2000)
  }

  // ── PHASE ──────────────────────────────────────────────────
  function goPhase(i) {
    setPhase(i)
    if (i !== 4) setCsub(null)
    else setCsub(0)
    toast_(PHASES[i])
  }

  // ── END TURN ───────────────────────────────────────────────
  function endTurn() {
    setBF(b => b.map(c => ({ ...c, tapped:false, attacking:false, blocking:false, targeted:false })))
    setTurn(t => t + 1)
    const drawn = DRAW_POOL[Math.floor(Math.random() * DRAW_POOL.length)]
    setHand(h => [...h, { id:'d-'+Date.now(), ...drawn }])
    setDeck(d => Math.max(0, d-1))
    setPhase(3); setCsub(null)
    toast_('Turn ' + (turn+1) + ' — untapped & drew')
  }

  // ── DRAW ───────────────────────────────────────────────────
  function draw() {
    if (deck <= 0) { toast_('Library empty!'); return }
    const c = DRAW_POOL[Math.floor(Math.random() * DRAW_POOL.length)]
    setHand(h => [...h, { id:'d-'+Date.now(), ...c }])
    setDeck(d => d - 1)
    toast_('Drew ' + c.name)
  }

  // ── UNTAP ALL ──────────────────────────────────────────────
  function untapAll() {
    setBF(b => b.map(c => ({ ...c, tapped:false })))
    toast_('All permanents untapped')
  }

  // ── PLAY FROM HAND ─────────────────────────────────────────
  // Called with the card id and the drop x,y relative to the battlefield
  function playCard(handId, x, y) {
    const card = hand.find(c => c.id === handId)
    if (!card) return
    setHand(h => h.filter(c => c.id !== handId))
    setBF(b => [...b, {
      ...card,
      id: 'bf-' + Date.now(),
      x: Math.max(0, x),
      y: Math.max(0, y),
      tapped:    false,
      attacking: false,
      blocking:  false,
      targeted:  false,
      counters:  0,
    }])
    setDeck(d => Math.max(0, d-1))
    toast_(card.name + ' played')
  }

  // ── MOVE CARD ON BATTLEFIELD ────────────────────────────────
  function moveOnBF(id, x, y) {
    setBF(b => b.map(c => c.id === id ? { ...c, x: Math.max(0,x), y: Math.max(0,y) } : c))
  }

  // ── TAP ────────────────────────────────────────────────────
  function tapCard(id) {
    setBF(b => b.map(c => c.id === id ? { ...c, tapped: !c.tapped } : c))
  }

  // ── SEND TO ZONE ───────────────────────────────────────────
  function sendToZone(id, src, zone) {
    let card
    if (src === 'hand') {
      card = hand.find(c => c.id === id)
      setHand(h => h.filter(c => c.id !== id))
    } else {
      card = bf.find(c => c.id === id)
      setBF(b => b.filter(c => c.id !== id))
    }
    if (!card) return
    const entry = { ...card, id:'z-'+Date.now() }
    if (zone === 'gy')     setGY(z => [...z, entry])
    if (zone === 'exile')  setExile(z => [...z, entry])
    if (zone === 'cmd')    setCmd(z => [...z, entry])
    toast_(card.name + ' → ' + zone)
  }

  // ── RETRIEVE FROM ZONE ─────────────────────────────────────
  function retrieve(zone, idx, dest) {
    let card
    if (zone === 'gy')    { card = gy[idx];    setGY(z => z.filter((_,i)=>i!==idx)) }
    if (zone === 'exile') { card = exile[idx];  setExile(z => z.filter((_,i)=>i!==idx)) }
    if (zone === 'cmd')   { card = cmd[idx];    setCmd(z => z.filter((_,i)=>i!==idx)) }
    if (!card) return
    if (dest === 'hand') {
      setHand(h => [...h, { ...card, id:'r-'+Date.now() }])
      toast_(card.name + ' → hand')
    } else {
      setBF(b => [...b, { ...card, id:'bf-'+Date.now(), x:30, y:30, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 }])
      toast_(card.name + ' → battlefield')
    }
  }

  // ── CONTEXT MENU ACTIONS ────────────────────────────────────
  function doCtx(action) {
    if (!ctx) return
    const { card, src } = ctx
    setCtx(null)
    switch(action) {
      case 'tap':
        if (src === 'bf') tapCard(card.id)
        break
      case 'atk':
        setBF(b => b.map(c => c.id===card.id ? {...c,attacking:!c.attacking} : c))
        break
      case 'blk':
        setBF(b => b.map(c => c.id===card.id ? {...c,blocking:!c.blocking} : c))
        break
      case '+ctr':
        setBF(b => b.map(c => c.id===card.id ? {...c,counters:(c.counters||0)+1} : c))
        break
      case '-ctr':
        setBF(b => b.map(c => c.id===card.id ? {...c,counters:Math.max(0,(c.counters||0)-1)} : c))
        break
      case 'hand':
        if (src === 'bf') {
          const c = bf.find(x => x.id===card.id)
          setBF(b => b.filter(x=>x.id!==card.id))
          if (c) setHand(h=>[...h,{...c,id:'r-'+Date.now()}])
        }
        break
      case 'gy':      sendToZone(card.id, src, 'gy');    break
      case 'exile':   sendToZone(card.id, src, 'exile');  break
      case 'cmd':     sendToZone(card.id, src, 'cmd');    break
      case 'destroy': sendToZone(card.id, src, 'gy');     break
    }
  }

  // ── DRAG FROM HAND ──────────────────────────────────────────
  const handDragRef = useRef(null)

  function handMouseDown(e, card) {
    if (e.button !== 0) return
    e.preventDefault()
    handDragRef.current = { card, moved: false, startX: e.clientX, startY: e.clientY }

    // ghost
    const ghost = document.createElement('div')
    ghost.id = 'drag-ghost'
    ghost.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      width:90px;height:126px;border-radius:6px;
      border:2px solid #a78bfa;
      background:${BG[card.col]||'#111'};
      display:flex;align-items:center;justify-content:center;
      font-size:32px;opacity:0.9;transform:rotate(3deg) scale(1.05);
      box-shadow:0 12px 32px rgba(0,0,0,0.9);
      left:${e.clientX-45}px;top:${e.clientY-63}px;
    `
    ghost.textContent = card.art
    document.body.appendChild(ghost)

    function onMove(me) {
      ghost.style.left = (me.clientX-45)+'px'
      ghost.style.top  = (me.clientY-63)+'px'
      if (Math.abs(me.clientX-e.clientX)>4||Math.abs(me.clientY-e.clientY)>4)
        handDragRef.current.moved = true

      // glow BF on hover
      const bf = bfRef.current
      if (bf) {
        const r = bf.getBoundingClientRect()
        const over = me.clientX>=r.left && me.clientX<=r.right && me.clientY>=r.top && me.clientY<=r.bottom
        bf.style.outline = over ? '2px solid #a78bfa' : ''
      }
    }

    function onUp(me) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      ghost.remove()
      if (bfRef.current) bfRef.current.style.outline = ''

      if (!handDragRef.current?.moved) { handDragRef.current=null; return }

      const bf = bfRef.current
      if (bf) {
        const r = bf.getBoundingClientRect()
        if (me.clientX>=r.left && me.clientX<=r.right && me.clientY>=r.top && me.clientY<=r.bottom) {
          const x = me.clientX - r.left - 45
          const y = me.clientY - r.top  - 63
          playCard(card.id, x, y)
        }
      }
      handDragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── DRAG ON BATTLEFIELD ─────────────────────────────────────
  const bfDragRef = useRef(null)

  function bfMouseDown(e, card) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()

    const bfEl  = bfRef.current
    const bfRect = bfEl.getBoundingClientRect()
    const offX  = e.clientX - bfRect.left - card.x
    const offY  = e.clientY - bfRect.top  - card.y

    bfDragRef.current = { card, moved:false, startX:e.clientX, startY:e.clientY, offX, offY }
    setDraggingId(card.id)

    // ghost
    const isLand = card.type === 'Land'
    const w = isLand ? 60  : 90
    const h = isLand ? 42  : 126
    const ghost = document.createElement('div')
    ghost.id = 'drag-ghost'
    ghost.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      width:${w}px;height:${h}px;border-radius:5px;
      border:2px solid #a78bfa;
      background:${BG[card.col]||'#111'};
      display:flex;align-items:center;justify-content:center;
      font-size:${isLand?14:26}px;opacity:0.9;transform:rotate(3deg);
      box-shadow:0 8px 24px rgba(0,0,0,0.9);
      left:${e.clientX-offX}px;top:${e.clientY-offY}px;
    `
    ghost.textContent = card.art
    document.body.appendChild(ghost)

    // drop targets: gy, exile piles
    function getPile(x, y) {
      const piles = document.querySelectorAll('[data-pile]')
      for (const p of piles) {
        const r = p.getBoundingClientRect()
        if (x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return p.dataset.pile
      }
      return null
    }

    function onMove(me) {
      ghost.style.left = (me.clientX - offX) + 'px'
      ghost.style.top  = (me.clientY - offY)  + 'px'
      if (Math.abs(me.clientX-e.clientX)>3||Math.abs(me.clientY-e.clientY)>3)
        bfDragRef.current.moved = true

      // highlight piles
      document.querySelectorAll('[data-pile]').forEach(p => p.style.borderColor='')
      const pile = getPile(me.clientX, me.clientY)
      if (pile) {
        const el = document.querySelector(`[data-pile="${pile}"]`)
        if (el) el.style.borderColor = '#a78bfa'
      }
    }

    function onUp(me) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      ghost.remove()
      document.querySelectorAll('[data-pile]').forEach(p => p.style.borderColor='')
      setDraggingId(null)

      if (!bfDragRef.current?.moved) {
        tapCard(card.id)
        bfDragRef.current = null
        return
      }

      // check if dropped on pile
      const pile = getPile(me.clientX, me.clientY)
      if (pile) {
        sendToZone(card.id, 'bf', pile)
      } else {
        // move on battlefield
        const bfR = bfEl.getBoundingClientRect()
        const newX = me.clientX - bfR.left - offX
        const newY = me.clientY - bfR.top  - offY
        moveOnBF(card.id, newX, newY)
      }
      bfDragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── RENDER ──────────────────────────────────────────────────
  const lifeColor = life<=10?'#ef4444':life<=20?'#f59e0b':'#60a5fa'

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:'#0a0a0a',overflow:'hidden',fontFamily:'system-ui,sans-serif',color:'#e0e0e0'}}>

      {/* TOPBAR */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#080808',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
        {onBack && <button onClick={onBack} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#444',fontSize:11,cursor:'pointer'}}>← Lobby</button>}
        <span style={{fontSize:13,fontWeight:700,color:'#a78bfa'}}>✦ MTG App</span>
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:'#444'}}>Turn <b style={{color:'#60a5fa'}}>{turn}</b></span>
        <button onClick={endTurn} style={{padding:'5px 14px',borderRadius:6,background:'#2563eb',border:'none',color:'#fff',fontSize:11,cursor:'pointer',fontWeight:600}}>End turn →</button>
      </div>

      {/* PHASE BAR */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'4px 8px',background:'#080808',borderBottom:'1px solid #141414',flexShrink:0}}>
        {PHASES.map((p,i)=>(
          <React.Fragment key={p}>
            <div onClick={()=>goPhase(i)} style={{padding:'3px 10px',fontSize:9,borderRadius:3,cursor:'pointer',textTransform:'uppercase',letterSpacing:'.05em',color:phase===i?'#fff':phase>i?'#333':'#2a2a2a',background:phase===i?'#2563eb':'transparent'}}>
              {p}
            </div>
            {i<PHASES.length-1&&<span style={{color:'#1a1a1a',fontSize:10}}>›</span>}
          </React.Fragment>
        ))}
      </div>

      {/* COMBAT SUB-PHASES */}
      {phase===4&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:1,padding:'3px 8px',background:'#060608',borderBottom:'1px solid #0f0f18',flexShrink:0}}>
          <span style={{fontSize:8,color:'#2a2050',marginRight:6}}>Combat:</span>
          {COMBAT_SUBS.map((s,i)=>(
            <React.Fragment key={s}>
              <div onClick={()=>setCsub(i)} style={{padding:'2px 8px',fontSize:8,borderRadius:3,cursor:'pointer',textTransform:'uppercase',letterSpacing:'.05em',color:csub===i?'#a78bfa':'#2a2a3a',background:csub===i?'#14102a':'transparent',border:csub===i?'1px solid #3a2d6a':'1px solid transparent'}}>
                {s}
              </div>
              {i<3&&<span style={{color:'#1a1a1a',fontSize:9}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* MAIN: side piles + battlefield + side piles */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:'52px 1fr 52px',gap:3,padding:4,overflow:'hidden',minHeight:0}}>

        {/* LEFT PILES: GY + CMD */}
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {[{zone:'gy',icon:'☠',count:gy.length,label:'GY'},{zone:'cmd',icon:'⬡',count:cmd.length,label:'CMD'}].map(({zone,icon,count,label})=>(
            <div key={zone} data-pile={zone} onClick={()=>setPanel(zone)}
              style={{flex:1,borderRadius:6,border:'1px dashed #1a1a1a',background:'#080808',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,cursor:'pointer',transition:'border-color .12s',minHeight:0}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='#4c3a8a'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='#1a1a1a'}>
              <span style={{fontSize:14,opacity:.2}}>{icon}</span>
              <span style={{fontSize:14,fontWeight:700,color:count>0?'#888':'#2a2a2a'}}>{count}</span>
              <span style={{fontSize:7,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</span>
            </div>
          ))}
        </div>

        {/* BATTLEFIELD */}
        <div
          ref={bfRef}
          style={{position:'relative',borderRadius:8,border:'1px solid #182218',background:'#0b1208',overflow:'hidden',minHeight:0}}
        >
          {/* INSTRUCTION when empty */}
          {bf.length===0&&(
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#1a1a1a',pointerEvents:'none'}}>
              Drag cards from hand to play
            </div>
          )}

          {bf.map(card=>{
            const isLand = card.type==='Land'
            const w = isLand?60:90
            const h = isLand?42:126
            const borderColor = card.targeted?'#60a5fa':card.attacking?'#ef4444':card.blocking?'#f59e0b':BD[card.col]||'#333'
            const err = imgErr[card.id]

            return (
              <div key={card.id}
                onMouseDown={e=>bfMouseDown(e,card)}
                onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,card,src:'bf'})}}
                style={{
                  position:'absolute',left:card.x,top:card.y,
                  width:w,height:h,borderRadius:5,
                  border:`1.5px solid ${borderColor}`,
                  background:BG[card.col]||'#111',
                  cursor:'grab',overflow:'hidden',
                  transform:card.tapped?'rotate(15deg)':'none',
                  transformOrigin:'center center',
                  opacity:draggingId===card.id?0.25:1,
                  zIndex:card.attacking?50:10,
                  boxShadow:card.attacking?'0 0 0 2px rgba(239,68,68,.3)':card.targeted?'0 0 0 2px rgba(96,165,250,.3)':'0 2px 8px rgba(0,0,0,.5)',
                  userSelect:'none',
                }}>
                {!err?(
                  <img src={sfImg(card.name)} alt={card.name} draggable={false}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                    onError={()=>setImgErr(p=>({...p,[card.id]:true}))}/>
                ):(
                  <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column'}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isLand?14:24}}>{card.art}</div>
                    {!isLand&&<div style={{padding:'1px 3px',background:'rgba(0,0,0,.6)',fontSize:6,color:'#ccc',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden'}}>{card.name}</div>}
                  </div>
                )}
                {(card.counters||0)>0&&(
                  <div style={{position:'absolute',top:-5,left:-5,width:15,height:15,borderRadius:'50%',background:'#2563eb',border:'1.5px solid #0a0a0a',fontSize:7,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,zIndex:5}}>
                    {card.counters}
                  </div>
                )}
                {card.attacking&&<div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'#ef4444'}}>⚔</div>}
              </div>
            )
          })}

          {/* LIFE TOTAL in bottom-left of BF */}
          <div style={{position:'absolute',bottom:8,left:8,zIndex:20}}>
            <div style={{background:'rgba(8,8,8,.92)',border:`1px solid ${lifeColor}44`,borderRadius:8,padding:'5px 8px',minWidth:62,textAlign:'center',backdropFilter:'blur(8px)',boxShadow:'0 2px 12px rgba(0,0,0,.6)'}}>
              <div style={{fontSize:7,color:'#333',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:1}}>You</div>
              <div style={{fontSize:26,fontWeight:700,color:lifeColor,lineHeight:1}}>{life}</div>
              <div style={{display:'flex',gap:3,marginTop:4,justifyContent:'center'}}>
                <button onClick={()=>setLife(l=>Math.max(0,l-1))} style={{padding:'1px 8px',border:'1px solid #1a1a1a',borderRadius:3,background:'#111',color:'#666',fontSize:13,cursor:'pointer'}}>−</button>
                <button onClick={()=>setLife(l=>l+1)}              style={{padding:'1px 8px',border:'1px solid #1a1a1a',borderRadius:3,background:'#111',color:'#666',fontSize:13,cursor:'pointer'}}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PILES: Exile + Lib */}
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          <div data-pile="exile" onClick={()=>setPanel('exile')}
            style={{flex:1,borderRadius:6,border:'1px dashed #1a1a1a',background:'#080808',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,cursor:'pointer',transition:'border-color .12s',minHeight:0}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#4c3a8a'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#1a1a1a'}>
            <span style={{fontSize:14,opacity:.2}}>✦</span>
            <span style={{fontSize:14,fontWeight:700,color:exile.length>0?'#888':'#2a2a2a'}}>{exile.length}</span>
            <span style={{fontSize:7,color:'#1a1a1a',textTransform:'uppercase',letterSpacing:'.06em'}}>Exile</span>
          </div>
          <div onClick={()=>setPanel('lib')}
            style={{flex:1,borderRadius:6,border:'1px dashed #2a2050',background:'#0d0a1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,cursor:'pointer',minHeight:0}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#4c3a8a'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#2a2050'}>
            <span style={{fontSize:14,color:'#2a2050'}}>✦</span>
            <span style={{fontSize:14,fontWeight:700,color:'#2a2050'}}>{deck}</span>
            <span style={{fontSize:7,color:'#2a2050',textTransform:'uppercase',letterSpacing:'.06em'}}>Library</span>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD — HAND */}
      <div style={{background:'#080808',borderTop:'1px solid #141414',padding:'8px 10px',flexShrink:0,display:'flex',alignItems:'flex-end',gap:8}}>

        {/* HAND CARDS */}
        <div style={{flex:1,display:'flex',alignItems:'flex-end',gap:6,overflowX:'auto',overflowY:'visible',paddingBottom:4,paddingTop:8}}>
          {hand.map(card=>{
            const err = imgErr[card.id]
            return (
              <div key={card.id}
                onMouseDown={e=>handMouseDown(e,card)}
                onContextMenu={e=>{e.preventDefault();setCtx({x:e.clientX,y:e.clientY,card,src:'hand'})}}
                style={{
                  flexShrink:0,width:84,height:117,borderRadius:6,
                  border:'1.5px solid #2a2a2a',background:BG[card.col]||'#111',
                  cursor:'grab',overflow:'hidden',position:'relative',
                  transition:'transform .1s,border-color .1s,box-shadow .1s',
                  boxShadow:'0 2px 8px rgba(0,0,0,.5)',
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-10px)';e.currentTarget.style.borderColor='#666';e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,.7)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='#2a2a2a';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.5)'}}>
                {!err?(
                  <img src={sfImg(card.name)} alt={card.name} draggable={false}
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block',pointerEvents:'none'}}
                    onError={()=>setImgErr(p=>({...p,[card.id]:true}))}/>
                ):(
                  <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:BG[card.col]}}>
                    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>{card.art}</div>
                    <div style={{padding:'3px 5px',background:'rgba(0,0,0,.7)',fontSize:7,color:'#ccc',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden'}}>{card.name}</div>
                  </div>
                )}
              </div>
            )
          })}
          {hand.length===0&&<div style={{fontSize:11,color:'#1e1e1e',padding:'0 8px',alignSelf:'center'}}>No cards in hand</div>}
        </div>

        {/* ACTION BUTTONS */}
        <div style={{display:'flex',flexDirection:'column',gap:4,flexShrink:0}}>
          <button onClick={draw} style={{padding:'6px 14px',borderRadius:5,border:'1px solid #3b82f6',background:'#2563eb',color:'#fff',fontSize:11,cursor:'pointer',fontWeight:600}}>Draw</button>
          <button onClick={untapAll} style={{padding:'6px 14px',borderRadius:5,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:11,cursor:'pointer'}}>Untap All</button>
          <button onClick={()=>setPanel('gy')} style={{padding:'6px 14px',borderRadius:5,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:11,cursor:'pointer'}}>View GY</button>
        </div>
      </div>

      {/* CONTEXT MENU */}
      {ctx&&(
        <div style={{position:'fixed',left:Math.min(ctx.x,window.innerWidth-175),top:Math.min(ctx.y,window.innerHeight-320),background:'#111',border:'1px solid #2a2a2a',borderRadius:8,padding:4,zIndex:10000,minWidth:170,boxShadow:'0 8px 28px rgba(0,0,0,.9)'}}>
          <div style={{fontSize:9,color:'#444',padding:'4px 10px',textTransform:'uppercase',letterSpacing:'.07em',borderBottom:'1px solid #1a1a1a',marginBottom:2}}>{ctx.card.name}</div>
          {ctx.src==='bf'&&<>
            <MI onClick={()=>doCtx('tap')}>↻ Tap / Untap</MI>
            <MI onClick={()=>doCtx('atk')}>⚔ Declare attacker</MI>
            <MI onClick={()=>doCtx('blk')}>🛡 Declare blocker</MI>
            <div style={{borderTop:'1px solid #1a1a1a',margin:'3px 0'}}/>
            <MI onClick={()=>doCtx('+ctr')}>＋ Add +1/+1 counter</MI>
            <MI onClick={()=>doCtx('-ctr')}>－ Remove counter</MI>
            <div style={{borderTop:'1px solid #1a1a1a',margin:'3px 0'}}/>
            <MI onClick={()=>doCtx('hand')}>✋ Return to hand</MI>
            <MI onClick={()=>doCtx('cmd')}>⬡ Command zone</MI>
          </>}
          <MI onClick={()=>doCtx('gy')}>☠ To graveyard</MI>
          <MI onClick={()=>doCtx('exile')}>✦ Exile</MI>
          {ctx.src==='bf'&&<><div style={{borderTop:'1px solid #1a1a1a',margin:'3px 0'}}/><MI danger onClick={()=>doCtx('destroy')}>✕ Destroy</MI></>}
          <div style={{borderTop:'1px solid #1a1a1a',margin:'3px 0'}}/>
          <MI onClick={()=>setCtx(null)}>Cancel</MI>
        </div>
      )}
      {ctx&&<div style={{position:'fixed',inset:0,zIndex:9999}} onClick={()=>setCtx(null)}/>}

      {/* ZONE VIEWER PANEL */}
      {panel&&(
        <>
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:800}} onClick={()=>setPanel(null)}/>
          <div style={{position:'fixed',right:0,top:0,bottom:0,width:320,background:'#0a0a0a',borderLeft:'1px solid #2a2050',display:'flex',flexDirection:'column',zIndex:801,animation:'slideIn .2s ease'}}>
            <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #1a1a1a'}}>
              <span style={{fontSize:13,fontWeight:500,flex:1,color:'#e0e0e0'}}>
                {panel==='gy'?`Graveyard (${gy.length})`:panel==='exile'?`Exile (${exile.length})`:panel==='cmd'?`Command Zone (${cmd.length})`:`Library (${deck})`}
              </span>
              <button onClick={()=>setPanel(null)} style={{background:'none',border:'none',color:'#333',fontSize:18,cursor:'pointer'}}>✕</button>
            </div>

            {/* ZONE TABS */}
            {panel!=='lib'&&(
              <div style={{display:'flex',borderBottom:'1px solid #1a1a1a'}}>
                {[{k:'gy',l:'GY'},{k:'exile',l:'Exile'},{k:'cmd',l:'CMD'}].map(({k,l})=>(
                  <div key={k} onClick={()=>setPanel(k)}
                    style={{flex:1,padding:'7px 0',textAlign:'center',fontSize:11,cursor:'pointer',color:panel===k?'#a78bfa':'#444',borderBottom:panel===k?'2px solid #a78bfa':'2px solid transparent'}}>
                    {l}
                  </div>
                ))}
              </div>
            )}

            <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
              {panel==='lib'?(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{fontSize:10,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Library Actions</div>
                  <button onClick={()=>{draw();setPanel(null)}} style={{padding:'9px',borderRadius:6,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:12,cursor:'pointer'}}>Draw a card</button>
                  <button onClick={()=>{draw();draw();draw();setPanel(null)}} style={{padding:'9px',borderRadius:6,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:12,cursor:'pointer'}}>Draw 3 cards</button>
                  <button onClick={()=>{toast_('Library shuffled');setPanel(null)}} style={{padding:'9px',borderRadius:6,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:12,cursor:'pointer'}}>Shuffle</button>
                  <button onClick={()=>{const t=DRAW_POOL[Math.floor(Math.random()*DRAW_POOL.length)];toast_('Top card: '+t.name)}} style={{padding:'9px',borderRadius:6,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:12,cursor:'pointer'}}>Look at top card</button>
                </div>
              ):(
                (() => {
                  const arr = panel==='gy'?gy:panel==='exile'?exile:cmd
                  return arr.length===0?(
                    <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>Nothing here yet</div>
                  ):arr.map((card,i)=>(
                    <div key={card.id||i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:2}}
                      onMouseEnter={e=>e.currentTarget.style.background='#111'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{width:32,height:44,borderRadius:4,background:BG[card.col]||'#111',border:`1px solid ${BD[card.col]||'#333'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,overflow:'hidden'}}>
                        <img src={sfImg(card.name)} alt={card.name} draggable={false}
                          style={{width:'100%',height:'100%',objectFit:'cover'}}
                          onError={e=>{e.target.style.display='none';e.target.parentElement.textContent=card.art}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
                        <div style={{fontSize:9,color:'#333',marginTop:1}}>{card.type}</div>
                      </div>
                      <div style={{display:'flex',gap:3}}>
                        <button onClick={()=>retrieve(panel,i,'hand')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:9,cursor:'pointer'}}>Hand</button>
                        <button onClick={()=>retrieve(panel,i,'bf')} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #1a1a1a',background:'#0d0d0d',color:'#555',fontSize:9,cursor:'pointer'}}>BF</button>
                      </div>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:170,left:'50%',transform:'translateX(-50%)',background:'#111',border:'1px solid #2a2050',borderRadius:20,padding:'6px 18px',fontSize:11,color:'#a78bfa',zIndex:9000,pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}
    </div>
  )
}

// Mini menu item helper
function MI({onClick,children,danger}) {
  return (
    <div onClick={onClick}
      style={{padding:'7px 10px',fontSize:11,color:danger?'#777':'#777',cursor:'pointer',borderRadius:5}}
      onMouseEnter={e=>e.currentTarget.style.background=danger?'#1a0808':'#1a1a1a'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <span style={{color:danger?'#ef4444':'inherit'}}>{children}</span>
    </div>
  )
}
