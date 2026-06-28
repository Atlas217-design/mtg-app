import React, { useState } from 'react'
import { cleanCardName } from '../utils/deckStorage.js'

const SF = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`

// Sideboard swap flow:
// 1. User opens sideboard panel
// 2. Clicks a sideboard card to "stage" it
// 3. Library search opens automatically
// 4. User searches for the main deck card to replace
// 5. Confirm swap → sideboard card enters library, main deck card removed
export default function SideboardPanel({
  sideboard,    // [{name, id}]
  library,      // [{name, id}]
  onSwap,       // (sideboardCard, libraryCard) => void
  onClose,
}) {
  const [staged,   setStaged]   = useState(null) // sideboard card being swapped in
  const [search,   setSearch]   = useState('')
  const [imgErrs,  setImgErrs]  = useState({})
  const [preview,  setPreview]  = useState(null)
  const [step,     setStep]     = useState('choose') // 'choose' | 'replace'

  const libFiltered = library.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )
  // Deduplicate library by name for display
  const libUniq = Object.values(
    libFiltered.reduce((acc, c) => { if (!acc[c.name]) acc[c.name] = c; return acc }, {})
  )

  function stageCard(card) {
    setStaged(card)
    setStep('replace')
    setSearch('')
    setPreview(null)
  }

  function confirmSwap(libCard) {
    if (!staged) return
    onSwap(staged, libCard)
    setStaged(null)
    setStep('choose')
    setSearch('')
    setPreview(null)
  }

  function cancel() {
    setStaged(null)
    setStep('choose')
    setSearch('')
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>

      {/* STEP INDICATOR */}
      <div style={{padding:'8px 12px',borderBottom:'1px solid #1a1a1a',flexShrink:0,display:'flex',alignItems:'center',gap:8}}>
        <div style={{display:'flex',gap:4}}>
          <div style={{padding:'3px 10px',borderRadius:10,fontSize:9,fontWeight:600,
            background:step==='choose'?'#14102a':'#0d0d0d',
            border:`1px solid ${step==='choose'?'#4c3a8a':'#1a1a1a'}`,
            color:step==='choose'?'#a78bfa':'#333'}}>
            1. Choose sideboard card
          </div>
          <div style={{padding:'3px 10px',borderRadius:10,fontSize:9,fontWeight:600,
            background:step==='replace'?'#0d1a2a':'#0d0d0d',
            border:`1px solid ${step==='replace'?'#1e4a8a':'#1a1a1a'}`,
            color:step==='replace'?'#60a5fa':'#333'}}>
            2. Pick card to replace
          </div>
        </div>
        {staged&&<button onClick={cancel} style={{marginLeft:'auto',padding:'3px 8px',borderRadius:4,border:'1px solid #2a1a1a',background:'#111',color:'#555',fontSize:9,cursor:'pointer'}}>Cancel</button>}
      </div>

      {/* STAGED CARD BANNER */}
      {staged&&(
        <div style={{padding:'8px 12px',background:'#0d1628',borderBottom:'1px solid #1a2a4a',flexShrink:0,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:44,borderRadius:4,overflow:'hidden',border:'1px solid #1e4a8a',flexShrink:0}}>
            <img src={SF(staged.name)} alt={staged.name} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,color:'#60a5fa',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{staged.name}</div>
            <div style={{fontSize:9,color:'#2a4a7a',marginTop:1}}>Swapping in — search your library for the card to replace</div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

        {/* STEP 1: CHOOSE SIDEBOARD CARD */}
        {step==='choose'&&(
          <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
            {sideboard.length===0?(
              <div style={{textAlign:'center',padding:30,fontSize:12,color:'#222'}}>No sideboard cards</div>
            ):(
              <>
                <div style={{fontSize:10,color:'#333',marginBottom:8}}>Click a card to swap it into your library</div>
                {sideboard.map((card,i)=>(
                  <SBCard key={card.id||i} card={card} imgErrs={imgErrs} setImgErrs={setImgErrs}
                    onHover={setPreview} onClick={()=>stageCard(card)}/>
                ))}
              </>
            )}
          </div>
        )}

        {/* STEP 2: CHOOSE LIBRARY CARD TO REPLACE */}
        {step==='replace'&&(
          <>
            <div style={{padding:'6px 12px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search library for card to replace..."
                style={{width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'8px 12px'}}>
              {libUniq.length===0?(
                <div style={{textAlign:'center',padding:20,fontSize:11,color:'#222'}}>
                  {search?`"${search}" not found in library`:'Library is empty'}
                </div>
              ):libUniq.map((card,i)=>(
                <SBCard key={card.id||i} card={card} imgErrs={imgErrs} setImgErrs={setImgErrs}
                  onHover={setPreview}
                  onClick={()=>confirmSwap(card)}
                  actionLabel="Replace with sideboard card"
                  actionColor="#ef4444"/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PREVIEW */}
      {preview&&(
        <div style={{borderTop:'1px solid #1a1a1a',padding:8,flexShrink:0,display:'flex',justifyContent:'center',background:'#0d0d0d'}}>
          <img src={SF(preview)} alt={preview} style={{height:100,borderRadius:5,border:'1px solid #333'}}
            onError={e=>e.target.style.display='none'}/>
        </div>
      )}
    </div>
  )
}

function SBCard({card, imgErrs, setImgErrs, onHover, onClick, actionLabel, actionColor}) {
  const err = imgErrs[card.id]
  return (
    <div
      onMouseEnter={()=>onHover(card.name)}
      onMouseLeave={()=>onHover(null)}
      style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:6,marginBottom:3,cursor:'pointer',border:'1px solid transparent'}}
      onMouseEnter2={e=>{e.currentTarget.style.background='#111';e.currentTarget.style.borderColor='#222'}}
      onMouseLeave2={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='transparent'}}>
      <div style={{width:36,height:50,borderRadius:4,overflow:'hidden',flexShrink:0,border:'1px solid #333',background:'#0d1a0d'}}>
        {!err?(
          <img src={SF(card.name)} alt={card.name} style={{width:'100%',height:'100%',objectFit:'cover'}}
            onError={()=>setImgErrs(p=>({...p,[card.id]:true}))}/>
        ):(
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#555',textAlign:'center',padding:2}}>{card.name}</div>
        )}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,color:'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{card.name}</div>
      </div>
      <button onClick={onClick}
        style={{padding:'3px 8px',borderRadius:4,border:`1px solid ${actionColor||'#2a2050'}`,background:'#0d0a1e',color:actionColor||'#a78bfa',fontSize:9,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
        {actionLabel||'Swap in →'}
      </button>
    </div>
  )
}
