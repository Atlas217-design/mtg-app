// ── DECK STORAGE ─────────────────────────────────────────────────────────────
// Saves/loads decks from localStorage so they persist between sessions.
// Each deck has: { id, name, cards[], commander, tokens[], createdAt }

const STORAGE_KEY = 'mtgapp_decks_v1'

// ── PARSE DECK TEXT → deck object ────────────────────────────────────────────
export function parseDeckFromText(text, deckName = 'My Deck') {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const cards = []
  let commander = null
  let inSideboard = false

  for (const line of lines) {
    if (/^(sideboard|sb:|commander:)/i.test(line)) { inSideboard = true; continue }
    if (inSideboard) continue

    // Support formats:
    //   1 Card Name
    //   1x Card Name
    //   1 Card Name *CMDR*
    //   1 Card Name (SET) 123
    const m = line.match(/^(\d+)x?\s+(.+?)(?:\s+\([A-Z0-9]+\)\s*\d*)?(?:\s+\*CMDR\*)?$/i)
    if (!m) continue

    const qty    = parseInt(m[1])
    let   name   = m[2].trim()
    const isCmd  = line.toUpperCase().includes('*CMDR*') || line.toUpperCase().includes('[COMMANDER]')

    // Strip trailing set/collector codes
    name = name.replace(/\s+\([A-Z0-9]+\)\s*\d*$/i, '').trim()

    for (let i = 0; i < qty; i++) {
      const card = {
        name,
        id: `dk-${name.replace(/\s/g,'-')}-${i}-${Math.random().toString(36).substr(2,4)}`,
      }
      cards.push(card)
    }

    if (isCmd && !commander) commander = name
  }

  // If no *CMDR* marker, commander is null (user picks it)
  return { cards, commander, name: deckName }
}

// ── GET TOKEN NAMES NEEDED FOR DECK ──────────────────────────────────────────
export function getCommanderFromList(cards) {
  // Heuristic: the first legendary creature in common commander positions
  // Returns null — user must declare it explicitly or use *CMDR*
  return null
}

// ── SAVE DECK ─────────────────────────────────────────────────────────────────
export function saveDeck(deck) {
  const decks = loadAllDecks()
  const id    = deck.id || 'deck-' + Date.now()
  const entry = { ...deck, id, updatedAt: Date.now() }
  const idx   = decks.findIndex(d => d.id === id)
  if (idx > -1) decks[idx] = entry
  else decks.push(entry)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
  } catch(e) {
    console.warn('Could not save deck:', e)
  }
  return entry
}

// ── LOAD ALL DECKS ────────────────────────────────────────────────────────────
export function loadAllDecks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) || []
  } catch {
    return []
  }
}

// ── DELETE DECK ───────────────────────────────────────────────────────────────
export function deleteDeck(id) {
  const decks = loadAllDecks().filter(d => d.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
  } catch(e) {}
}

// ── RENAME DECK ───────────────────────────────────────────────────────────────
export function renameDeck(id, name) {
  const decks = loadAllDecks()
  const idx = decks.findIndex(d => d.id === id)
  if (idx > -1) {
    decks[idx] = { ...decks[idx], name, updatedAt: Date.now() }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(decks)) } catch(e) {}
  }
}

// ── SHUFFLE ───────────────────────────────────────────────────────────────────
export function shuffleCards(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}
