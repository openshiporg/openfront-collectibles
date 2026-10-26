// Full printed checklists, one file per set, generated from the Pokémon TCG API data
// (github.com/PokemonTCG/pokemon-tcg-data) joined with TCGplayer prices observed on
// pricesObservedOn (via tcgcsv.com). Server-only: imported by the catalog import mutation.

import set_base1 from './base1.json';
import set_base2 from './base2.json';
import set_base3 from './base3.json';
import set_me1 from './me1.json';
import set_me2 from './me2.json';
import set_me2pt5 from './me2pt5.json';
import set_me3 from './me3.json';
import set_me4 from './me4.json';
import set_me5 from './me5.json';
import set_me55 from './me55.json';
import set_neo1 from './neo1.json';
import set_sv10 from './sv10.json';
import set_sv3pt5 from './sv3pt5.json';
import set_sv4pt5 from './sv4pt5.json';
import set_sv8 from './sv8.json';
import set_sv8pt5 from './sv8pt5.json';
import set_swsh12pt5 from './swsh12pt5.json';
import set_swsh12pt5gg from './swsh12pt5gg.json';
import set_swsh7 from './swsh7.json';

export type ChecklistCard = {
  n: string; num: string; name: string; r: string; st: string; sub: string[]; t: string[];
  hp: string; a: string; img: string;
  /** finish -> [tcgplayerProductId, low, mid, high, market] in cents */
  tp: Record<string, [number, number | null, number | null, number | null, number | null]>;
};
export type Checklist = {
  id: string; name: string; series: string; code: string; printedTotal: number; total: number;
  releaseDate: string; logo: string; symbol: string; tcgplayerGroupId: number; pricesObservedOn: string;
  cards: ChecklistCard[];
};

export const CHECKLISTS: Record<string, Checklist> = {
  'base1': set_base1 as unknown as Checklist,
  'base2': set_base2 as unknown as Checklist,
  'base3': set_base3 as unknown as Checklist,
  'me1': set_me1 as unknown as Checklist,
  'me2': set_me2 as unknown as Checklist,
  'me2pt5': set_me2pt5 as unknown as Checklist,
  'me3': set_me3 as unknown as Checklist,
  'me4': set_me4 as unknown as Checklist,
  'me5': set_me5 as unknown as Checklist,
  'me55': set_me55 as unknown as Checklist,
  'neo1': set_neo1 as unknown as Checklist,
  'sv10': set_sv10 as unknown as Checklist,
  'sv3pt5': set_sv3pt5 as unknown as Checklist,
  'sv4pt5': set_sv4pt5 as unknown as Checklist,
  'sv8': set_sv8 as unknown as Checklist,
  'sv8pt5': set_sv8pt5 as unknown as Checklist,
  'swsh12pt5': set_swsh12pt5 as unknown as Checklist,
  'swsh12pt5gg': set_swsh12pt5gg as unknown as Checklist,
  'swsh7': set_swsh7 as unknown as Checklist,
};
