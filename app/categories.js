// Topic categories (exact labels from the plan's Global Constraints).
const CATEGORIES = [
  ['Board & Basics', ['creeds', 'board', 'coc', 'nco', 'basics']],
  ['Leadership & Policy', ['leadership', 'regs', 'sharp', 'wear', 'promo', 'benefits']],
  ['Fitness & Training', ['h2f', 'training']],
  ['Soldier Skills', ['tactics', 'acronyms', 'weapons', 'systems', 'comms', 'firstaid', 'landnav', 'drill']],
  ['Unit & History', ['unit', 'wars']],
  ['Situational', ['scenarios']],
  ['Corrections', ['corrections']],
];
const categoryOf = (section) => (CATEGORIES.find(([, keys]) => keys.includes(section)) || [null])[0];
module.exports = { CATEGORIES, categoryOf };
