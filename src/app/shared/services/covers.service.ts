import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CoverOption {
  url: string;
  source: string;
  bytes: number;
  /** 'isbn' = de este ISBN; 'other' = otra edición encontrada por título. */
  match: 'isbn' | 'other';
  note?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoversService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /** Portadas de todas las fuentes para un ISBN y, con título, de otras ediciones. */
  options(isbn: string | null, title?: string | null, author?: string | null): Observable<CoverOption[]> {
    const params: Record<string, string> = {};
    if (isbn) params['isbn'] = isbn;
    if (title) params['title'] = title;
    if (author) params['author'] = author;
    return this.http.get<{ data: CoverOption[] }>(`${this.base}/google-books/covers`, { params })
      .pipe(map(r => r.data));
  }

  isStored(url: string): boolean {
    return url.startsWith(`${this.base}/covers/`);
  }

  /**
   * Copia una portada externa a R2: las URLs de terceros cambian o desaparecen.
   * Si ya está en R2 se devuelve tal cual.
   */
  persist(url: string): Observable<string> {
    if (!url || this.isStored(url)) return of(url);
    return this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url })
      .pipe(map(r => `${this.base}/covers/${r.key}`));
  }

  /** Sube una imagen propia (foto o escaneo) a R2. */
  uploadFile(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ key: string }>(`${this.base}/covers/upload-file`, form)
      .pipe(map(r => `${this.base}/covers/${r.key}`));
  }
}
