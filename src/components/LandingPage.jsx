import React from 'react'

const VARIANTS = [
  { icon:'⚔', name:'Commander',     desc:'100-card singleton, 40 life', players:'2–4p' },
  { icon:'⬡', name:'Planechase',    desc:'Add-on to any format',        players:'2–4p' },
  { icon:'⚡', name:'2-Headed Giant',desc:'Teams share a life total',    players:'4p'   },
  { icon:'◈', name:'Oathbreaker',   desc:'Planeswalker commanders',      players:'2–4p' },
  { icon:'☠', name:'Horde Magic',   desc:'Co-op vs AI horde',           players:'1–4p' },
  { icon:'▲', name:'Archenemy',     desc:'1 villain vs 3 heroes',       players:'1v3'  },
  { icon:'◻', name:'Standard',      desc:'Classic 60-card 1v1',         players:'2p'   },
  { icon:'◑', name:'Draft',         desc:'Build your deck as you play',  players:'2–8p' },
]

export default function LandingPage({ onPlay }) {
  return (
    <div style={{ overflowY:'auto', height:'100%', background:'#0a0a0a' }}>
      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 28px', background:'rgba(10,10,10,.95)', borderBottom:'1px solid #1a1a1a', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>
          <span style={{ color:'#a78bfa' }}>✦</span> MTG App
        </div>
        <div style={{ flex:1 }} />
        <button onClick={onPlay} style={{ padding:'8px 20px', borderRadius:6, background:'#a78bfa', border:'none', fontSize:13, fontWeight:600, color:'#0a0a0a' }}>
          Play now →
        </button>
      </nav>

      {/* HERO */}
      <section style={{ padding:'90px 28px 70px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,.12), transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, background:'rgba(124,58,237,.1)', border:'1px solid rgba(124,58,237,.3)', fontSize:11, color:'#a78bfa', marginBottom:24, position:'relative' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa', animation:'blink 2s ease infinite' }} />
          Free to play · No account required
        </div>
        <h1 style={{ fontSize:56, fontWeight:700, lineHeight:1.08, letterSpacing:'-.03em', color:'#fff', marginBottom:16, position:'relative' }}>
          Play Magic.<br /><span style={{ color:'#a78bfa' }}>Instantly.</span>
        </h1>
        <p style={{ fontSize:17, color:'#555', lineHeight:1.6, maxWidth:440, margin:'0 auto 36px' }}>
          No downloads, no accounts — share a link and start playing in seconds.
        </p>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:48 }}>
          <button onClick={onPlay} style={{ padding:'13px 30px', borderRadius:8, background:'#a78bfa', border:'none', fontSize:15, fontWeight:600, color:'#0a0a0a', transition:'all .12s' }}>
            Create a game →
          </button>
          <button onClick={onPlay} style={{ padding:'13px 22px', borderRadius:8, background:'#111', border:'1px solid #2a2a2a', fontSize:15, color:'#888' }}>
            Demo the board
          </button>
        </div>
      </section>

      {/* VARIANTS */}
      <section style={{ padding:'60px 28px', borderTop:'1px solid #141414', background:'#080808' }}>
        <p style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:'.1em', textAlign:'center', marginBottom:10 }}>Game variants</p>
        <h2 style={{ fontSize:34, fontWeight:600, color:'#e0e0e0', textAlign:'center', marginBottom:8, letterSpacing:'-.02em' }}>One app, every format</h2>
        <p style={{ fontSize:14, color:'#444', textAlign:'center', marginBottom:44 }}>Pick your format — the board adapts automatically.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxWidth:900, margin:'0 auto' }}>
          {VARIANTS.map(v => (
            <div key={v.name} style={{ borderRadius:10, border:'1px solid #1a1a1a', background:'#0d0d0d', padding:16 }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{v.icon}</div>
              <div style={{ fontSize:13, fontWeight:500, color:'#ccc', marginBottom:4 }}>{v.name}</div>
              <div style={{ fontSize:11, color:'#3a3a3a', lineHeight:1.5, marginBottom:8 }}>{v.desc}</div>
              <span style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:'#111', border:'1px solid #222', color:'#444' }}>{v.players}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:'20px 28px', borderTop:'1px solid #141414', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, color:'#333' }}>✦ MTG App — fan-made companion</span>
        <span style={{ fontSize:10, color:'#1e1e1e', maxWidth:300, textAlign:'right' }}>
          Unofficial fan app. Not affiliated with Wizards of the Coast. Magic: The Gathering is property of WotC.
        </span>
      </footer>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}
