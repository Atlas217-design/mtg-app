import React, { useState } from 'react'

const ZONE_LABELS = { gy:'Graveyard', exile:'Exile', cmd:'Command Zone' }
const COL_BG = {
  cg:'#0d1a0d', cu:'#0d1220', cr:'#180d0d', cb:'#100d18',
  cw:'#1a1a0d', ca:'#161616', cforest:'#0d1a0d', cisland:'#0d1220',
  cmtn:'#180d0d', cswamp:'#100d18', cplains:'#1a1a0d',
}

export default function ZonePanel({ player, zone, zones, onRetrieve, onClose }) {
  const [activeZone, setActiveZone] = useState(zone)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const isMine = player === 'You'

  const key = player + '-' + activeZone
  const cards = (zones[key] || []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      position:'fixed', right:0, top:0, bottom:0, width:320,
      background:'#0a0a0a', borderLeft:'1px solid #2a2050',
      display:'flex', flexDirection:'column', zIndex:800,
      animation:'slideIn .2s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* HEADER */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#e0e0e0' }}>{player}'s Zones</div>
          <div style={{ fontSize:10, color:'#444', marginTop:1 }}>{cards.length} cards in {ZONE_LABELS[activeZone]}</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#333', fontSize:18, cursor:'pointer' }}>✕</button>
      </div>

      {/* TABS */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1a1a1a' }}>
        {['gy','exile','cmd'].map(z => (
          <div key={z} onClick={() => { setActiveZone(z); setSearch(''); setPreview(null) }}
            style={{ flex:1, padding:'8px 0', textAlign:'center', fontSize:11,
              color: activeZone===z ? '#a78bfa' : '#444',
              borderBottom: activeZone===z ? '2px solid #a78bfa' : '2px solid transparent',
              cursor:'pointer', transition:'color .1s' }}>
            {ZONE_LABELS[z]} ({(zones[player+'-'+z]||[]).length})
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div style={{ padding:'8px 12px', borderBottom:'1px solid #141414' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cards..."
          style={{ width:'100%', padding:'6px 10px', borderRadius:6, background:'#111', border:'1px solid #222', color:'#ccc', fontSize:12, outline:'none', fontFamily:'inherit' }}
        />
      </div>

      {/* CARD PREVIEW */}
      {preview && (
        <div style={{ margin:'8px 12px', borderRadius:8, background:'#111', border:'1px solid #2a2a2a', overflow:'hidden' }}>
          <div style={{ height:100, background:COL_BG[preview.col]||'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>
            {preview.art}
          </div>
          <div style={{ padding:'8px 10px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#e0e0e0' }}>{preview.name}</div>
            <div style={{ fontSize:10, color:'#555', marginTop:2 }}>{preview.type}</div>
            {preview.oracle && <div style={{ fontSize:9, color:'#555', lineHeight:1.5, marginTop:6, paddingTop:6, borderTop:'1px solid #1a1a1a' }}>{preview.oracle}</div>}
            {preview.pt && <div style={{ fontSize:10, color:'#888', marginTop:4 }}>{preview.pt}</div>}
          </div>
        </div>
      )}

      {/* CARD LIST */}
      <div style={{ flex:1, overflowY:'auto', padding:'4px 8px' }}>
        {cards.length === 0 ? (
          <div style={{ textAlign:'center', padding:30, fontSize:12, color:'#222' }}>
            {search ? 'No cards match your search' : 'Nothing here yet'}
          </div>
        ) : cards.map((card, i) => (
          <div key={card.id || i}
            onClick={() => setPreview(preview?.id === card.id ? null : card)}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, cursor:'pointer', background: preview?.id === card.id ? '#14102a' : 'transparent', marginBottom:2 }}
            onMouseEnter={e => e.currentTarget.style.background = preview?.id === card.id ? '#14102a' : '#111'}
            onMouseLeave={e => e.currentTarget.style.background = preview?.id === card.id ? '#14102a' : 'transparent'}
          >
            <div style={{ width:28, height:38, borderRadius:3, background:COL_BG[card.col]||'#111', border:'1px solid #333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>
              {card.art}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, color:'#ccc', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{card.name}</div>
              <div style={{ fontSize:9, color:'#333', marginTop:1 }}>{card.type}</div>
            </div>
            {isMine && (
              <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                <button onClick={e=>{ e.stopPropagation(); onRetrieve(player,activeZone,i,'hand') }}
                  style={{ padding:'2px 7px', borderRadius:4, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:9, cursor:'pointer' }}>
                  Hand
                </button>
                {activeZone !== 'cmd' && (
                  <button onClick={e=>{ e.stopPropagation(); onRetrieve(player,activeZone,i,'bf') }}
                    style={{ padding:'2px 7px', borderRadius:4, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:9, cursor:'pointer' }}>
                    BF
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
