import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'board', topbar(), el('h2', {}, 'board')); }
