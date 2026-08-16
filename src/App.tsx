import { useState } from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas } from './Canvas';
import { TopBar, ZoomBar } from './TopBar';
import { useKeyboardShortcuts } from './shortcuts';
import { LandingPage } from './LandingPage';

type View = 'landing' | 'editor';

function App() {
  const [view, setView] = useState<View>('landing');

  if (view === 'landing') {
    return <LandingPage onOpenEditor={() => setView('editor')} />;
  }

  return <Editor onBackHome={() => setView('landing')} />;
}

function Editor({ onBackHome }: { onBackHome: () => void }) {
  useKeyboardShortcuts();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <TopBar onBackHome={onBackHome} />
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
      <ZoomBar />
    </div>
  );
}

export default App;
