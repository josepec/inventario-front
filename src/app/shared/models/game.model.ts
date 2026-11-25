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
  copies?: GameCopy[];
}

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
