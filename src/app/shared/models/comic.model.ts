export type ComicFormat = 'grapa' | 'tomo' | 'integral' | 'omnibus' | 'manga' | 'novela_grafica' | 'otro';
export type ReadStatus = 'unread' | 'reading' | 'read';

export interface Comic {
  id: number;
  // Identificación
  title: string;
  series: string;
  number: number | null;
  volume: number | null;
  isbn: string | null;
  ean: string | null;

  // Autores
  writer: string | null;
  artist: string | null;
  colorist: string | null;
  cover_artist: string | null;

  // Editorial
  publisher: string | null;
  collection: string | null;
  publish_date: string | null;   // ISO date
  original_publisher: string | null;
  original_title: string | null;

  // Descripción
  synopsis: string | null;
  genre: string | null;
  format: ComicFormat | null;
  pages: number | null;
  language: string | null;

  // Colección
  collection_id: number | null;
  collection_name?: string | null;

  // Portada
  cover_url: string | null;

  // Estado personal
  read_status: ReadStatus;
  owned: boolean;
  rating: number | null;         // 1-5
  notes: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export type ComicCreateDto = Omit<Comic, 'id' | 'created_at' | 'updated_at'>;
export type ComicUpdateDto = Partial<ComicCreateDto>;
