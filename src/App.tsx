import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Canvas } from './Canvas';
import { TopBar, ZoomBar } from './TopBar';
import { useKeyboardShortcuts } from './shortcuts';

function App() {
  useKeyboardShortcuts();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1a1a20] overflow-hidden">
      <TopBar />
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
