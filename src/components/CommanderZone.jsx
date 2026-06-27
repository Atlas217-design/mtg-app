import React, { useState } from 'react'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

export default function CommanderZone({
  commander,      // { name, castCount, inZone } or null
  onSetCommander, // (name) => void
  onCast,         // () => void  — cast from cmd zone, increments tax
  onReturnToZone, // () => void  — return from BF to cmd zone
  onSendToBF,     // () => void  — put directly on BF (e.g. cheated in)
  onContextMenu,  // (e) => void
}) {
  const [imgErr,   setImgErr]   = useState(false)
  const [picking,  setPicking]  = useState(!commander)
  const [search,   setSearch]   = useState('')

  const tax      = commander ? commander.castCount * 2 : 0
  const castCount= commander?.castCount || 0

  // Common commander names for quick-pick (Gruul landfall relevant)
  const SUGGESTIONS = [
    'Mina and Denn, Wildborn',
    'Omnath, Locus of Rage',
    'Titania, Protector of Argoth',
    'Azusa, Lost but Seeking',
    'Aesi, Tyrant of Gyre Strait',
    'The Gitrog Monster',
    'Maja, Bretagard Protector',
    'Borborygmos Enraged',
    'Nissa, Vastwood Seer',
    'Multani, Yavimaya\'s Avatar',
  ]

  const filtered = search.trim()
    ? SUGGESTIONS.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : SUGGESTIONS

  if (picking) {
    return (
      <div style={{ position:'absolute', bottom:8, right:8, width:220, background:'#0d0d0d', border:'1px solid #3a2d6a', borderRadius:10, padding:12, zIndex:30, boxShadow:'0 8px 24px rgba(0,0,0,.8)' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#a78bfa', marginBottom:8 }}>⬡ Set Commander</div>
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && search.trim()) {
              onSetCommander(search.trim())
              setSearch('')
              setPicking(false)
            }
          }}
          placeholder="Type commander name..."
          style={{ width:'100%', padding:'6px 8px', borderRadius:5, background:'#111', border:'1px solid #2a2050', color:'#ccc', fontSize:11, outline:'none', fontFamily:'inherit', marginBottom:6 }}
        />
        <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:160, overflowY:'auto' }}>
          {filtered.map(name => (
            <div key={name} onClick={() => { onSetCommander(name); setSearch(''); setPicking(false) }}
              style={{ padding:'5px 8px', borderRadius:5, fontSize:10, color:'#777', cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}
              onMouseEnter={e => { e.currentTarget.style.background='#14102a'; e.currentTarget.style.color='#a78bfa' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#777' }}>
              {name}
            </div>
          ))}
        </div>
        {commander && (
          <button onClick={() => setPicking(false)}
            style={{ marginTop:8, width:'100%', padding:'5px', borderRadius:5, border:'1px solid #222', background:'#111', color:'#444', fontSize:10, cursor:'pointer' }}>
            Cancel
          </button>
        )}
      </div>
    )
  }

  if (!commander) return null

  return (
    <div style={{
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 130,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      {/* COMMANDER CARD */}
      <div
        onContextMenu={onContextMenu}
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          border: `2px solid ${commander.inZone ? '#7c3aed' : '#3a3a3a'}`,
          boxShadow: commander.inZone
            ? '0 0 0 1px rgba(124,58,237,.3), 0 6px 20px rgba(0,0,0,.8)'
            : '0 4px 14px rgba(0,0,0,.7)',
          cursor: 'context-menu',
          position: 'relative',
          opacity: commander.inZone ? 1 : 0.65,
          transition: 'opacity .2s, border-color .2s',
        }}>
        {!imgErr ? (
          <img
            src={SF(commander.name)}
            alt={commander.name}
            draggable={false}
            style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ height: 182, background: '#14102a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
            <div style={{ fontSize: 9, color: '#a78bfa', textAlign: 'center', lineHeight: 1.4 }}>{commander.name}</div>
          </div>
        )}

        {/* COMMANDER LABEL */}
        <div style={{ position:'absolute', top:3, left:3, fontSize:7, padding:'1px 5px', borderRadius:8, background:'rgba(124,58,237,.85)', color:'#e0e0e0', fontWeight:600, letterSpacing:'.04em' }}>
          COMMANDER
        </div>

        {/* LOCATION BADGE */}
        <div style={{ position:'absolute', top:3, right:3, fontSize:7, padding:'1px 5px', borderRadius:8, background: commander.inZone ? 'rgba(124,58,237,.85)' : 'rgba(30,30,30,.85)', color: commander.inZone ? '#e0e0e0' : '#555' }}>
          {commander.inZone ? 'CMD ZONE' : 'ON BF'}
        </div>

        {/* CAST COUNT */}
        {castCount > 0 && (
          <div style={{ position:'absolute', bottom:3, left:3, fontSize:8, padding:'1px 5px', borderRadius:8, background:'rgba(0,0,0,.8)', color:'#f59e0b', fontWeight:700 }}>
            Cast ×{castCount}
          </div>
        )}
      </div>

      {/* TAX DISPLAY */}
      <div style={{ background:'#0d0d0d', border:'1px solid #2a2050', borderRadius:6, padding:'5px 8px', textAlign:'center' }}>
        <div style={{ fontSize:9, color:'#4c3a8a', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>Commander Tax</div>
        <div style={{ fontSize:18, fontWeight:700, color: tax > 0 ? '#f59e0b' : '#a78bfa' }}>
          {tax > 0 ? `+${tax}` : '0'}
        </div>
        <div style={{ fontSize:8, color:'#2a2050', marginTop:1 }}>
          {tax > 0 ? `costs ${tax} extra` : 'no tax yet'}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        {commander.inZone && (
          <button onClick={onCast}
            style={{ padding:'6px 0', borderRadius:5, background:'#14102a', border:'1px solid #7c3aed', color:'#a78bfa', fontSize:10, cursor:'pointer', fontWeight:600, width:'100%' }}>
            Cast from CMD Zone
          </button>
        )}
        {!commander.inZone && (
          <button onClick={onReturnToZone}
            style={{ padding:'6px 0', borderRadius:5, background:'#0d0d0d', border:'1px solid #2a2050', color:'#7c3aed', fontSize:10, cursor:'pointer', width:'100%' }}>
            Return to CMD Zone
          </button>
        )}
        <button onClick={onSendToBF}
          style={{ padding:'5px 0', borderRadius:5, background:'#0d0d0d', border:'1px solid #1a1a1a', color:'#444', fontSize:10, cursor:'pointer', width:'100%' }}>
          Put on Battlefield
        </button>
        <button onClick={() => setPicking(true)}
          style={{ padding:'4px 0', borderRadius:5, background:'#0d0d0d', border:'1px solid #111', color:'#333', fontSize:9, cursor:'pointer', width:'100%' }}>
          Change Commander
        </button>
      </div>
    </div>
  )
}
