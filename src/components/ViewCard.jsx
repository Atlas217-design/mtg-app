import React, { useState, useEffect } from 'react'

const SF_IMG  = (name, ver='normal') =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=${ver}`
const SF_JSON = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`

const MANA_COLORS = {
  W:'#f9fafb', U:'#60a5fa', B:'#c084fc', R:'#f87171', G:'#4ade80',
  C:'#9ca3af', X:'#e0e0e0', '0':'#e0e0e0', T:'#f59e0b',
}

function ManaCost({ cost }) {
  if (!cost) return null
  const symbols = cost.replace(/[{}]/g,'').split('').filter(Boolean)
  return (
    <span style={{display:'inline-flex',gap:3,alignItems:'center'}}>
      {symbols.map((s,i)=>(
        <span key={i} style={{
          width:16,height:16,borderRadius:'50%',
          background:MANA_COLORS[s]||'#444',
          display:'inline-flex',alignItems:'center',justifyContent:'center',
          fontSize:9,fontWeight:700,color:'#0a0a0a',flexShrink:0,
          border:'1px solid rgba(0,0,0,.3)',
        }}>{s}</span>
      ))}
    </span>
  )
}

export default function ViewCard({ cardName, onClose }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgErr,  setImgErr]  = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!cardName) return
    setLoading(true); setError(null); setData(null)
    fetch(SF_JSON(cardName))
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError('Card not found'); setLoading(false) })
  }, [cardName])

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'#111',border:'1px solid #2a2a2a',borderRadius:12,
        width:700,maxHeight:'90vh',display:'flex',flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,.95)',overflow:'hidden',
      }}>
        {/* HEADER */}
        <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:600,color:'#e0e0e0',flex:1}}>{cardName}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        {loading && (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40}}>
            <div style={{fontSize:12,color:'#333'}}>Loading card data...</div>
          </div>
        )}

        {error && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:40}}>
            <div style={{fontSize:13,color:'#ef4444'}}>{error}</div>
            <div style={{fontSize:11,color:'#333'}}>Scryfall could not find "{cardName}"</div>
          </div>
        )}

        {data && (
          <div style={{display:'grid',gridTemplateColumns:'220px 1fr',flex:1,overflow:'hidden'}}>
            {/* LEFT: card image */}
            <div style={{padding:14,borderRight:'1px solid #1a1a1a',display:'flex',flexDirection:'column',gap:8,background:'#0d0d0d'}}>
              <div style={{borderRadius:9,overflow:'hidden',border:'1px solid #2a2a2a'}}>
                {!imgErr ? (
                  <img src={SF_IMG(cardName)} alt={cardName} style={{width:'100%',display:'block'}}
                    onError={()=>setImgErr(true)}/>
                ) : (
                  <div style={{height:200,background:'#1a1a2a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#555',padding:8,textAlign:'center'}}>{cardName}</div>
                )}
              </div>
              {/* LEGALITY PILLS */}
              {data.legalities && (
                <div>
                  <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>Legality</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {Object.entries(data.legalities)
                      .filter(([,v])=>v==='legal')
                      .map(([f])=>(
                        <span key={f} style={{fontSize:8,padding:'1px 5px',borderRadius:8,background:'rgba(74,222,128,.1)',border:'1px solid rgba(74,222,128,.2)',color:'#4ade80'}}>
                          {f}
                        </span>
                      ))
                    }
                  </div>
                </div>
              )}
              {/* PRICE */}
              {data.prices?.usd && (
                <div style={{padding:'6px 8px',borderRadius:5,background:'#1a1a1a',border:'1px solid #222'}}>
                  <div style={{fontSize:9,color:'#444',marginBottom:2}}>Market Price</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#4ade80'}}>${data.prices.usd}</div>
                  {data.prices.usd_foil&&<div style={{fontSize:9,color:'#555',marginTop:1}}>Foil: ${data.prices.usd_foil}</div>}
                </div>
              )}
            </div>

            {/* RIGHT: card info */}
            <div style={{padding:16,overflowY:'auto',display:'flex',flexDirection:'column',gap:12}}>
              {/* NAME + COST */}
              <div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <span style={{fontSize:18,fontWeight:700,color:'#e0e0e0',flex:1}}>{data.name}</span>
                  <ManaCost cost={data.mana_cost}/>
                </div>
                <div style={{fontSize:11,color:'#888',fontStyle:'italic'}}>{data.type_line}</div>
              </div>

              {/* SET INFO */}
              <div style={{display:'flex',gap:8,fontSize:10,color:'#444'}}>
                <span>{data.set_name}</span>
                <span>·</span>
                <span>#{data.collector_number}</span>
                <span>·</span>
                <span style={{textTransform:'capitalize'}}>{data.rarity}</span>
                {data.artist&&<><span>·</span><span>Art: {data.artist}</span></>}
              </div>

              {/* ORACLE TEXT */}
              {data.oracle_text && (
                <div style={{padding:'10px 12px',borderRadius:7,background:'#0d0d0d',border:'1px solid #1a1a1a'}}>
                  <div style={{fontSize:9,color:'#333',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Oracle Text</div>
                  <div style={{fontSize:12,color:'#ccc',lineHeight:1.7,whiteSpace:'pre-line'}}>{data.oracle_text}</div>
                </div>
              )}

              {/* FLAVOR TEXT */}
              {data.flavor_text && (
                <div style={{padding:'8px 12px',borderRadius:6,background:'#0a0a0a',borderLeft:'2px solid #2a2a2a'}}>
                  <div style={{fontSize:11,color:'#444',fontStyle:'italic',lineHeight:1.6}}>{data.flavor_text}</div>
                </div>
              )}

              {/* P/T OR LOYALTY */}
              {(data.power || data.loyalty) && (
                <div style={{display:'flex',gap:12}}>
                  {data.power && (
                    <div style={{padding:'6px 12px',borderRadius:6,background:'#0d0d0d',border:'1px solid #222',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'#444',marginBottom:2}}>Power / Toughness</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#e0e0e0'}}>{data.power} / {data.toughness}</div>
                    </div>
                  )}
                  {data.loyalty && (
                    <div style={{padding:'6px 12px',borderRadius:6,background:'#0d0d0d',border:'1px solid #222',textAlign:'center'}}>
                      <div style={{fontSize:9,color:'#444',marginBottom:2}}>Starting Loyalty</div>
                      <div style={{fontSize:16,fontWeight:700,color:'#a78bfa'}}>{data.loyalty}</div>
                    </div>
                  )}
                </div>
              )}

              {/* RULINGS LINK */}
              <div style={{fontSize:10,color:'#2a2a2a',marginTop:'auto',paddingTop:8,borderTop:'1px solid #141414'}}>
                Data from Scryfall · {data.set?.toUpperCase()} #{data.collector_number}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
