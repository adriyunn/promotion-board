// Progress store: per-question stats, spaced review, favorites and free-text fields.
// Saved to localStorage under one key. Falls back to memory when storage is unavailable.
export const KEY = 'steadfast.v1';
const INTERVAL = { 2: 2, 3: 3 }; // days until next review after reaching box 2 / 3

const empty = () => ({ items: {}, favs: [], fields: {} });

export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dueIds(state, today) {
  return Object.entries(state.items).filter(([, it]) => it.missed && it.due && it.due <= today).map(([id]) => id);
}

export function createStore(storage = globalThis.localStorage) {
  let state = empty();
  let persistent = false;
  try {
    if (storage) {
      const raw = storage.getItem(KEY);
      if (raw) state = { ...empty(), ...JSON.parse(raw) };
      storage.setItem(KEY, JSON.stringify(state));
      persistent = true;
    }
  } catch { persistent = false; }

  const save = () => {
    if (!persistent) return;
    try { storage.setItem(KEY, JSON.stringify(state)); } catch { persistent = false; api.persistent = false; }
  };

  const api = {
    persistent,
    get: () => state,
    record(id, correct, today) {
      const it = state.items[id] || (state.items[id] = { seen: 0, right: 0, wrong: 0, streak: 0, missed: false, last: false, box: 0, due: null });
      it.seen++;
      it.last = correct;
      if (!correct) {
        it.wrong++; it.streak = 0; it.missed = true; it.box = 1; it.due = addDays(today, 1);
      } else {
        it.right++; it.streak++;
        if (it.missed) {
          it.box++;
          if (it.box > 3) { it.missed = false; it.due = null; it.box = 0; }
          else it.due = addDays(today, INTERVAL[it.box]);
        }
      }
      save();
    },
    toggleFav(id) {
      const i = state.favs.indexOf(id);
      if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
      save();
      return i < 0;
    },
    setField(name, value) { state.fields[name] = value; save(); },
    reset() { state = empty(); save(); },
  };
  return api;
}
