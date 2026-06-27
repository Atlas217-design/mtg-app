import React, { useState } from 'react'
import LandingPage from './components/LandingPage.jsx'
import LobbyPage from './components/LobbyPage.jsx'
import GameBoard from './components/GameBoard.jsx'

export default function App() {
  const [page, setPage] = useState('landing')
  const [gameConfig, setGameConfig] = useState({
    variant: 'Commander',
    planechase: false,
    startingLife: 40,
    players: [
      { id: 'you',    name: 'You',    color: '#60a5fa', life: 40 },
      { id: 'alex',   name: 'Alex',   color: '#5a7aaa', life: 40 },
      { id: 'sam',    name: 'Sam',    color: '#ef4444', life: 40 },
      { id: 'jordan', name: 'Jordan', color: '#a78bfa', life: 40 },
    ]
  })

  if (page === 'lobby')   return <LobbyPage   config={gameConfig} setConfig={setGameConfig} onStart={() => setPage('game')} onBack={() => setPage('landing')} />
  if (page === 'game')    return <GameBoard    config={gameConfig} onBack={() => setPage('lobby')} />
  return <LandingPage onPlay={() => setPage('lobby')} />
}
