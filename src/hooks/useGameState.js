import { useState, useCallback, useRef } from 'react'

export function useGameState(config) {
  const startLife = config?.startingLife || 40

  const [life, setLife] = useState({
    You: startLife, Alex: startLife, Sam: startLife, Jordan: startLife
  })
  const [cmdrDmg, setCmdrDmg] = useState({
    You:    { Alex:0, Sam:0, Jordan:0 },
    Alex:   { You:0,  Sam:0, Jordan:0 },
    Sam:    { You:0,  Alex:0, Jordan:0 },
    Jordan: { You:0,  Alex:0, Sam:0   },
  })
  const [deckCount, setDeckCount] = useState(91)
  const [turnIdx,   setTurnIdx]   = useState(0)
  const [turnNum,   setTurnNum]   = useState(1)
  const [phase,     setPhaseVal]  = useState(3)
  const [combatSubPhase, setCombatSubPhase] = useState(null)

  const [hand, setHand] = useState([
    { id:'h1', name:'Llanowar Elves',       type:'Creature',    col:'cg',     art:'🌿', pt:'1/1' },
    { id:'h2', name:'Cultivate',            type:'Sorcery',     col:'cg',     art:'🌿', pt:''    },
    { id:'h3', name:'Counterspell',         type:'Instant',     col:'cu',     art:'🌊', pt:''    },
    { id:'h4', name:'Forest',               type:'Land',        col:'cforest',art:'🌲', pt:''    },
    { id:'h5', name:'Rhystic Study',        type:'Enchantment', col:'cu',     art:'📚', pt:''    },
    { id:'h6', name:'Sol Ring',             type:'Artifact',    col:'ca',     art:'⭕', pt:''    },
    { id:'h7', name:'Beast Within',         type:'Instant',     col:'cg',     art:'🐾', pt:''    },
  ])

  const [cards, setCards] = useState({
    You: [
      { id:'y1', name:'Forest', type:'Land', col:'cforest', art:'🌲', pt:'', x:10,  y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'y2', name:'Forest', type:'Land', col:'cforest', art:'🌲', pt:'', x:80,  y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'y3', name:'Island', type:'Land', col:'cisland', art:'💧', pt:'', x:150, y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
    ],
    Alex: [
      { id:'a1', name:'Forest', type:'Land', col:'cforest', art:'🌲', pt:'', x:10,  y:10, tapped:true,  attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'a2', name:'Island', type:'Land', col:'cisland', art:'💧', pt:'', x:80,  y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'a3', name:'Sol Ring', type:'Artifact', col:'ca', art:'⭕', pt:'', x:150, y:10, tapped:true, attacking:false, blocking:false, targeted:false, counters:0 },
    ],
    Sam: [
      { id:'s1', name:'Mountain', type:'Land', col:'cmtn',   art:'⛰', pt:'', x:10,  y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'s2', name:'Mountain', type:'Land', col:'cmtn',   art:'⛰', pt:'', x:80,  y:10, tapped:true,  attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'s3', name:'Goblin Guide', type:'Creature', col:'cr', art:'🔥', pt:'2/2', x:150, y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
    ],
    Jordan: [
      { id:'j1', name:'Swamp',  type:'Land', col:'cswamp',  art:'🌑', pt:'', x:10,  y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'j2', name:'Plains', type:'Land', col:'cplains', art:'☀',  pt:'', x:80,  y:10, tapped:true,  attacking:false, blocking:false, targeted:false, counters:0 },
      { id:'j3', name:'Llanowar Elves', type:'Creature', col:'cg', art:'🌿', pt:'1/1', x:150, y:10, tapped:false, attacking:false, blocking:false, targeted:false, counters:0 },
    ],
  })

  const [zones, setZones] = useState({
    'You-gy':[],'You-exile':[],'You-cmd':[],
    'Alex-gy':[],'Alex-exile':[],'Alex-cmd':[],
    'Sam-gy':[],'Sam-exile':[],'Sam-cmd':[],
    'Jordan-gy':[],'Jordan-exile':[],'Jordan-cmd':[],
  })

  const [planeCard,    setPlaneCard]    = useState(null)
  const [planeDie,     setPlaneDie]     = useState(null)
  const [planeDiscard, setPlaneDiscard] = useState([])
  const [stack,        setStack]        = useState([])
  const [priority,     setPriority]     = useState('You')
  const [library,      setLibrary]      = useState(
    Array.from({ length:91 }, (_,i) => ({ id:'lib-'+i, name:'Card '+i, type:'Card', col:'ca', art:'✦' }))
  )

  const PLAYERS = ['You','Alex','Sam','Jordan']
  const PHASES  = ['Untap','Upkeep','Draw','Main 1','Combat','Main 2','End']
  const POOL    = [
    { name:'Explore',              type:'Sorcery',     col:'cg',     art:'🌿', pt:''    },
    { name:'Llanowar Elves',       type:'Creature',    col:'cg',     art:'🌿', pt:'1/1' },
    { name:'Ponder',               type:'Sorcery',     col:'cu',     art:'🌊', pt:''    },
    { name:'Forest',               type:'Land',        col:'cforest',art:'🌲', pt:''    },
    { name:'Island',               type:'Land',        col:'cisland',art:'💧', pt:''    },
    { name:'Beast Within',         type:'Instant',     col:'cg',     art:'🐾', pt:''    },
    { name:'Arcane Signet',        type:'Artifact',    col:'ca',     art:'⭕', pt:''    },
    { name:'Cyclonic Rift',        type:'Instant',     col:'cu',     art:'🌊', pt:''    },
    { name:'Craterhoof Behemoth',  type:'Creature',    col:'cg',     art:'🐾', pt:'5/5' },
    { name:'Rhystic Study',        type:'Enchantment', col:'cu',     art:'📚', pt:''    },
    { name:'Sol Ring',             type:'Artifact',    col:'ca',     art:'⭕', pt:''    },
    { name:'Command Tower',        type:'Land',        col:'cforest',art:'🌲', pt:''    },
    { name:'Swamp',                type:'Land',        col:'cswamp', art:'🌑', pt:''    },
    { name:'Mountain',             type:'Land',        col:'cmtn',   art:'⛰', pt:''    },
  ]

  // ── LIFE ──────────────────────────────────────────────
  const adjLife = useCallback((player, delta) => {
    setLife(l => ({ ...l, [player]: Math.max(0, l[player] + delta) }))
  }, [])

  const adjCmdrDmg = useCallback((from, to, delta) => {
    setCmdrDmg(d => ({
      ...d,
      [to]: { ...d[to], [from]: Math.max(0, (d[to][from]||0) + delta) }
    }))
  }, [])

  // ── CARDS ─────────────────────────────────────────────
  const moveCard = useCallback((id, fromOwner, toOwner, x, y) => {
    setCards(prev => {
      const card = (prev[fromOwner]||[]).find(c => c.id === id)
      if (!card) return prev
      const fromList = (prev[fromOwner]||[]).filter(c => c.id !== id)
      const moved    = { ...card, x, y, owner: toOwner }
      const toList   = [...(prev[toOwner]||[]).filter(c => c.id !== id), moved]
      return { ...prev, [fromOwner]: fromList, [toOwner]: toList }
    })
  }, [])

  const updateCard = useCallback((id, owner, updates) => {
    setCards(prev => ({
      ...prev,
      [owner]: (prev[owner]||[]).map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  }, [])

  const removeCard = useCallback((id, owner) => {
    setCards(prev => ({
      ...prev,
      [owner]: (prev[owner]||[]).filter(c => c.id !== id)
    }))
  }, [])

  const addCardToBF = useCallback((card, owner, x, y) => {
    const newCard = {
      ...card,
      id: 'bf-'+Date.now()+'-'+Math.random().toString(36).substr(2,4),
      x: x || 10, y: y || 10,
      tapped: false, attacking: false, blocking: false, targeted: false, counters: 0,
      owner,
    }
    setCards(prev => ({ ...prev, [owner]: [...(prev[owner]||[]), newCard] }))
  }, [])

  // ── HAND ──────────────────────────────────────────────
  const drawCard = useCallback(() => {
    if (deckCount <= 0) return null
    const c = { ...POOL[Math.floor(Math.random() * POOL.length)] }
    const drawn = { id: 'd-'+Date.now(), ...c }
    setHand(h => [...h, drawn])
    setDeckCount(n => n - 1)
    return drawn
  }, [deckCount])

  const playFromHand = useCallback((handId, owner, x, y) => {
    setHand(h => {
      const card = h.find(c => c.id === handId)
      if (!card) return h
      addCardToBF(card, owner, x, y)
      return h.filter(c => c.id !== handId)
    })
    setDeckCount(n => Math.max(0, n - 1))
  }, [addCardToBF])

  const discardFromHand = useCallback((handId, zone) => {
    setHand(h => {
      const card = h.find(c => c.id === handId)
      if (card) {
        setZones(z => {
          const key = 'You-'+zone
          return { ...z, [key]: [...(z[key]||[]), { ...card, id:'z-'+Date.now() }] }
        })
      }
      return h.filter(c => c.id !== handId)
    })
  }, [])

  // ── ZONES ─────────────────────────────────────────────
  const addToZone = useCallback((player, zone, card) => {
    const key = player+'-'+zone
    setZones(z => ({ ...z, [key]: [...(z[key]||[]), { ...card, id:'z-'+Date.now()+Math.random() }] }))
  }, [])

  const removeFromZone = useCallback((player, zone, idx) => {
    const key = player+'-'+zone
    setZones(z => ({ ...z, [key]: (z[key]||[]).filter((_,i) => i !== idx) }))
  }, [])

  const retrieveFromZone = useCallback((player, zone, idx, dest) => {
    const key = player+'-'+zone
    setZones(z => {
      const card = (z[key]||[])[idx]
      if (!card) return z
      const updated = { ...z, [key]: (z[key]||[]).filter((_,i) => i !== idx) }
      if (dest === 'hand') {
        setHand(h => [...h, { ...card, id:'r-'+Date.now() }])
      } else if (dest === 'bf') {
        addCardToBF(card, player, 20, 20)
      } else if (dest === 'cmd') {
        const cmdKey = player+'-cmd'
        return { ...updated, [cmdKey]: [...(updated[cmdKey]||[]), card] }
      }
      return updated
    })
  }, [addCardToBF])

  // ── UNTAP ─────────────────────────────────────────────
  const untapAll = useCallback((owner) => {
    setCards(prev => ({
      ...prev,
      [owner]: (prev[owner]||[]).map(c => ({ ...c, tapped: false }))
    }))
  }, [])

  // ── PHASE ─────────────────────────────────────────────
  const setPhase = useCallback((idx) => {
    setPhaseVal(idx)
    if (idx !== 4) setCombatSubPhase(null)
    else setCombatSubPhase('attackers')
  }, [])

  // ── END TURN ──────────────────────────────────────────
  const endTurn = useCallback(() => {
    // Clear combat states
    setCards(prev => {
      const next = {}
      Object.keys(prev).forEach(p => {
        next[p] = (prev[p]||[]).map(c => ({ ...c, attacking:false, blocking:false, targeted:false }))
      })
      return next
    })
    setTurnIdx(prev => {
      const next = (prev + 1) % 4
      if (next === 0) {
        setTurnNum(n => n + 1)
        untapAll('You')
        // auto draw
        const c = { ...POOL[Math.floor(Math.random()*POOL.length)] }
        setHand(h => [...h, { id:'d-'+Date.now(), ...c }])
        setDeckCount(n => Math.max(0, n-1))
      }
      setPriority(PLAYERS[next])
      return next
    })
    setPhase(3)
    setCombatSubPhase(null)
  }, [untapAll, setPhase])

  // ── STACK ─────────────────────────────────────────────
  const pushStack  = useCallback((item) => setStack(s => [...s, { ...item, id:'stack-'+Date.now() }]), [])
  const popStack   = useCallback(() => setStack(s => s.slice(0,-1)), [])
  const passPriority = useCallback(() => {
    setPriority(p => { const i = PLAYERS.indexOf(p); return PLAYERS[(i+1)%4] })
  }, [])

  // ── LIBRARY ───────────────────────────────────────────
  const lookAtTop      = useCallback(() => library[library.length-1] || null, [library])
  const shuffleLibrary = useCallback(() => setLibrary(l => [...l].sort(() => Math.random()-.5)), [])
  const bottomCard     = useCallback((idx) => setLibrary(l => { const c=l[idx]; return [c,...l.filter((_,i)=>i!==idx)] }), [])
  const drawFromLibrary = useCallback((n=1) => {
    setLibrary(l => {
      const drawn = l.slice(-n)
      setHand(h => [...h, ...drawn.map(c => ({...c,id:'d-'+Date.now()+Math.random()}))])
      setDeckCount(cnt => Math.max(0, cnt-n))
      return l.slice(0,-n)
    })
  }, [])

  // ── PLANECHASE ────────────────────────────────────────
  const PLANES = [
    { name:"Norn's Dominion",  set:'New Phyrexia', oracle:'When you planeswalk here, each player chooses a permanent they control and returns the rest to hand.', chaos:'Each player proliferates.' },
    { name:'Krosa',            set:'Dominaria',    oracle:'Creatures enter with two additional +1/+1 counters.',                                                    chaos:'Creatures you control gain trample until end of turn.' },
    { name:'Velis Vel',        set:'Lorwyn',       oracle:'All creatures have changeling.',                                                                         chaos:'Target creature gains all creature types until end of turn.' },
    { name:'Tazeem',           set:'Zendikar',     oracle:'Landfall — Whenever a land enters under your control, you may draw a card.',                             chaos:'Target player draws three cards.' },
    { name:"Bolas's Meditation Realm", set:'Alara',oracle:"At the beginning of each player's upkeep, that player exiles all cards from their hand, then draws that many cards.", chaos:'Each opponent exiles all cards from their hand.' },
    { name:'Kessig',           set:'Innistrad',    oracle:'Whenever a creature deals combat damage to a player, that creature\'s controller may draw a card.',      chaos:'Target creature gets +X/+0 until end of turn, where X is your devotion to green.' },
  ]

  const rollPlaneDie = useCallback(() => {
    const faces = ['blank','blank','blank','blank','chaos','planeswalk']
    const result = faces[Math.floor(Math.random()*6)]
    setPlaneDie(result)
    if (result === 'planeswalk') {
      setTimeout(() => {
        setPlaneCard(prev => {
          setPlaneDiscard(d => prev ? [...d,prev] : d)
          return PLANES[Math.floor(Math.random()*PLANES.length)]
        })
        setPlaneDie(null)
      }, 1500)
    } else {
      setTimeout(() => setPlaneDie(null), 3000)
    }
    return result
  }, [])

  const initPlanechase = useCallback(() => {
    setPlaneCard(PLANES[Math.floor(Math.random()*PLANES.length)])
  }, [])

  return {
    // state
    life, cmdrDmg, deckCount, turnIdx, turnNum, phase, combatSubPhase,
    hand, cards, zones, stack, priority, library, planeCard, planeDie, planeDiscard,
    PLAYERS, PHASES,
    // actions
    adjLife, adjCmdrDmg,
    moveCard, updateCard, removeCard, addCardToBF,
    drawCard, playFromHand, discardFromHand,
    addToZone, removeFromZone, retrieveFromZone,
    untapAll, setPhase, setCombatSubPhase, endTurn,
    pushStack, popStack, passPriority,
    lookAtTop, drawFromLibrary, shuffleLibrary, bottomCard,
    rollPlaneDie, initPlanechase,
    setPlaneCard, setPlaneDiscard, setPlaneDie,
    setHand, setCards,
  }
}
