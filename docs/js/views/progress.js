import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'progress', topbar(), el('h2', {}, 'progress')); }
