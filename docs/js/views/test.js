import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'test', topbar(), el('h2', {}, 'test')); }
