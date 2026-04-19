import { useState } from 'react';
import { Game, type GameSettings } from './Game';
import { Settings } from './Settings';

export function App() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  if (!settings) return <Settings onStart={setSettings} />;
  return <Game settings={settings} onExit={() => setSettings(null)} />;
}
