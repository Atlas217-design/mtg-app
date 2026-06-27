import React, { useState } from 'react'
import LandingPage from './components/LandingPage.jsx'
import LobbyPage   from './components/LobbyPage.jsx'
import SoloBoard   from './components/SoloBoard.jsx'

export default function App() {
  const [page,   setPage]   = useState('landing')
  const [config, setConfig] = useState({
    variant: 'Commander', planechase: false, startingLife: 40,
  })

  if (page === 'lobby') return (
    <LobbyPage
      config={config}
      setConfig={setConfig}
      onStart={() => setPage('game')}
      onBack={() => setPage('landing')}
    />
  )
  if (page === 'game') return (
    <SoloBoard onBack={() => setPage('lobby')} config={config} />
  )
  return <LandingPage onPlay={() => setPage('lobby')} />
}
