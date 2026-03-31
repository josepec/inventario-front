import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService, PaginatedResponse } from '../../../shared/services/api.service';
import { Comic } from '../../../shared/models/comic.model';
import { environment } from '../../../../environments/environment';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface CollectionItem {
  id: number;
  title: string;
  publisher: string | null;
  cover_url: string | null;
  total_issues: number | null;
  whakoom_id: string | null;
}

interface WkResult {
  id: string;
  title: string;
  cover: string | null;
  publisher: string;
  type: string;
}

interface WkComic {
  id: string;
  title: string;
  cover: string;
  description: string;
  authors: string[];
  publisher: string;
  date: string;
  series: string;
  number: string;
  isbn: string;
  language: string;
  url: string;
  pages?: number | null;
  binding?: string | null;
  price?: number | null;
}

@Component({
  selector: 'app-comics-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex items-start justify-between mb-5 md:mb-8 gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Cómics</h1>
          <p class="text-[#606060] mt-0.5 text-sm">{{ total() }} {{ tab() === 'comics' ? 'títulos' : 'colecciones' }}</p>
        </div>
        <button (click)="openModal()"
          class="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                 font-semibold text-sm rounded-xl px-4 py-2.5 md:px-5 transition-colors duration-200 shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span class="hidden sm:inline">Añadir cómic</span>
          <span class="sm:hidden">Añadir</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-3 mb-5 md:mb-8">

        <!-- Row 1: tabs + view toggle -->
        <div class="flex items-center gap-3">
          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            <button (click)="switchTab('comics')"
              class="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'comics' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Cómics
            </button>
            <button (click)="switchTab('collections')"
              class="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
              [class]="tab() === 'collections' ? 'bg-[#7c3aed] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
              Colecciones
            </button>
          </div>

          <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1 ml-auto">
            <button (click)="viewMode.set('grid')" [class.bg-[#2a2a2a]]="viewMode() === 'grid'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button (click)="viewMode.set('list')" [class.bg-[#2a2a2a]]="viewMode() === 'list'"
              class="p-2 rounded-lg transition-colors hover:bg-[#222]">
              <svg class="w-4 h-4 text-[#a0a0a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Row 2: search + status filter -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative flex-1 min-w-0">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#404040]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input [(ngModel)]="search" (ngModelChange)="onSearch()"
              type="text" [placeholder]="tab() === 'comics' ? 'Buscar por título, serie...' : 'Buscar colección...'"
              class="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm
                     text-white placeholder:text-[#404040] focus:outline-none focus:border-[#7c3aed] transition-colors" />
          </div>

          @if (tab() === 'comics') {
            <div class="flex items-center bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-0.5 shrink-0">
              <button (click)="filterStatus = ''; load()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                [class]="filterStatus === '' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Todos
              </button>
              <button (click)="filterStatus = 'unread'; load()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                [class]="filterStatus === 'unread' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Sin leer
              </button>
              <button (click)="filterStatus = 'read'; load()"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                [class]="filterStatus === 'read' ? 'bg-[#2a2a2a] text-white' : 'text-[#606060] hover:text-[#a0a0a0]'">
                Leído
              </button>
            </div>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <div class="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

      <!-- ═══ COMICS TAB ═══ -->
      @if (!loading() && tab() === 'comics') {
        @if (viewMode() === 'grid') {
          @if (comics().length === 0) {
            <div class="text-center py-24">
              <div class="w-16 h-16 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-[#404040]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p class="text-[#606060] text-sm">No hay cómics todavía.</p>
              <button (click)="openModal()" class="inline-block mt-4 text-sm text-[#8b5cf6] hover:underline">Añade el primero</button>
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
              @for (comic of comics(); track comic.id) {
                <a [routerLink]="['/app/comics', comic.id]" class="group cursor-pointer">
                  <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                    @if (comic.cover_url) {
                      <img [src]="comic.cover_url" [alt]="comic.title"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        <p class="text-[10px] text-[#404040] leading-tight">{{ comic.title }}</p>
                      </div>
                    }
                    <div class="absolute top-2 right-2">
                      @if (comic.read_status === 'read') {
                        <span class="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center">
                          <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      }
                    </div>
                    @if (comic.number) {
                      <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                   px-2 py-1 rounded-lg leading-none backdrop-blur-sm">#{{ comic.number }}</span>
                    }
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                  </div>
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ comic.title }}</p>
                  @if (comic.series) {
                    <p class="text-[10px] text-[#606060] truncate">{{ comic.series }}</p>
                  }
                </a>
              }
            </div>
          }
        }

        @if (viewMode() === 'list') {
          <div class="space-y-2">
            @for (comic of comics(); track comic.id) {
              <a [routerLink]="['/app/comics', comic.id]"
                class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                       rounded-xl px-3 md:px-4 py-3 transition-colors duration-150">
                <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                  @if (comic.cover_url) {
                    <img [src]="comic.cover_url" [alt]="comic.title" class="w-full h-full object-cover" />
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ comic.title }}</p>
                  @if (comic.series) { <p class="text-xs text-[#606060] truncate">{{ comic.series }}</p> }
                </div>
                <div class="hidden sm:block shrink-0 text-xs text-[#606060]">{{ comic.publisher }}</div>
                <div class="shrink-0">
                  <span class="text-xs px-2 py-1 rounded-lg" [class]="statusClass(comic.read_status)">
                    {{ statusLabel(comic.read_status) }}
                  </span>
                </div>
              </a>
            }
          </div>
        }
      }

      <!-- ═══ COLLECTIONS TAB ═══ -->
      @if (!loading() && tab() === 'collections') {
        @if (viewMode() === 'grid') {
          @if (collections().length === 0) {
            <div class="text-center py-24">
              <p class="text-[#606060] text-sm">No hay colecciones todavía.</p>
              <p class="text-[#404040] text-xs mt-2">Se crean automáticamente al añadir cómics desde Whakoom</p>
            </div>
          } @else {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
              @for (col of collections(); track col.id) {
                <a [routerLink]="['/app/collections', col.id]" class="group cursor-pointer">
                  <div class="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#161616] mb-1.5">
                    @if (col.cover_url) {
                      <img [src]="col.cover_url" [alt]="col.title"
                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    } @else {
                      <div class="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                        <svg class="w-8 h-8 text-[#2a2a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-1.244 1.007-2.25 2.25-2.25h13.5" />
                        </svg>
                        <p class="text-[10px] text-[#404040] leading-tight">{{ col.title }}</p>
                      </div>
                    }
                    @if (col.total_issues) {
                      <span class="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-bold
                                   px-2 py-1 rounded-lg leading-none backdrop-blur-sm">{{ col.total_issues }}</span>
                    }
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 rounded-xl"></div>
                  </div>
                  <p class="text-xs font-medium text-[#e0e0e0] truncate leading-tight">{{ col.title }}</p>
                  @if (col.publisher) { <p class="text-[10px] text-[#606060] truncate">{{ col.publisher }}</p> }
                </a>
              }
            </div>
          }
        }

        @if (viewMode() === 'list') {
          <div class="space-y-2">
            @for (col of collections(); track col.id) {
              <a [routerLink]="['/app/collections', col.id]"
                class="flex items-center gap-3 md:gap-4 bg-[#161616] hover:bg-[#1a1a1a] border border-[#1e1e1e]
                       rounded-xl px-3 md:px-4 py-3 transition-colors duration-150">
                <div class="w-9 h-12 md:w-10 md:h-14 rounded-lg overflow-hidden bg-[#222] shrink-0">
                  @if (col.cover_url) { <img [src]="col.cover_url" [alt]="col.title" class="w-full h-full object-cover" /> }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ col.title }}</p>
                  @if (col.publisher) { <p class="text-xs text-[#606060] truncate">{{ col.publisher }}</p> }
                </div>
                @if (col.total_issues) {
                  <div class="shrink-0 text-xs text-[#606060]">{{ col.total_issues }} cómics</div>
                }
              </a>
            }
          </div>
        }
      }

      @if (totalPages() > 1) {
        <div class="flex justify-center items-center gap-2 mt-8 md:mt-10">
          <button (click)="goTo(page() - 1)" [disabled]="page() === 1"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">← Anterior</button>
          <span class="text-sm text-[#606060]">{{ page() }} / {{ totalPages() }}</span>
          <button (click)="goTo(page() + 1)" [disabled]="page() === totalPages()"
            class="px-3 py-2 rounded-lg bg-[#161616] border border-[#2a2a2a] text-sm text-[#a0a0a0]
                   disabled:opacity-30 hover:bg-[#1f1f1f] transition-colors">Siguiente →</button>
        </div>
      }
    </div>

    <!-- ── Modal añadir cómic ─────────────────────────────────────────────── -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        (click)="closeModal()">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="relative bg-[#111111] border border-[#2a2a2a]
                    rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl
                    max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl"
          (click)="$event.stopPropagation()">

          <!-- Cabecera -->
          <div class="flex items-center gap-3 p-4 md:p-5 border-b border-[#1e1e1e] shrink-0">
            <svg class="w-5 h-5 text-[#7c3aed] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h2 class="text-white font-semibold text-sm md:text-base">Buscar en Whakoom</h2>
            <a routerLink="/app/comics/new" (click)="closeModal()"
              class="ml-auto text-xs text-[#606060] hover:text-[#a0a0a0] transition-colors whitespace-nowrap">
              Entrada manual
            </a>
            <button type="button" (click)="closeModal()" class="p-1 text-[#606060] hover:text-white transition-colors shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Buscador -->
          <div class="p-3 md:p-4 border-b border-[#1e1e1e] shrink-0">
            <div class="flex gap-2">
              <input #wkInput
                type="text"
                [(ngModel)]="wkQuery"
                placeholder="Título o ISBN..."
                (keydown.enter)="searchWk()"
                class="flex-1 min-w-0 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white
                       placeholder:text-[#303030] focus:outline-none focus:border-[#7c3aed] transition-colors" />

              <!-- Barcode scan button -->
              <button type="button" (click)="toggleScanner()"
                title="Escanear código de barras"
                class="px-3 py-2.5 rounded-xl border transition-colors shrink-0"
                [class]="scannerActive()
                  ? 'bg-[#7c3aed22] border-[#7c3aed] text-[#8b5cf6]'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#606060] hover:text-[#8b5cf6] hover:border-[#7c3aed44]'">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
              </button>

              <button type="button" (click)="searchWk()" [disabled]="wkLoading()"
                class="px-4 md:px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                       hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
                @if (wkLoading()) { <span class="hidden sm:inline">Buscando...</span><span class="sm:hidden">...</span> }
                @else { Buscar }
              </button>
            </div>
            @if (wkError()) {
              <p class="text-[#ef4444] text-xs mt-2">{{ wkError() }}</p>
            }
          </div>

          <!-- Visor de escáner -->
          @if (scannerActive()) {
            <div class="relative border-b border-[#1e1e1e] bg-black shrink-0" style="height: 220px">
              <video #scannerVideo class="w-full h-full object-cover" autoplay muted playsinline></video>
              <!-- Línea de escaneo animada -->
              <div class="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#7c3aed] opacity-70
                          animate-pulse rounded-full shadow-[0_0_8px_#7c3aed]"></div>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <!-- Marco de escaneo -->
                <div class="w-56 h-28 border-2 border-[#7c3aed] rounded-lg opacity-50"></div>
              </div>
              <p class="absolute bottom-2 inset-x-0 text-center text-xs text-[#606060]">
                Apunta el código de barras al centro
              </p>
            </div>
          }

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto p-3 md:p-4">

            @if (wkDetail()) {
              <!-- Vista detalle -->
              <div>
                <button type="button" (click)="wkDetail.set(null)"
                  class="flex items-center gap-1.5 text-xs text-[#606060] hover:text-white mb-4 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Volver a resultados
                </button>

                <div class="flex gap-4 md:gap-5">
                  @if (wkDetail()!.cover) {
                    <img [src]="wkDetail()!.cover" alt="Portada"
                      class="w-24 md:w-28 shrink-0 rounded-lg border border-[#2a2a2a] object-cover aspect-[2/3]" />
                  }
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-sm md:text-base leading-tight">{{ wkDetail()!.title }}</h3>
                    @if (wkDetail()!.series) {
                      <p class="text-[#7c3aed] text-xs mt-1 uppercase tracking-wider">{{ wkDetail()!.series }}</p>
                    }
                    <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      @if (wkDetail()!.publisher) {
                        <div><span class="text-[#505050]">Editorial</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.publisher }}</span></div>
                      }
                      @if (wkDetail()!.date) {
                        <div><span class="text-[#505050]">Fecha</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.date }}</span></div>
                      }
                      @if (wkDetail()!.number) {
                        <div><span class="text-[#505050]">Número</span><br><span class="text-[#a0a0a0]">#{{ wkDetail()!.number }}</span></div>
                      }
                      @if (wkDetail()!.isbn) {
                        <div><span class="text-[#505050]">ISBN</span><br><span class="text-[#a0a0a0]">{{ wkDetail()!.isbn }}</span></div>
                      }
                    </div>
                    @if (wkDetail()!.authors.length) {
                      <p class="mt-2 text-xs text-[#505050]">Autores: <span class="text-[#a0a0a0]">{{ wkDetail()!.authors.join(' · ') }}</span></p>
                    }
                    @if (wkDetail()!.description) {
                      <p class="mt-3 text-xs text-[#606060] line-clamp-4 leading-relaxed">{{ wkDetail()!.description }}</p>
                    }
                  </div>
                </div>

                <div class="flex gap-3 mt-5">
                  <button type="button" (click)="addDirectly()" [disabled]="wkSaving()"
                    class="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#7c3aed]
                           hover:bg-[#6d28d9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    @if (wkSaving()) { Añadiendo... } @else { Añadir }
                  </button>
                  <a routerLink="/app/comics/new" (click)="closeModal()"
                    class="px-5 py-3 rounded-xl text-sm text-[#a0a0a0] hover:text-white bg-[#1a1a1a]
                           border border-[#2a2a2a] hover:bg-[#222] transition-colors">
                    Editar antes
                  </a>
                </div>
              </div>

            } @else {
              <!-- Lista de resultados -->
              @if (wkResults().length > 0) {
                @if (wkTotal() > 0) {
                  <p class="text-xs text-[#505050] mb-3">{{ wkTotal() }} resultados</p>
                }
                <div class="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 sm:gap-3">
                  @for (result of wkResults(); track result.id) {
                    <button type="button" (click)="loadWkDetail(result.id, result.type)"
                      [disabled]="wkLoading()" class="group text-left disabled:opacity-50">
                      <div class="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]
                                  group-hover:border-[#7c3aed] transition-colors">
                        @if (result.cover) {
                          <img [src]="result.cover" [alt]="result.title" class="w-full h-full object-cover" loading="lazy" />
                        } @else {
                          <div class="w-full h-full flex items-center justify-center text-[#303030]">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                          </div>
                        }
                      </div>
                      <p class="mt-1.5 text-xs text-[#a0a0a0] group-hover:text-white line-clamp-2 leading-tight transition-colors">{{ result.title }}</p>
                      <p class="text-[10px] text-[#404040] truncate">{{ result.type }}</p>
                    </button>
                  }
                </div>
                @if (wkHasMore() && !wkLoading()) {
                  <button type="button" (click)="loadMoreWk()"
                    class="mt-4 w-full py-2 rounded-xl text-xs text-[#a0a0a0] bg-[#1a1a1a] border border-[#2a2a2a]
                           hover:bg-[#222] hover:text-white transition-colors">
                    Cargar más resultados
                  </button>
                }
              } @else if (!wkLoading() && wkSearched()) {
                <div class="text-center py-12 text-[#404040]">
                  <p class="text-sm">Sin resultados para esa búsqueda</p>
                </div>
              } @else if (!wkLoading()) {
                <div class="text-center py-12 text-[#404040]">
                  <svg class="w-10 h-10 mx-auto mb-3 text-[#252525]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p class="text-sm">Escribe el título o ISBN y pulsa Buscar</p>
                  <p class="text-xs mt-1 text-[#303030]">También puedes escanear el código de barras</p>
                </div>
              }

              @if (wkLoading()) {
                <div class="text-center py-12">
                  <div class="inline-block w-6 h-6 border-2 border-[#2a2a2a] border-t-[#7c3aed] rounded-full animate-spin"></div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ComicsListComponent implements OnInit, OnDestroy {
  @ViewChild('scannerVideo') private scannerVideoRef?: ElementRef<HTMLVideoElement>;

  private api = inject(ApiService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private zone = inject(NgZone);
  private base = environment.apiUrl;
  private zxingReader = new BrowserMultiFormatReader();

  comics = signal<Comic[]>([]);
  collections = signal<CollectionItem[]>([]);
  total = signal(0);
  loading = signal(false);
  page = signal(1);
  viewMode = signal<'grid' | 'list'>('grid');
  tab = signal<'comics' | 'collections'>('comics');

  search = '';
  filterStatus = '';
  readonly limit = 42;
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));
  private searchTimer: any;

  // ── Modal state ──────────────────────────────────────────────────────────
  modalOpen = signal(false);
  wkQuery = '';
  wkLoading = signal(false);
  wkSaving = signal(false);
  wkError = signal('');
  wkResults = signal<WkResult[]>([]);
  wkDetail = signal<WkComic | null>(null);
  wkSearched = signal(false);
  wkPage = signal(1);
  wkHasMore = signal(false);
  wkTotal = signal(0);
  private wkSelectedResult: WkResult | null = null;

  // ── Scanner state ────────────────────────────────────────────────────────
  scannerActive = signal(false);
  private reader = new BrowserMultiFormatReader();
  private scannerControls: { stop(): void } | null = null;

  ngOnInit() { this.load(); }

  ngOnDestroy() { this.stopScanner(); }

  switchTab(t: 'comics' | 'collections') {
    this.tab.set(t); this.page.set(1); this.search = ''; this.filterStatus = ''; this.load();
  }

  load() {
    this.loading.set(true);
    if (this.tab() === 'collections') {
      this.http.get<PaginatedResponse<CollectionItem>>(`${this.base}/collections`, {
        params: { page: this.page().toString(), limit: this.limit.toString(), ...(this.search ? { search: this.search } : {}) }
      }).subscribe({
        next: res => { this.collections.set(res.data); this.total.set(res.total); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else {
      this.api.get<PaginatedResponse<Comic>>('/comics', {
        page: this.page(), limit: this.limit,
        search: this.search || undefined,
        read_status: this.filterStatus || undefined,
      }).subscribe({
        next: res => { this.comics.set(res.data); this.total.set(res.total); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 400);
  }

  goTo(p: number) { this.page.set(p); this.load(); }

  statusLabel(s: string) { return s === 'read' ? 'Leído' : 'Sin leer'; }
  statusClass(s: string) {
    return s === 'read' ? 'bg-[#22c55e1a] text-[#22c55e]' : 'bg-[#ffffff0d] text-[#606060]';
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  openModal() {
    this.modalOpen.set(true);
    this.wkQuery = ''; this.wkResults.set([]); this.wkDetail.set(null);
    this.wkError.set(''); this.wkSearched.set(false); this.wkPage.set(1);
    this.wkHasMore.set(false); this.wkTotal.set(0); this.wkSelectedResult = null;
  }

  closeModal() { this.modalOpen.set(false); }

  searchWk(loadMore = false) {
    if (!this.wkQuery.trim()) return;
    this.wkLoading.set(true); this.wkError.set(''); this.wkDetail.set(null);
    if (!loadMore) { this.wkResults.set([]); this.wkPage.set(1); this.wkSearched.set(false); }

    const params = new HttpParams()
      .set('q', this.wkQuery.trim())
      .set('page', this.wkPage().toString());

    this.http.get<any>(`${this.base}/whakoom/search`, { params }).subscribe({
      next: res => {
        if (res.error) { this.wkError.set(res.error); }
        else {
          this.wkResults.update(prev => loadMore ? [...prev, ...res.data] : res.data);
          this.wkTotal.set(res.total); this.wkHasMore.set(res.hasMore);
        }
        this.wkSearched.set(true); this.wkLoading.set(false);
      },
      error: () => { this.wkError.set('Error al conectar con el servidor'); this.wkLoading.set(false); }
    });
  }

  loadMoreWk() { this.wkPage.update(p => p + 1); this.searchWk(true); }

  loadWkDetail(id: string, type: string) {
    this.wkSelectedResult = this.wkResults().find(r => r.id === id) ?? null;
    this.wkLoading.set(true); this.wkError.set('');
    const params = new HttpParams().set('type', type);
    this.http.get<any>(`${this.base}/whakoom/comic/${id}`, { params }).subscribe({
      next: res => {
        if (res.error) this.wkError.set(res.error);
        else this.wkDetail.set(res);
        this.wkLoading.set(false);
      },
      error: () => { this.wkError.set('Error al cargar el cómic'); this.wkLoading.set(false); }
    });
  }

  // ── Barcode scanner ──────────────────────────────────────────────────────

  toggleScanner() {
    if (this.scannerActive()) {
      this.stopScanner();
    } else {
      this.startScanner();
    }
  }

  private stopScanner() {
    this.scannerControls?.stop();
    this.scannerControls = null;
    this.scannerActive.set(false);
  }

  private startScanner() {
    this.scannerActive.set(true);
    // Give Angular time to render the <video> element
    setTimeout(() => {
      const video = this.scannerVideoRef?.nativeElement;
      if (!video) { this.scannerActive.set(false); return; }

      this.reader.decodeFromVideoDevice(undefined, video, (result, _err) => {
        if (result) {
          this.zone.run(() => {
            this.wkQuery = result.getText();
            this.wkError.set('');
            this.stopScanner();
            this.searchWk();
          });
        }
      }).then(controls => { this.scannerControls = controls; });
    }, 100);
  }

  // ── Add directly ─────────────────────────────────────────────────────────

  addDirectly() {
    const d = this.wkDetail();
    const src = this.wkSelectedResult;
    if (!d || this.wkSaving()) return;
    this.wkSaving.set(true);

    const doSave = (coverUrl: string, collectionId: number | null) => {
      this.api.post<Comic>('/comics', {
        title: d.title,
        series: d.series || '',
        number: d.number ? Number(d.number) : null,
        publisher: d.publisher || '',
        cover_url: coverUrl,
        isbn: d.isbn || '',
        synopsis: d.description || '',
        publish_date: d.date || '',
        writer: d.authors?.[0] || '',
        artist: d.authors?.[1] || '',
        language: d.language || '',
        pages: d.pages ?? null,
        binding: d.binding ?? null,
        price: d.price ?? null,
        collection_id: collectionId,
        read_status: 'unread',
        owned: false,
      }).subscribe({
        next: comic => { this.closeModal(); this.router.navigate(['/app/comics', comic.id]); },
        error: () => this.wkSaving.set(false),
      });
    };

    const createCollection = (coverUrl: string, payload: object) => {
      this.http.post<any>(`${this.base}/collections`, payload).subscribe({
        next: col => doSave(coverUrl, col.id),
        error: () => doSave(coverUrl, null),
      });
    };

    const withCover = (coverUrl: string) => {
      if (src?.type === 'edition') {
        // Resultado de tipo edición: colección con ID de Whakoom (upsert por whakoom_id)
        createCollection(coverUrl, {
          whakoom_id: src.id, whakoom_type: src.type,
          title: d.series || src.title,
          publisher: d.publisher || src.publisher,
          cover_url: src.cover,
          url: `https://www.whakoom.com/ediciones/${src.id}`,
        });
      } else if (d.series) {
        // Cómic individual con serie: crear/reutilizar colección por título
        createCollection(coverUrl, {
          title: d.series,
          publisher: d.publisher || '',
        });
      } else {
        doSave(coverUrl, null);
      }
    };

    if (d.cover) {
      this.http.post<{ key: string }>(`${this.base}/covers/upload`, { url: d.cover }).subscribe({
        next: r => withCover(`${this.base}/covers/${r.key}`),
        error: () => withCover(d.cover),
      });
    } else {
      withCover('');
    }
  }
}
