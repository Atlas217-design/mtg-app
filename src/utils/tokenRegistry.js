// ── TOKEN REGISTRY ─────────────────────────────────────────────────────────
// Maps card names to the tokens they produce.
// Each entry: { name, pt, type, color, art, scryfall, qty, notes }
// scryfall: the Scryfall card name to use for the token image

export const CARD_TOKENS = {
  // ── YOUR LANDFALL DECK ────────────────────────────────────────────────────

  'Scute Swarm': [
    { name:'Insect',      pt:'1/1', type:'Creature — Insect',    color:'Green', art:'🐛', scryfall:'Insect Token',      notes:'<6 lands: 1/1 Insect. ≥6 lands: copy of Scute Swarm' },
    { name:'Scute Swarm', pt:'1/1', type:'Creature — Insect',    color:'Green', art:'🐛', scryfall:'Scute Swarm',        notes:'Created instead of Insect when you control ≥6 lands' },
  ],

  'Tireless Provisioner': [
    { name:'Food',     pt:'—', type:'Artifact — Food',     color:'',      art:'🍎', scryfall:'Food Token',     notes:'Landfall — choose Food or Treasure' },
    { name:'Treasure', pt:'—', type:'Artifact — Treasure', color:'',      art:'💎', scryfall:'Treasure Token', notes:'Landfall — choose Food or Treasure' },
  ],

  'Springheart Nantuko': [
    { name:'Insect', pt:'1/1', type:'Creature — Insect', color:'Green', art:'🐛', scryfall:'Insect Token', notes:'Landfall — pay 1G to create a copy of enchanted creature, or 1/1 Insect' },
  ],

  'Famished Worldsire': [
    { name:'Famished Worldsire', pt:'6/6', type:'Creature — Elemental Ox', color:'Green', art:'🐂', scryfall:'Famished Worldsire', notes:'Creates a copy when it enters attacking' },
  ],

  'Loot, Exuberant Explorer': [
    { name:'Treasure', pt:'—', type:'Artifact — Treasure', color:'', art:'💎', scryfall:'Treasure Token', notes:'Creates Treasure tokens' },
    { name:'Map',      pt:'—', type:'Artifact',            color:'', art:'🗺️', scryfall:'Map Token',      notes:'Creates Map tokens on landfall' },
  ],

  'Lotus Cobra': [
    // No tokens, produces mana. Included for awareness.
  ],

  'Impact Tremors': [
    // No tokens. Deals damage when creatures enter.
  ],

  // ── SIDEBOARD (included in case they're added) ──────────────────────────

  'Rampaging Baloths': [
    { name:'Beast', pt:'4/4', type:'Creature — Beast', color:'Green', art:'🦬', scryfall:'Beast Token', notes:'Landfall — create a 4/4 green Beast token' },
  ],

  'Awaken the Woods': [
    { name:'Forest Dryad', pt:'1/1', type:'Land Creature — Forest Dryad', color:'Green', art:'🌲', scryfall:'Forest Dryad Token', notes:'Creates X 1/1 green Forest Dryad land creature tokens' },
  ],

  'Titania, Protector of Argoth': [
    { name:'Elemental', pt:'5/3', type:'Creature — Elemental', color:'Green', art:'🌿', scryfall:'Elemental Token', notes:'When a land is put into your GY, create a 5/3 green Elemental' },
  ],

  'Selvala, Heart of the Wilds': [
    // No tokens
  ],

  // ── UNIVERSAL TOKENS (always available regardless of deck) ──────────────
}

// Tokens always available in any game
export const UNIVERSAL_TOKENS = [
  { name:'Treasure',     pt:'—',   type:'Artifact — Treasure',        color:'',      art:'💎', scryfall:'Treasure Token',     notes:'Sacrifice: Add one mana of any color' },
  { name:'Food',         pt:'—',   type:'Artifact — Food',            color:'',      art:'🍎', scryfall:'Food Token',          notes:'2, T, Sacrifice: Gain 3 life' },
  { name:'Clue',         pt:'—',   type:'Artifact — Clue',            color:'',      art:'🔍', scryfall:'Clue Token',          notes:'2, Sacrifice: Draw a card' },
  { name:'Map',          pt:'—',   type:'Artifact — Map',             color:'',      art:'🗺️', scryfall:'Map Token',            notes:'1, T, Sacrifice: Search for a basic land' },
  { name:'Copy',         pt:'',    type:'Token Copy',                 color:'',      art:'⎘',  scryfall:'',                    notes:'Copy of target permanent' },
]

// ── BUILD DECK TOKEN LIST ────────────────────────────────────────────────────
// Given a list of card names, return unique tokens needed
export function getTokensForDeck(cardNames) {
  const seen = new Set()
  const tokens = []

  for (const name of cardNames) {
    const cardTokens = CARD_TOKENS[name]
    if (!cardTokens) continue
    for (const tok of cardTokens) {
      const key = tok.name + '|' + tok.pt
      if (!seen.has(key)) {
        seen.add(key)
        tokens.push({ ...tok, sourceCard: name })
      }
    }
  }

  return tokens
}

// ── TOKEN IMAGE URL ──────────────────────────────────────────────────────────
export function tokenImg(token) {
  if (!token.scryfall) return null
  // Use Scryfall token search
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(token.scryfall)}&format=image&version=normal`
}
