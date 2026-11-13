import { el, view, topbar } from '../ui.js';
export function render(root, ctx) { view(root, 'results', topbar(), el('h2', {}, 'results')); }
