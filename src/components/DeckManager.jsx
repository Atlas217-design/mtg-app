import React, { useState, useEffect } from 'react'
import { loadAllDecks, saveDeck, deleteDeck, renameDeck,
         parseDeckFromText, shuffleCards, cleanCardName } from '../utils/deckStorage.js'
import { getTokensForDeck } from '../utils/tokenRegistry.js'

export default function DeckManager({ currentDeckId, onLoad, onClose }) {
  const [decks,    setDecks]    = useState([])
  const [tab,      setTab]      = useState('my')
  const [renaming, setRenaming] = useState(null)
  const [renameV,  setRenameV]  = useState('')

  // Import form fields
  const [deckName,   setDeckName]   = useState('My Deck')
  const [mainText,   setMainText]   = useState('')
  const [cmdText,    setCmdText]    = useState('')   // single commander name
  const [tokenText,  setTokenText]  = useState('')   // optional token list
  const [sbText,     setSbText]     = useState('')   // sideboard list
  const [importing,  setImporting]  = useState(false)
  const [importErr,  setImportErr]  = useState('')

  useEffect(() => { setDecks(loadAllDecks()) }, [])

  // ── IMPORT ────────────────────────────────────────────────
  function doImport() {
    setImportErr('')
    if (!mainText.trim()) { setImportErr('Main deck is required'); return }

    const parsed = parseDeckFromText(mainText, {
      commanderOverride: cmdText.trim() ? cleanCardName(cmdText.trim()) : null,
      tokenLines:  tokenText,
      sideboardLines: sbText,
    })

    if (parsed.main.length === 0) { setImportErr('No cards found — check your deck list format'); return }

    const commander  = parsed.commander || null
    const cardNames  = [...new Set(parsed.main.map(c => c.name))]
    const deckTokens = getTokensForDeck(cardNames)

    // Merge Moxfield token list with auto-detected tokens
    const importedTokenNames = parsed.tokens.map(t => t.name)
    const mergedTokens = [
      ...deckTokens,
      ...importedTokenNames
        .filter(n => !deckTokens.find(t => t.name === n))
        .map(n => ({ name: n, pt:'', type:'Token', color:'', art:'◈', scryfall: n + ' Token', sourceCard:'imported', notes:'' }))
    ]

    setImporting(true)
    const deck = saveDeck({
      name: deckName,
      rawMain: mainText,
      rawTokens: tokenText,
      rawSideboard: sbText,
      cards: parsed.main,
      commander,
      sideboard: parsed.sideboard,
      deckTokens: mergedTokens,
      cardNames,
    })
    setDecks(loadAllDecks())
    setImporting(false)
    setMainText(''); setCmdText(''); setTokenText(''); setSbText('')
    setDeckName('My Deck')
    setTab('my')
    onLoad(deck)
  }

  function doLoad(deck) { onLoad(deck); onClose() }

  function doDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this deck?')) return
    deleteDeck(id); setDecks(loadAllDecks())
  }

  function doRename(id, e) {
    e.stopPropagation()
    setRenaming(id); setRenameV(decks.find(d=>d.id===id)?.name||'')
  }
  function finishRename(id) {
    if (renameV.trim()) { renameDeck(id, renameV.trim()); setDecks(loadAllDecks()) }
    setRenaming(null)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:8000,display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:'#111',border:'1px solid #2a2a2a',borderRadius:12,width:680,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.95)'}}>

        {/* HEADER */}
        <div style={{display:'flex',alignItems:'center',padding:'14px 18px',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:600,color:'#e0e0e0',flex:1}}>📚 Deck Manager</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#444',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        {/* TABS */}
        <div style={{display:'flex',borderBottom:'1px solid #1a1a1a',flexShrink:0}}>
          {[['my',`My Decks (${decks.length})`],['import','Import / Edit Deck']].map(([k,l])=>(
            <div key={k} onClick={()=>setTab(k)}
              style={{flex:1,padding:'9px 0',textAlign:'center',fontSize:11,cursor:'pointer',
                color:tab===k?'#a78bfa':'#555',
                borderBottom:tab===k?'2px solid #a78bfa':'2px solid transparent'}}>
              {l}
            </div>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto'}}>

          {/* MY DECKS */}
          {tab==='my'&&(
            <div style={{padding:16}}>
              {decks.length===0?(
                <div style={{textAlign:'center',padding:'40px 20px'}}>
                  <div style={{fontSize:28,marginBottom:10}}>📭</div>
                  <div style={{fontSize:13,color:'#333',marginBottom:8}}>No saved decks yet</div>
                  <button onClick={()=>setTab('import')} style={{padding:'8px 20px',borderRadius:6,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:12,cursor:'pointer'}}>
                    Import a deck →
                  </button>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {decks.map(deck=>(
                    <div key={deck.id}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:7,
                        border:`1px solid ${deck.id===currentDeckId?'#4c3a8a':'#1a1a1a'}`,
                        background:deck.id===currentDeckId?'#14102a':'#0d0d0d',cursor:'pointer'}}
                      onClick={()=>doLoad(deck)}>
                      <div style={{flex:1,minWidth:0}}>
                        {renaming===deck.id?(
                          <input autoFocus value={renameV} onChange={e=>setRenameV(e.target.value)}
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
                        <div style={{fontSize:10,color:'#2a2a2a',marginTop:2,display:'flex',gap:10,flexWrap:'wrap'}}>
                          <span>{deck.cards?.length||0} cards</span>
                          {deck.commander&&<span style={{color:'#4c3a8a'}}>⬡ {deck.commander}</span>}
                          {deck.sideboard?.length>0&&<span>{deck.sideboard.length} sideboard</span>}
                          {deck.deckTokens?.length>0&&<span>{deck.deckTokens.length} token types</span>}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:4,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>doLoad(deck)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #2a2050',background:'#0d0a1e',color:'#a78bfa',fontSize:10,cursor:'pointer'}}>Load</button>
                        <button onClick={e=>doRename(deck.id,e)} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #222',background:'#111',color:'#555',fontSize:10,cursor:'pointer'}}>✏</button>
                        <button onClick={e=>doDelete(deck.id,e)} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #2a1a1a',background:'#111',color:'#4a1a1a',fontSize:10,cursor:'pointer'}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* IMPORT */}
          {tab==='import'&&(
            <div style={{padding:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

              {/* DECK NAME */}
              <div style={{gridColumn:'1/-1'}}>
                <Label>Deck Name</Label>
                <input value={deckName} onChange={e=>setDeckName(e.target.value)}
                  style={IStyle}/>
              </div>

              {/* COMMANDER */}
              <div>
                <Label>Commander <span style={{color:'#2a2050',fontWeight:400}}>(one card name)</span></Label>
                <input value={cmdText} onChange={e=>setCmdText(e.target.value)}
                  placeholder="e.g. Mina and Denn, Wildborn"
                  style={IStyle}/>
                <div style={{fontSize:9,color:'#2a2a2a',marginTop:3}}>
                  Or add <code style={{color:'#555',background:'#0d0d0d',padding:'0 3px',borderRadius:2}}>*CMDR*</code> after the card name in your main deck list
                </div>
              </div>

              {/* TOKEN LIST */}
              <div>
                <Label>Token List <span style={{color:'#2a2050',fontWeight:400}}>(from Moxfield export, optional)</span></Label>
                <textarea value={tokenText} onChange={e=>setTokenText(e.target.value)}
                  placeholder={'1 Insect Token\n1 Treasure Token\n1 Scute Swarm\n...'}
                  style={{...TAStyle,height:80}}/>
                <div style={{fontSize:9,color:'#2a2a2a',marginTop:3}}>
                  Paste Moxfield token section. Auto-detection also runs from card names.
                </div>
              </div>

              {/* MAIN DECK */}
              <div style={{gridColumn:'1/-1'}}>
                <Label>Main Deck <span style={{color:'#2a2050',fontWeight:400}}>(required — paste from Moxfield, Archidekt, MTGO, or plain text)</span></Label>
                <textarea value={mainText} onChange={e=>setMainText(e.target.value)}
                  placeholder={'1 Sol Ring\n1 Command Tower\n10 Forest\n1 Llanowar Elves *CMDR*\n...\n\nMoxfield format also works:\n1 Forest (ZNR) 192\n1 Sol Ring (2XM) 319'}
                  style={{...TAStyle,height:200}}/>
              </div>

              {/* SIDEBOARD */}
              <div style={{gridColumn:'1/-1'}}>
                <Label>Sideboard <span style={{color:'#2a2050',fontWeight:400}}>(cards that can swap into your main deck)</span></Label>
                <textarea value={sbText} onChange={e=>setSbText(e.target.value)}
                  placeholder={'1 Rampaging Baloths\n1 Cultivator Colossus\n1 Elvish Reclaimer\n...'}
                  style={{...TAStyle,height:100}}/>
                <div style={{fontSize:9,color:'#2a2a2a',marginTop:3}}>
                  During a game: open Sideboard panel → click a card → library opens → search for the card to replace
                </div>
              </div>

              {/* ERROR */}
              {importErr&&<div style={{gridColumn:'1/-1',padding:'8px 12px',borderRadius:6,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',fontSize:11,color:'#ef4444'}}>{importErr}</div>}

              {/* SUBMIT */}
              <button onClick={doImport} disabled={importing}
                style={{gridColumn:'1/-1',padding:'11px',borderRadius:6,background:importing?'#1a1a1a':'#2563eb',border:'none',color:importing?'#444':'#fff',fontSize:13,cursor:importing?'not-allowed':'pointer',fontWeight:600}}>
                {importing ? 'Importing...' : 'Save & Load Deck'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Label({children}) {
  return <div style={{fontSize:10,color:'#555',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5}}>{children}</div>
}
const IStyle = {width:'100%',padding:'7px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:12,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}
const TAStyle = {width:'100%',padding:'8px 10px',borderRadius:5,background:'#0d0d0d',border:'1px solid #222',color:'#ccc',fontSize:11,outline:'none',fontFamily:'monospace',resize:'vertical',lineHeight:1.5,boxSizing:'border-box'}
