// ── DECK STORAGE ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'mtgapp_decks_v2'

// ── CLEAN CARD NAME ───────────────────────────────────────────────────────────
// Strips Moxfield/MTGO set codes: "Llanowar Elves (M19) 314" → "Llanowar Elves"
export function cleanCardName(raw) {
  return raw
    .replace(/\s*\([A-Z0-9]+\)\s*\d*/g, '')  // strip (SET) 123
    .replace(/\s*\[[^\]]+\]/g, '')            // strip [TAG] markers
    .replace(/\s*\*CMDR\*/gi, '')             // strip *CMDR*
    .replace(/\s*\*F\*/gi, '')                // strip *F* (foil)
    .trim()
}

// ── PARSE DECK TEXT → {cards, commander, sideboard, tokens} ──────────────────
// Handles formats:
//   1 Card Name
//   1x Card Name
//   1 Card Name (SET) 123
//   1 Card Name *CMDR*
//   // Section headers
//   COMMANDER:, SIDEBOARD:, TOKENS:, MAINBOARD:
export function parseDeckFromText(rawText, opts = {}) {
  const {
    commanderOverride = null,  // explicit commander name from input field
    tokenLines        = '',    // separate token input
    sideboardLines    = '',    // separate sideboard input
  } = opts

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

  const main      = []
  const sideboard = []
  const tokens    = []
  let   commander = commanderOverride || null
  let   section   = 'main' // 'main' | 'sideboard' | 'commander' | 'tokens'

  for (const line of lines) {
    // Section headers
    if (/^(\/\/\s*)?(commander|cmdr)\s*:/i.test(line)) { section = 'commander'; continue }
    if (/^(\/\/\s*)?(sideboard|sb)\s*[:\d]/i.test(line)) { section = 'sideboard'; continue }
    if (/^(\/\/\s*)?(tokens?|token list)\s*:/i.test(line)) { section = 'tokens'; continue }
    if (/^(\/\/\s*)?(mainboard|main deck|deck|main)\s*[:\d]/i.test(line)) { section = 'main'; continue }
    if (/^\/\//.test(line)) continue  // comment line

    const m = line.match(/^(\d+)x?\s+(.+)$/)
    if (!m) continue

    const qty  = parseInt(m[1])
    const raw  = m[2].trim()
    const name = cleanCardName(raw)
    const isCmd= /\*CMDR\*/i.test(raw) || /\[CMDR\]/i.test(raw)

    if (!name) continue

    if (isCmd && !commander) commander = name

    if (section === 'commander' && !commander) { commander = name; continue }
    if (section === 'tokens') {
      for (let i = 0; i < qty; i++) tokens.push({ name, id: `tok-${name}-${i}-${Math.random().toString(36).substr(2,4)}` })
      continue
    }
    if (section === 'sideboard') {
      for (let i = 0; i < qty; i++) sideboard.push({ name, id: `sb-${name}-${i}-${Math.random().toString(36).substr(2,4)}` })
      continue
    }

    // Main deck (includes commander in most exports)
    for (let i = 0; i < qty; i++) {
      main.push({ name, id: `dk-${name}-${i}-${Math.random().toString(36).substr(2,4)}` })
    }
  }

  // Parse separate token input
  if (tokenLines.trim()) {
    for (const line of tokenLines.split('\n').map(l=>l.trim()).filter(Boolean)) {
      const m = line.match(/^(\d+)x?\s+(.+)$/)
      if (!m) continue
      const qty = parseInt(m[1])
      const name = cleanCardName(m[2])
      for (let i = 0; i < qty; i++)
        tokens.push({ name, id: `tok-${name}-${i}-${Math.random().toString(36).substr(2,4)}` })
    }
  }

  // Parse separate sideboard input
  if (sideboardLines.trim()) {
    for (const line of sideboardLines.split('\n').map(l=>l.trim()).filter(Boolean)) {
      const m = line.match(/^(\d+)x?\s+(.+)$/)
      if (!m) continue
      const qty = parseInt(m[1])
      const name = cleanCardName(m[2])
      for (let i = 0; i < qty; i++)
        sideboard.push({ name, id: `sb-${name}-${i}-${Math.random().toString(36).substr(2,4)}` })
    }
  }

  return { main, commander, sideboard, tokens }
}

// ── SAVE / LOAD / DELETE ──────────────────────────────────────────────────────
export function saveDeck(deck) {
  const decks = loadAllDecks()
  const id    = deck.id || 'deck-' + Date.now()
  const entry = { ...deck, id, updatedAt: Date.now() }
  const idx   = decks.findIndex(d => d.id === id)
  if (idx > -1) decks[idx] = entry; else decks.push(entry)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks)) } catch(e) {}
  return entry
}

export function loadAllDecks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') || [] } catch { return [] }
}

export function deleteDeck(id) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadAllDecks().filter(d => d.id !== id)))
  } catch(e) {}
}

export function renameDeck(id, name) {
  const decks = loadAllDecks()
  const idx   = decks.findIndex(d => d.id === id)
  if (idx > -1) { decks[idx] = { ...decks[idx], name, updatedAt: Date.now() }; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks)) } catch(e) {} }
}

export function shuffleCards(arr) { return [...arr].sort(() => Math.random() - 0.5) }
