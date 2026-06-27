import React, { useState } from 'react'

const VARIANTS = ['Commander','Standard','Oathbreaker','2-Headed Giant','Horde','Archenemy','Draft']
const LIFE_OPTIONS = [20, 30, 40, 60]

export default function LobbyPage({ config, setConfig, onStart, onBack }) {
  const [roomId] = useState('mtg-' + Math.random().toString(36).substr(2,6))
  const [copied, setCopied] = useState(false)
  const [ready, setReady] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatLog, setChatLog] = useState([
    { who:'System', text:'Room created. Share the link to invite players.', sys:true },
    { who:'Alex',   text:'Ready when you are!', sys:false },
    { who:'Sam',    text:'give me a sec picking a deck', sys:false },
  ])

  function copyRoom() {
    navigator.clipboard.writeText(window.location.origin + '?room=' + roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendChat(e) {
    e.preventDefault()
    if (!chatMsg.trim()) return
    setChatLog(l => [...l, { who:'You', text:chatMsg, sys:false, you:true }])
    setChatMsg('')
  }

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateRows:'auto 1fr auto', background:'#0a0a0a', overflow:'hidden' }}>
      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'#080808', borderBottom:'1px solid #1e1e1e' }}>
        <button onClick={onBack} style={{ padding:'4px 10px', borderRadius:5, border:'1px solid #222', background:'#111', color:'#666', fontSize:11 }}>← Back</button>
        <span style={{ fontSize:15, fontWeight:600, color:'#a78bfa' }}>✦ MTG App</span>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', border:'1px solid #2a2a2a', borderRadius:6, background:'#111', cursor:'pointer' }} onClick={copyRoom}>
          <span style={{ fontSize:12, color:'#888', fontFamily:'monospace', letterSpacing:'.08em' }}>{copied ? 'Copied!' : roomId}</span>
          <span style={{ fontSize:12, color:'#444' }}>⎘</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', overflow:'hidden', minHeight:0 }}>

        {/* LEFT */}
        <div style={{ padding:24, overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>

          {/* PLAYERS */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, color:'#444', textTransform:'uppercase', letterSpacing:'.08em' }}>Players</span>
              <span style={{ fontSize:11, color:'#555', cursor:'pointer' }} onClick={copyRoom}>+ Invite via link</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {/* You */}
              <div style={{ borderRadius:10, border:'1px solid #1e3a6e', background:'#0d1628', padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#0f1a2e', border:'1px solid #1e3a6e', color:'#60a5fa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600 }}>YO</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>You <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#0f1a2e', border:'1px solid #1e3a6e', color:'#60a5fa' }}>host</span></div>
                    <div style={{ fontSize:11, color:'#444', marginTop:2 }}>Just now</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:6, background:'#0d0d0d', border:'1px solid #1e1e1e', cursor:'pointer' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a4a1a', border:'1px solid #2d6a2d' }} />
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a1a4a', border:'1px solid #2d2d6a' }} />
                  </div>
                  <span style={{ fontSize:11, color:'#888', flex:1 }}>Simic Stompy</span>
                  <span style={{ fontSize:10, color:'#444' }}>Change</span>
                </div>
              </div>
              {/* Alex */}
              <div style={{ borderRadius:10, border:'1px solid #1e2a1e', background:'#0d1410', padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#0f1e10', border:'1px solid #1e3a1e', color:'#4ade80', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600 }}>AL</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>Alex <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#0f1e10', border:'1px solid #1e4a1e', color:'#4ade80' }}>Ready</span></div>
                    <div style={{ fontSize:11, color:'#444', marginTop:2 }}>2 min ago</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:6, background:'#0d0d0d', border:'1px solid #1e1e1e' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#4a1a1a', border:'1px solid #6a2d2d' }} />
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a1a1a', border:'1px solid #4a4a4a' }} />
                  </div>
                  <span style={{ fontSize:11, color:'#888', flex:1 }}>Rakdos Sacrifice</span>
                </div>
              </div>
              {/* Sam */}
              <div style={{ borderRadius:10, border:'1px solid #1e2a1e', background:'#0d1410', padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#1e120f', border:'1px solid #3a1e10', color:'#fb923c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600 }}>SA</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>Sam <span style={{ fontSize:9, padding:'2px 7px', borderRadius:10, background:'#1a1a1a', border:'1px solid #2a2a2a', color:'#555' }}>Not ready</span></div>
                    <div style={{ fontSize:11, color:'#444', marginTop:2 }}>1 min ago</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', borderRadius:6, background:'#0d0d0d', border:'1px solid #1e1e1e' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#2a2a14', border:'1px solid #4a4a28' }} />
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a1a4a', border:'1px solid #2d2d6a' }} />
                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a1018', border:'1px solid #2a1a3a' }} />
                  </div>
                  <span style={{ fontSize:11, color:'#888', flex:1 }}>Esper Control</span>
                </div>
              </div>
              {/* Slot 4 */}
              <div style={{ borderRadius:10, border:'1px dashed #1e1e1e', background:'#0d0d0d', padding:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:100, gap:8 }}>
                <div style={{ fontSize:12, color:'#333' }}>Waiting for player 4</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:5, background:'#111', border:'1px solid #222', cursor:'pointer', fontSize:10, color:'#555' }} onClick={copyRoom}>
                  ⎘ Copy invite link
                </div>
              </div>
            </div>
          </div>

          {/* VARIANT */}
          <div>
            <div style={{ fontSize:11, color:'#444', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Game Variant</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
              {VARIANTS.map(v => (
                <div key={v} onClick={() => setConfig(c => ({...c, variant:v}))}
                  style={{ borderRadius:8, border:'1px solid '+(config.variant===v?'#4c3a8a':'#1e1e1e'), background:config.variant===v?'#14102a':'#111', padding:'10px 8px', cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:10, color:config.variant===v?'#a78bfa':'#666' }}>{v}</div>
                </div>
              ))}
            </div>
            {/* PLANECHASE ADD-ON */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, border:'1px solid #1e1e2e', background:'#0d0d18' }}>
              <div>
                <div style={{ fontSize:12, color:'#888' }}>⬡ Planechase add-on</div>
                <div style={{ fontSize:10, color:'#333', marginTop:2 }}>Adds a shared planar deck to any format</div>
              </div>
              <div onClick={() => setConfig(c => ({...c, planechase:!c.planechase}))}
                style={{ width:34, height:18, borderRadius:10, background:config.planechase?'#2563eb':'#1e1e1e', border:'1px solid '+(config.planechase?'#3b82f6':'#333'), cursor:'pointer', position:'relative', transition:'background .15s' }}>
                <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:config.planechase?'#fff':'#444', top:2, left:config.planechase?18:3, transition:'left .15s' }} />
              </div>
            </div>
          </div>

          {/* OPTIONS */}
          <div>
            <div style={{ fontSize:11, color:'#444', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Options</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:7, background:'#111', border:'1px solid #1e1e1e' }}>
                <div style={{ fontSize:12, color:'#888' }}>Starting life</div>
                <div style={{ display:'flex', border:'1px solid #222', borderRadius:6, overflow:'hidden' }}>
                  {LIFE_OPTIONS.map(l => (
                    <div key={l} onClick={() => setConfig(c => ({...c, startingLife:l}))}
                      style={{ padding:'4px 10px', fontSize:10, cursor:'pointer', background:config.startingLife===l?'#1e1e1e':'#111', color:config.startingLife===l?'#ccc':'#444' }}>{l}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:7, background:'#111', border:'1px solid #1e1e1e' }}>
                <div>
                  <div style={{ fontSize:12, color:'#888' }}>Commander damage tracking</div>
                  <div style={{ fontSize:10, color:'#333', marginTop:1 }}>21 damage from a single commander = elimination</div>
                </div>
                <div style={{ width:34, height:18, borderRadius:10, background:'#2563eb', border:'1px solid #3b82f6', position:'relative', cursor:'pointer' }}>
                  <div style={{ position:'absolute', width:12, height:12, borderRadius:'50%', background:'#fff', top:2, left:18 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT */}
        <div style={{ borderLeft:'1px solid #1a1a1a', display:'flex', flexDirection:'column', padding:16, gap:10, overflow:'hidden' }}>
          <div style={{ fontSize:11, color:'#444', textTransform:'uppercase', letterSpacing:'.08em' }}>Pre-game chat</div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
            {chatLog.map((m,i) => (
              <div key={i}>
                <div style={{ fontSize:10, color:m.you?'#2563eb':m.sys?'#4c3a8a':'#444' }}>{m.who}</div>
                <div style={{ fontSize:12, color:m.sys?'#5a4a7a':'#888', fontStyle:m.sys?'italic':'normal', lineHeight:1.4 }}>{m.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} style={{ display:'flex', gap:6, borderTop:'1px solid #1a1a1a', paddingTop:8 }}>
            <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Say something..." style={{ flex:1, padding:'6px 10px', borderRadius:6, background:'#111', border:'1px solid #222', color:'#ccc', fontSize:12, outline:'none' }} />
            <button type="submit" style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #222', background:'#111', color:'#555', fontSize:11 }}>Send</button>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', background:'#080808', borderTop:'1px solid #1a1a1a' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', gap:4 }}>
            {[true,true,false,false].map((on,i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:on?'#1a4a1a':'#1a1a1a', border:'1px solid '+(on?'#2d6a2d':'#222') }} />
            ))}
          </div>
          <span style={{ fontSize:12, color:'#555' }}><span style={{ color:'#4ade80' }}>2</span> of 4 ready</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setReady(!ready)} style={{ padding:'9px 20px', borderRadius:7, background:'#0f1e10', border:'1px solid #1e4a1e', color:'#4ade80', fontSize:12 }}>
            {ready ? 'Unready' : 'Mark as ready'}
          </button>
          <button onClick={onStart} style={{ padding:'9px 24px', borderRadius:7, background:'#2563eb', border:'1px solid #3b82f6', color:'#fff', fontSize:13, fontWeight:500 }}>
            Start game →
          </button>
        </div>
      </div>
    </div>
  )
}
