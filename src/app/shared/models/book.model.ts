export type ReadStatus = 'unread' | 'read';

export interface Book {
  id: number;
  // Identificación
  title: string;
  isbn: string | null;
  isbn13: string | null;
  ean: string | null;

  // Autores / producción
  author: string | null;
  translator: string | null;
  illustrator: string | null;

  // Editorial
  publisher: string | null;
  publish_date: string | null;   // ISO date
  edition: string | null;
  original_title: string | null;
  original_language: string | null;

  // Descripción
  synopsis: string | null;
  genre: string | null;
  subgenre: string | null;
  pages: number | null;
  language: string | null;
  saga: string | null;
  saga_number: number | null;
  price: number | null;
  binding: string | null;

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

export type BookCreateDto = Omit<Book, 'id' | 'created_at' | 'updated_at'>;
export type BookUpdateDto = Partial<BookCreateDto>;
