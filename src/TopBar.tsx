import { useState } from 'react';
import { store, useEditor } from './store';
import { exportDocument, type ExportFormat } from './exporter';
import { useTheme, themeStore } from './theme';
import {
  Undo2, Redo2, Download, ZoomIn, ZoomOut, Maximize,
  Sparkles, Save, FolderOpen, Trash2, Sun, Moon, Home,
} from 'lucide-react';

export function TopBar({ onBackHome }: { onBackHome: () => void }) {
  const editor = useEditor();
  const theme = useTheme();
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
      a.download = `${editor.document.name || 'design'}.${format === 'jpeg' ? 'jpg' : format}`;
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
    <div className="h-12 flex items-center px-3 gap-2 border-b" style={{ background: 'var(--bg-app)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      {/* Logo + Home */}
      <button onClick={onBackHome} className="flex items-center gap-2 pr-3 border-r transition-colors hover:opacity-80" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">Luma</span>
      </button>

      {/* Home button */}
      <button onClick={onBackHome} className="p-1.5 rounded-md transition-colors hover:opacity-80" title="Home" style={{ color: 'var(--text-secondary)' }}>
        <Home size={16} />
      </button>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          disabled={!canUndo}
          onClick={() => store.undo()}
          className="p-1.5 rounded-md transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => canUndo && (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => store.redo()}
          className="p-1.5 rounded-md transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => canRedo && (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
        className="bg-transparent text-sm font-medium px-2 py-1 rounded-md w-40 text-center focus:outline-none"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onFocus={(e) => (e.currentTarget.style.background = 'var(--bg-input-focus)')}
      />

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={() => themeStore.toggle()}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Save size={14} />
        {saved ? 'Saved!' : 'Save'}
      </button>

      {/* Projects */}
      <button
        onClick={() => setProjectsOpen(!projectsOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <FolderOpen size={14} /> Projects
      </button>

      {/* Export */}
      <div className="relative">
        <button
          onClick={() => setExportOpen(!exportOpen)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm text-white font-medium transition-all hover:scale-105"
          style={{ background: 'var(--accent)' }}
        >
          <Download size={14} /> Export
        </button>
        {exportOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-xl z-50 p-2 border" style={{ background: 'var(--bg-panel-2)', borderColor: 'var(--border)' }}>
              <div className="text-[10px] uppercase mb-1 px-1" style={{ color: 'var(--text-muted)' }}>Export as</div>
              {exporting && <div className="text-xs px-2 py-2" style={{ color: 'var(--accent)' }}>Exporting...</div>}
              {!exporting && (
                <>
                  {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
                    <div key={fmt}>
                      <div className="text-[10px] uppercase mt-2 mb-1 px-1" style={{ color: 'var(--text-muted)' }}>{fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}</div>
                      <div className="grid grid-cols-3 gap-1">
                        <button onClick={() => handleExport(fmt, 1)} className="px-2 py-1.5 rounded-md text-xs transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}>1x</button>
                        <button onClick={() => handleExport(fmt, 2)} className="px-2 py-1.5 rounded-md text-xs transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}>2x</button>
                        <button onClick={() => handleExport(fmt, 3)} className="px-2 py-1.5 rounded-md text-xs transition-colors" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-input)')}>3x</button>
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
    <div className="h-9 flex items-center justify-center px-4 gap-3 text-xs border-t" style={{ background: 'var(--bg-app)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
      <button onClick={() => store.setZoom(editor.zoom - 0.1)} className="p-1 rounded transition-colors hover:opacity-80" style={{ background: 'var(--bg-hover)' }}>
        <ZoomOut size={14} />
      </button>
      <span className="w-12 text-center">{Math.round(editor.zoom * 100)}%</span>
      <button onClick={() => store.setZoom(editor.zoom + 0.1)} className="p-1 rounded transition-colors hover:opacity-80" style={{ background: 'var(--bg-hover)' }}>
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
        className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:opacity-80" style={{ background: 'var(--bg-hover)' }}
      >
        <Maximize size={12} /> Fit
      </button>
      <span style={{ color: 'var(--text-dim)' }}>|</span>
      <span>{editor.document.canvas.width} × {editor.document.canvas.height}px</span>
    </div>
  );
}

function ProjectsModal({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState(() => store.getProjects());
  const [, forceUpdate] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'var(--overlay)' }} onClick={onClose}>
      <div className="rounded-xl border w-[600px] max-h-[80vh] overflow-y-auto p-6" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No saved projects yet. Your designs auto-save as you work.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="rounded-lg border overflow-hidden transition-colors" style={{ borderColor: 'var(--border)' }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <button
                  onClick={() => {
                    store.loadDocument(p.document);
                    onClose();
                  }}
                  className="w-full text-left"
                >
                  <div
                    className="aspect-square flex items-center justify-center text-xs font-semibold p-2"
                    style={{ background: p.document.backgroundGradient || p.document.background, color: 'var(--text-primary)' }}
                  >
                    {p.document.elements.length === 0 ? 'Empty' : `${p.document.elements.length} elements`}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(p.updatedAt).toLocaleDateString()}</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    store.deleteProject(p.id);
                    setProjects(store.getProjects());
                    forceUpdate((n) => n + 1);
                  }}
                  className="w-full py-1 text-[10px] flex items-center justify-center gap-1 border-t transition-colors"
                  style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="mt-4 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text-secondary)' }}>Close</button>
      </div>
    </div>
  );
}
