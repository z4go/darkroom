// Presets bundled with the site, from /presets/*.json. They show up in every browser without importing.
// To add a set: drop a darkroom-presets JSON file in /presets and list it here.
import { normalizePreset, type Preset } from '../ptp/preset';
import anime from '../../presets/anime.json';
import japan from '../../presets/japan.json';

const SETS: { id: string; name: string; file: { presets: unknown[] } }[] = [
  { id: 'japan', name: 'Japan, November', file: japan },
  { id: 'anime', name: 'Anime', file: anime },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const BUILTIN_PRESETS: Preset[] = SETS.flatMap((set) =>
  set.file.presets.flatMap((x) => {
    const p = normalizePreset(x);
    if (!p) return [];
    return [{ ...p, id: `builtin-${set.id}-${slug(p.name)}`, builtin: true, setName: set.name, updatedAt: '' }];
  }),
);
