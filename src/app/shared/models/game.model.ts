export type GamePlatform = 'PS1' | 'PS2' | 'PS3' | 'PS4' | 'PS5' | 'PSP';
export type GameFormat = 'physical' | 'digital';
export type GameStatus = 'pending' | 'playing' | 'completed' | 'abandoned';

export const GAME_PLATFORMS: GamePlatform[] = ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'PSP'];

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  pending: 'Sin empezar',
  playing: 'Jugando',
  completed: 'Pasado',
  abandoned: 'Abandonado',
};

/** Colores del estado (texto / fondo / borde), en la paleta de la app. */
export const GAME_STATUS_STYLE: Record<GameStatus, string> = {
  pending: 'text-[#a0a0a0] bg-[#1f1f1f] border-[#2a2a2a]',
  playing: 'text-[#38bdf8] bg-[#0c4a6e55] border-[#0c4a6e]',
  completed: 'text-[#22c55e] bg-[#22c55e1a] border-[#22c55e33]',
  abandoned: 'text-[#ef4444] bg-[#ef444411] border-[#ef444433]',
};

export const GAME_FORMAT_LABEL: Record<GameFormat, string> = { physical: 'Físico', digital: 'Digital' };

export interface GameCopy {
  id: number;
  game_id: number;
  platform: GamePlatform;
  format: GameFormat;
  edition: string | null;
  ean: string | null;
  psn_title_id: string | null;
  psn_product_id: string | null;
  price: number | null;
  store: string | null;
  acquired_at: string | null;
  /** 1 si la fecha de compra es una estimación (el primer trofeo de esa plataforma). */
  acquired_estimated?: number;
  is_free: boolean;
  source: 'manual' | 'scanner' | 'psn';
  notes: string | null;
}

export type GameCopyDraft = Omit<GameCopy, 'id' | 'game_id' | 'psn_title_id' | 'psn_product_id'> & {
  psn_title_id?: string | null;
  psn_product_id?: string | null;
};

export interface Game {
  id: number;
  igdb_id: number | null;
  title: string;
  cover_url: string | null;
  summary: string | null;
  genres: string | null;
  developer: string | null;
  publisher: string | null;
  franchise: string | null;
  first_release_date: string | null;
  igdb_url: string | null;
  status: GameStatus;
  completed_at: string | null;
  completed_source: 'manual' | 'platinum' | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Derivados de las copias. */
  platforms: GamePlatform[];
  formats: GameFormat[];
  copies_count: number;
  /** De sus listas de trofeos de PSN. */
  has_platinum: boolean;
  trophy_progress: number | null;
  copies?: GameCopy[];
  trophy_lists?: TrophyList[];
  dlcs?: GameDlc[];
}

/** DLC comprado en la PSN Store (game_dlcs). */
export interface GameDlc {
  id: number;
  name: string;
  platform: 'PS3' | 'PS4' | 'PS5' | null;
  acquired_at: string | null;
  icon_url: string | null;
}

// ── Compras de PSN (GET /games/psn/library) ──

export type PsnPlatform = 'PS3' | 'PS4' | 'PS5';
export type PsnKind = 'game' | 'app' | 'demo' | 'extra';

export interface PsnCopy {
  platform: PsnPlatform;
  title_id: string;
  product_id: string;
  acquired_at: string | null;
  is_free: boolean;
  icon_url: string | null;
  name: string;
}

export interface PsnCandidate {
  key: string;
  title: string;
  kind: PsnKind;
  copies: PsnCopy[];
  dlc_count: number;
  /** Todas sus copias ya están en la colección. */
  imported: boolean;
  /** El juego de la colección al que se sumarían las copias. */
  game_id: number | null;
  game_title: string | null;
}

export interface PsnDlc {
  entitlement_id: string;
  title_id: string;
  name: string;
  platform: PsnPlatform | null;
  acquired_at: string | null;
  icon_url: string | null;
}

export interface PsnImportResult {
  game_id: number;
  title: string;
  created: boolean;
  copies_added: number;
  igdb: boolean;
}

