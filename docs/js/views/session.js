import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'session', topbar(), el('h2', {}, 'session')); }
