import React, { useState, useEffect } from 'react'
import { loadAllDecks, saveDeck, deleteDeck, renameDeck, parseDeckFromText, shuffleCards } from '../utils/deckStorage.js'
import { getTokensForDeck } from '../utils/tokenRegistry.js'

export default function DeckManager({ currentDeckId, onLoad, onClose }) {
  const [decks,     setDecks]     = useState([])
  const [tab,       setTab]       = useState('my') // 'my' | 'import'
  const [importTxt, setImportTxt] = useState('')
  const [deckName,  setDeckName]  = useState('My Deck')
  const [cmdName,   setCmdName]   = useState('')
  const [renaming,  setRenaming]  = useState(null) // deck id being renamed
  const [renameVal, setRenameVal] = useState('')

  useEffect(() => { setDecks(loadAllDecks()) }, [])

  function doImport() {
    const parsed = parseDeckFromText(importTxt, deckName)
    if (parsed.cards.length === 0) { alert('No cards found — check your deck list format'); return }

    // Commander from text or from field
    const commander = parsed.commander || (cmdName.trim() ? cmdName.trim() : null)

    // Compute tokens for this deck
    const cardNames  = [...new Set(parsed.cards.map(c => c.name))]
    const deckTokens = getTokensForDeck(cardNames)

    const deck = saveDeck({
      name:      deckName,
      rawText:   importTxt,
      cards:     parsed.cards,
      commander,
      deckTokens,
      cardNames,
    })
    setDecks(loadAllDecks())
    setImportTxt('')
    setDeckName('My Deck')
    setCmdName('')
    setTab('my')
    // Auto-load it
    onLoad(deck)
  }

  function doLoad(deck) {
    onLoad(deck)
    onClose()
  }

  function doDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this deck?')) return
    deleteDeck(id)
    setDecks(loadAllDecks())
  }

  function doRename(id, e) {
    e.stopPropagation()
    const d = decks.find(x => x.id === id)
    setRenaming(id)
    setRenameVal(d?.name || '')
  }

  function finishRename(id) {
    if (renameVal.trim()) { renameDeck(id, renameVal.trim()); setDecks(loadAllDecks()) }
    setRenaming(null)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#111',border:'1px solid #333',borderRadius:12,width:520,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.9)'}}>

        {/* HEADER */}
        <div style={{display:'flex',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid #222',flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:600,color:'#e0e0e0',flex:1}}>📚 Deck Manager</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:'1px solid #222',flexShrink:0}}>
          {[['my','My Decks'],['import','Import New Deck']].map(([k,l])=>(
            <div key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'9px 0',textAlign:'center',fontSize:11,cursor:'pointer',color:tab===k?'#a78bfa':'#555',borderBottom:tab===k?'2px solid #a78bfa':'2px solid transparent'}}>
              {l} {k==='my'&&`(${decks.length})`}
            </div>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:16}}>

          {/* MY DECKS */}
          {tab==='my'&&(
            decks.length===0 ? (
              <div style={{textAlign:'center',padding:'40px 20px'}}>
                <div style={{fontSize:24,marginBottom:10}}>📭</div>
                <div style={{fontSize:13,color:'#333',marginBottom:8}}>No saved decks yet</div>
                <div style={{fontSize:11,color:'#2a2a2a'}}>Import a deck to get started</div>
                <button onClick={()=>setTab('import')} style={{marginTop:14,padding:'8px 20px',borderRadius:6,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:12,cursor:'pointer'}}>
                  Import a deck →
                </button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {decks.map(deck=>(
                  <div key={deck.id}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:7,border:`1px solid ${deck.id===currentDeckId?'#4c3a8a':'#1a1a1a'}`,background:deck.id===currentDeckId?'#14102a':'#0d0d0d',cursor:'pointer'}}
                    onClick={()=>doLoad(deck)}
                    onMouseEnter={e=>{if(deck.id!==currentDeckId)e.currentTarget.style.borderColor='#2a2a2a'}}
                    onMouseLeave={e=>{if(deck.id!==currentDeckId)e.currentTarget.style.borderColor='#1a1a1a'}}>

                    {/* DECK INFO */}
                    <div style={{flex:1,minWidth:0}}>
                      {renaming===deck.id ? (
                        <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                          onBlur={()=>finishRename(deck.id)}
                          onKeyDown={e=>{if(e.key==='Enter')finishRename(deck.id);if(e.key==='Escape')setRenaming(null)}}
                          onClick={e=>e.stopPropagation()}
                          style={{width:'100%',padding:'3px 6px',borderRadius:4,background:'#0d0d0d',border:'1px solid #a78bfa',color:'#e0e0e0',fontSize:12,outline:'none',fontFamily:'inherit'}}/>
                      ):(
                        <div style={{fontSize:13,fontWeight:500,color:deck.id===currentDeckId?'#a78bfa':'#ccc',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {deck.name}
                          {deck.id===currentDeckId&&<span style={{marginLeft:6,fontSize:9,padding:'1px 6px',borderRadius:8,background:'#2a2050',color:'#a78bfa'}}>Active</span>}
                        </div>
                      )}
                      <div style={{fontSize:10,color:'#333',marginTop:2,display:'flex',gap:10}}>
                        <span>{deck.cards?.length||0} cards</span>
                        {deck.commander&&<span style={{color:'#4c3a8a'}}>⬡ {deck.commander}</span>}
                        {deck.deckTokens?.length>0&&<span>{deck.deckTokens.length} token types</span>}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div style={{display:'flex',gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>doLoad(deck)}
                        style={{padding:'4px 10px',borderRadius:5,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:10,cursor:'pointer',whiteSpace:'nowrap'}}>
                        Load
                      </button>
                      <button onClick={e=>doRename(deck.id,e)}
                        style={{padding:'4px 8px',borderRadius:5,border:'1px solid #222',background:'#111',color:'#555',fontSize:10,cursor:'pointer'}}>
                        ✏
                      </button>
                      <button onClick={e=>doDelete(deck.id,e)}
                        style={{padding:'4px 8px',borderRadius:5,border:'1px solid #2a1a1a',background:'#111',color:'#4a1a1a',fontSize:10,cursor:'pointer'}}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* IMPORT */}
          {tab==='import'&&(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {/* DECK NAME */}
              <div>
                <label style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:4}}>Deck name</label>
                <input value={deckName} onChange={e=>setDeckName(e.target.value)}
                  style={{width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:12,outline:'none',fontFamily:'inherit'}}/>
              </div>

              {/* COMMANDER */}
              <div>
                <label style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:4}}>
                  Commander (optional — or add <code style={{color:'#888',background:'#0d0d0d',padding:'0 4px',borderRadius:3}}>*CMDR*</code> after card name in list)
                </label>
                <input value={cmdName} onChange={e=>setCmdName(e.target.value)}
                  placeholder="e.g. Mina and Denn, Wildborn"
                  style={{width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:12,outline:'none',fontFamily:'inherit'}}/>
              </div>

              {/* DECK LIST */}
              <div>
                <label style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:'.07em',display:'block',marginBottom:4}}>
                  Deck list (Moxfield, Archidekt, MTGO, or plain text)
                </label>
                <textarea value={importTxt} onChange={e=>setImportTxt(e.target.value)}
                  placeholder={'1 Sol Ring *CMDR*\n1 Command Tower\n10 Forest\n1 Llanowar Elves\n...'}
                  style={{width:'100%',height:240,background:'#0d0d0d',border:'1px solid #222',borderRadius:6,color:'#ccc',fontSize:11,padding:10,resize:'vertical',fontFamily:'monospace',outline:'none',lineHeight:1.5}}/>
              </div>

              <div style={{fontSize:10,color:'#333',lineHeight:1.6}}>
                Tip: Add <code style={{color:'#666',background:'#111',padding:'0 4px',borderRadius:3}}>*CMDR*</code> after your commander's name to auto-detect it. Each deck's tokens are computed automatically from the card list.
              </div>

              <button onClick={doImport}
                style={{padding:'10px',borderRadius:6,background:'#2563eb',border:'none',color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600}}>
                Import & Save Deck
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
