import { useEffect } from 'react';
import { store } from './store';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput && e.key !== 'Escape') return;

      const meta = e.ctrlKey || e.metaKey;
      const editor = store.getState();
      const selected = editor.selectedIds;

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        store.redo();
        return;
      }
      if (meta && e.key === 'd' && selected.length > 0) {
        e.preventDefault();
        selected.forEach((id) => store.duplicateElement(id));
        return;
      }
      if (meta && e.key === 'a') {
        e.preventDefault();
        const allIds = editor.document.elements.map((el) => el.id);
        store.select(allIds);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected.length > 0) {
          e.preventDefault();
          store.deleteElements(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        store.select([]);
        if (isInput) (target as HTMLElement).blur();
        return;
      }
      // Arrow keys to nudge
      if (selected.length > 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        store.updateElements(selected, () => ({ x: 0, y: 0 }), false);
        // Apply nudge
        selected.forEach((id) => {
          const el = store.getState().document.elements.find((e2) => e2.id === id);
          if (el) store.updateElement(id, { x: el.x + dx, y: el.y + dy }, false);
        });
        // commit history
        if (selected[0]) store.updateElement(selected[0], {}, true);
        return;
      }
      // Layer ordering
      if (meta && e.key === ']') {
        e.preventDefault();
        selected.forEach((id) => store.reorderElement(id, 'forward'));
        return;
      }
      if (meta && e.key === '[') {
        e.preventDefault();
        selected.forEach((id) => store.reorderElement(id, 'backward'));
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
