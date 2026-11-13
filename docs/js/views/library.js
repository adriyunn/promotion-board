import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'library', topbar(), el('h2', {}, 'library')); }
