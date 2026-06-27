import React, { useState } from 'react'

export default function LibraryPanel({ count, library, onDraw, onShuffle, onLookTop, onBottomCard, onClose }) {
  const [topCard, setTopCard] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)

  function lookTop() {
    const card = onLookTop()
    setTopCard(card)
  }

  function search() {
    const q = searchQuery.toLowerCase()
    const results = library.filter(c => c.name.toLowerCase().includes(q))
    setSearchResults(results.slice(0,10))
  }

  return (
    <div style={{
      position:'fixed', right:0, top:0, bottom:0, width:300,
      background:'#0a0a0a', borderLeft:'1px solid #2a2050',
      display:'flex', flexDirection:'column', zIndex:800,
      animation:'slideIn .2s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#e0e0e0' }}>📚 Library</div>
          <div style={{ fontSize:10, color:'#444', marginTop:1 }}>{count} cards remaining</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#333', fontSize:18, cursor:'pointer' }}>✕</button>
      </div>

      <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8, flex:1, overflowY:'auto' }}>
        {/* QUICK ACTIONS */}
        <div style={{ fontSize:10, color:'#333', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2 }}>Quick actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          <button onClick={() => onDraw(1)} style={{ padding:'8px 0', borderRadius:6, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:11, cursor:'pointer' }}>Draw 1</button>
          <button onClick={() => onDraw(3)} style={{ padding:'8px 0', borderRadius:6, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:11, cursor:'pointer' }}>Draw 3</button>
          <button onClick={onShuffle} style={{ padding:'8px 0', borderRadius:6, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:11, cursor:'pointer' }}>Shuffle</button>
          <button onClick={lookTop} style={{ padding:'8px 0', borderRadius:6, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:11, cursor:'pointer' }}>Look at top</button>
        </div>

        {/* TOP CARD REVEAL */}
        {topCard && (
          <div style={{ padding:10, borderRadius:8, background:'#111', border:'1px solid #2a2a2a' }}>
            <div style={{ fontSize:10, color:'#444', marginBottom:6 }}>Top card:</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:38, borderRadius:3, background:'#161616', border:'1px solid #2a2a2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
                {topCard.art || '✦'}
              </div>
              <div>
                <div style={{ fontSize:11, color:'#ccc' }}>{topCard.name}</div>
                <div style={{ fontSize:9, color:'#444' }}>{topCard.type}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:4, marginTop:8 }}>
              <button onClick={() => { onDraw(1); setTopCard(null) }} style={{ flex:1, padding:'4px 0', borderRadius:4, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:10, cursor:'pointer' }}>Draw it</button>
              <button onClick={() => { onBottomCard(library.length-1); setTopCard(null) }} style={{ flex:1, padding:'4px 0', borderRadius:4, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:10, cursor:'pointer' }}>Bottom</button>
              <button onClick={() => setTopCard(null)} style={{ padding:'4px 8px', borderRadius:4, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#333', fontSize:10, cursor:'pointer' }}>×</button>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div style={{ fontSize:10, color:'#333', textTransform:'uppercase', letterSpacing:'.07em', marginTop:4, marginBottom:2 }}>Search library (tutor)</div>
        <div style={{ display:'flex', gap:6 }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key==='Enter' && search()}
            placeholder="Card name..."
            style={{ flex:1, padding:'6px 10px', borderRadius:6, background:'#111', border:'1px solid #222', color:'#ccc', fontSize:11, outline:'none', fontFamily:'inherit' }}
          />
          <button onClick={search} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:11, cursor:'pointer' }}>Find</button>
        </div>

        {searchResults && (
          <div>
            {searchResults.length === 0 ? (
              <div style={{ fontSize:11, color:'#333', textAlign:'center', padding:'8px 0' }}>Not found in library</div>
            ) : searchResults.map((c,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', borderRadius:5, background:'#111', marginBottom:2 }}>
                <span style={{ fontSize:11 }}>{c.art}</span>
                <span style={{ fontSize:11, color:'#ccc', flex:1 }}>{c.name}</span>
                <button onClick={() => { onDraw(1); setSearchResults(null); setSearchQuery('') }}
                  style={{ padding:'2px 7px', borderRadius:4, border:'1px solid #2a2050', background:'#0d0a1e', color:'#a78bfa', fontSize:9, cursor:'pointer' }}>
                  Draw
                </button>
              </div>
            ))}
            <button onClick={() => { onShuffle(); setSearchResults(null) }}
              style={{ width:'100%', marginTop:6, padding:'6px 0', borderRadius:5, border:'1px solid #1a1a1a', background:'#0d0d0d', color:'#555', fontSize:10, cursor:'pointer' }}>
              Shuffle after search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
