import { useState, useEffect } from 'react';
import { store, useEditor } from './store';
import { exportDocument, type ExportFormat } from './exporter';
import {
  Undo2, Redo2, Download, ZoomIn, ZoomOut, Maximize,
  Sparkles, Save, FolderOpen, Trash2,
} from 'lucide-react';

export function TopBar() {
  const editor = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState(false);

  const canUndo = editor.history.length > 0;
  const canRedo = editor.future.length > 0;

  const handleExport = async (format: ExportFormat, scale: number) => {
    setExporting(true);
    try {
      const blob = await exportDocument(editor.document, format, scale);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editor.document.name || 'design'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (e) {
      alert('Export failed: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = () => {
    store.saveProject();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="h-12 bg-[#1a1a20] border-b border-black/40 flex items-center px-3 gap-2 text-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2 pr-3 border-r border-white/10">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">Luma</span>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          disabled={!canUndo}
          onClick={() => store.undo()}
          className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => store.redo()}
          className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Name */}
      <input
        type="text"
        value={editor.document.name}
        onChange={(e) => store.updateDocument((doc) => ({ ...doc, name: e.target.value }), false)}
        onBlur={() => store.updateDocument((doc) => doc, true)}
        className="bg-transparent text-sm font-medium text-gray-200 px-2 py-1 rounded-md hover:bg-white/5 focus:bg-white/10 focus:outline-none w-40 text-center"
      />

      <div className="flex-1" />

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-white/5 transition-colors"
      >
        <Save size={14} />
        {saved ? 'Saved!' : 'Save'}
      </button>

      {/* Projects */}
      <button
        onClick={() => setProjectsOpen(!projectsOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm hover:bg-white/5 transition-colors"
      >
        <FolderOpen size={14} /> Projects
      </button>

      {/* Export */}
      <div className="relative">
        <button
          onClick={() => setExportOpen(!exportOpen)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
        >
          <Download size={14} /> Export
        </button>
        {exportOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#2a2a32] border border-white/10 rounded-lg shadow-xl z-50 p-2">
              <div className="text-[10px] text-gray-500 uppercase mb-1 px-1">Export as</div>
              {exporting && <div className="text-xs text-indigo-400 px-2 py-2">Exporting...</div>}
              {!exporting && (
                <>
                  {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                    <div key={fmt}>
                      <div className="text-[10px] text-gray-500 uppercase mt-2 mb-1 px-1">{fmt.toUpperCase()}</div>
                      <div className="grid grid-cols-3 gap-1">
                        <button onClick={() => handleExport(fmt, 1)} className="px-2 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10">1x</button>
                        <button onClick={() => handleExport(fmt, 2)} className="px-2 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10">2x</button>
                        <button onClick={() => handleExport(fmt, 3)} className="px-2 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10">3x</button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {projectsOpen && <ProjectsModal onClose={() => setProjectsOpen(false)} />}
    </div>
  );
}

export function ZoomBar() {
  const editor = useEditor();
  return (
    <div className="h-9 bg-[#1a1a20] border-t border-black/40 flex items-center justify-center px-4 gap-3 text-gray-400 text-xs">
      <button onClick={() => store.setZoom(editor.zoom - 0.1)} className="p-1 rounded hover:bg-white/5">
        <ZoomOut size={14} />
      </button>
      <span className="w-12 text-center">{Math.round(editor.zoom * 100)}%</span>
      <button onClick={() => store.setZoom(editor.zoom + 0.1)} className="p-1 rounded hover:bg-white/5">
        <ZoomIn size={14} />
      </button>
      <button
        onClick={() => {
          const z = Math.min(
            (window.innerWidth - 560 - 80) / editor.document.canvas.width,
            (window.innerHeight - 140 - 80) / editor.document.canvas.height,
            1
          );
          store.setZoom(Math.max(0.05, Math.min(z, 2)));
          store.setPan(0, 0);
        }}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
      >
        <Maximize size={12} /> Fit
      </button>
      <span className="text-gray-600">|</span>
      <span>{editor.document.canvas.width} × {editor.document.canvas.height}px</span>
    </div>
  );
}

function ProjectsModal({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState(() => store.getProjects());
  const [, forceUpdate] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#26262e] rounded-xl border border-white/10 w-[600px] max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-100 mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No saved projects yet. Your designs auto-save as you work.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="rounded-lg border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-colors">
                <button
                  onClick={() => {
                    store.loadDocument(p.document);
                    onClose();
                  }}
                  className="w-full text-left"
                >
                  <div
                    className="aspect-square flex items-center justify-center text-white text-xs font-semibold p-2"
                    style={{ background: p.document.backgroundGradient || p.document.background }}
                  >
                    {p.document.elements.length === 0 ? 'Empty' : `${p.document.elements.length} elements`}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    store.deleteProject(p.id);
                    setProjects(store.getProjects());
                    forceUpdate((n) => n + 1);
                  }}
                  className="w-full py-1 text-[10px] text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1 border-t border-white/5"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-4 text-sm text-gray-400 hover:text-gray-200">Close</button>
      </div>
    </div>
  );
}