/** Una lista de trofeos de PSN (game_trophy_lists). */
export interface TrophyList {
  id: number;
  np_communication_id: string;
  title: string;
  icon_url: string | null;
  /** "PS5", "PS4,PS5", "PS3" */
  platforms: string;
  progress: number;
  earned_platinum: number; earned_gold: number; earned_silver: number; earned_bronze: number;
  defined_platinum: number; defined_gold: number; defined_silver: number; defined_bronze: number;
  platinum_at: string | null;
  last_played_at: string | null;
  game_id: number | null;
  link_state: 'auto' | 'manual' | 'ignored' | null;
  game_title?: string | null;
}

export interface TrophyStatus {
  synced_at: string | null;
  connected: boolean;
  total: number;
  linked: number;
  pending: number;
  ignored: number;
  platinums: number;
}

export const TROPHY_COLORS = { platinum: '#a5b4fc', gold: '#f59e0b', silver: '#a0a0a0', bronze: '#c2773b' } as const;

export interface IgdbSearchResult {
  igdb_id: number;
  title: string;
  year: number | null;
  cover_url: string | null;
  platforms: GamePlatform[];
  kind: string | null;
  /** Id en la colección si ya lo tengo. */
  local_id: number | null;
}

export interface IgdbGameDetail {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  summary: string | null;
  genres: string | null;
  developer: string | null;
  publisher: string | null;
  franchise: string | null;
  first_release_date: string | null;
  igdb_url: string | null;
  platforms: GamePlatform[];
  release_dates: Partial<Record<GamePlatform, string>>;
}

export function emptyCopy(platform: GamePlatform = 'PS5'): GameCopyDraft {
  return {
    platform, format: 'physical', edition: null, ean: null, price: null, store: null,
    acquired_at: null, is_free: false, source: 'manual', notes: null,
  };
}

/** GET /games/barcode/:ean */
export interface BarcodeLookup {
  ean: string;
  /** Ya hay una copia con ese código. */
  owned: { id: number; title: string } | null;
  /** El producto según la tienda (Amazon.es o UPCitemdb). */
  product: { raw: string; name: string; title: string; platform: GamePlatform | null; source: string } | null;
  data: IgdbSearchResult[];
  /** El igdb_id que el servidor da por bueno (si está claro). */
  best?: number | null;
  error?: string;
}

/**
 * Clave para comparar títulos (como titleKey del back): sin mayúsculas, tildes,
 * marcas ni puntuación; NFKD pasa "Ⅱ" a "II".
 */
export function titleKey(t: string): string {
  return t.replace(/[™®©]/g, '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

/**
 * El juego de IGDB que corresponde al producto escaneado, si está claro: el
 * mismo título (mejor si sale en la plataforma del producto) o el único
 * resultado. Si hay dudas, null y se elige de la lista.
 */
export function bestBarcodeMatch(lookup: BarcodeLookup): IgdbSearchResult | null {
  const results = lookup.data ?? [];
  if (!results.length) return null;
  const chosen = lookup.best ? results.find(r => r.igdb_id === lookup.best) : undefined;
  if (chosen) return chosen;
  const p = lookup.product;
  if (p) {
    const want = new Set([titleKey(p.title), titleKey(p.name)].filter(Boolean));
    const same = results.filter(r => want.has(titleKey(r.title)));
    if (same.length) return same.find(r => p.platform && r.platforms.includes(p.platform)) ?? same[0];
  }
  return results.length === 1 ? results[0] : null;
}

const fold = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * La edición es lo que le sobra al nombre del producto respecto al título del
 * juego: "God of War Ragnarök Edición Lanzamiento" − "God of War Ragnarök".
 * Si el producto no empieza por el título (otro idioma, otra forma de
 * escribirlo), no se adivina.
 */
export function editionFromProduct(productName: string, gameTitle: string): string | null {
  const want = gameTitle.split(/\s+/).map(fold).filter(Boolean);
  const words = productName.split(/\s+/);
  let i = 0, matched = 0;
  for (; i < words.length && matched < want.length; i++) {
    const w = fold(words[i]);
    if (!w) continue;
    if (w !== want[matched]) return null;
    matched++;
  }
  if (matched < want.length) return null;
  const rest = words.slice(i).join(' ').replace(/^[\s:\-–,.]+|[\s:\-–,.]+$/g, '').trim();
  if (!rest || /^(edici[oó]n\s+)?(est[aá]ndar|standard)(\s+edition)?$/i.test(rest)) return null;
  return rest;
}
