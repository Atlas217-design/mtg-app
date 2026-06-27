import React from 'react'

const MAIN_PHASES = [
  { idx:0, label:'Untap' },
  { idx:1, label:'Upkeep' },
  { idx:2, label:'Draw' },
  { idx:3, label:'Main 1' },
  { idx:4, label:'Combat', sub:['Attackers','Blockers','Damage','Cleanup'] },
  { idx:5, label:'Main 2' },
  { idx:6, label:'End' },
]

export default function PhaseBar({ phase, combatSubPhase, onPhase, onCombatSub }) {
  return (
    <div style={{ flexShrink:0 }}>
      {/* MAIN PHASES */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:1, padding:'4px 8px', background:'#080808', borderBottom:'1px solid #141414' }}>
        {MAIN_PHASES.map((p, i) => (
          <React.Fragment key={p.idx}>
            <div
              onClick={() => onPhase(p.idx)}
              style={{
                padding:'3px 10px', fontSize:9, borderRadius:3, cursor:'pointer',
                textTransform:'uppercase', letterSpacing:'.05em', transition:'all .1s',
                color: phase === p.idx ? '#fff' : phase > p.idx ? '#333' : '#2a2a2a',
                background: phase === p.idx ? '#2563eb' : 'transparent',
              }}
            >
              {p.label}
            </div>
            {i < MAIN_PHASES.length - 1 && (
              <span style={{ color:'#1a1a1a', fontSize:10 }}>›</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* COMBAT SUB-PHASES */}
      {phase === 4 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:1, padding:'3px 8px', background:'#060608', borderBottom:'1px solid #0f0f18' }}>
          <span style={{ fontSize:8, color:'#2a2050', marginRight:6 }}>Combat:</span>
          {['Attackers','Blockers','Damage','Cleanup'].map((sub, i) => (
            <React.Fragment key={sub}>
              <div
                onClick={() => onCombatSub(sub.toLowerCase())}
                style={{
                  padding:'2px 8px', fontSize:8, borderRadius:3, cursor:'pointer',
                  textTransform:'uppercase', letterSpacing:'.05em',
                  color: combatSubPhase === sub.toLowerCase() ? '#a78bfa' : '#2a2a3a',
                  background: combatSubPhase === sub.toLowerCase() ? '#14102a' : 'transparent',
                  border: combatSubPhase === sub.toLowerCase() ? '1px solid #3a2d6a' : '1px solid transparent',
                }}
              >
                {sub}
              </div>
              {i < 3 && <span style={{ color:'#1a1a1a', fontSize:9 }}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
