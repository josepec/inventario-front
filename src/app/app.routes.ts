import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/app/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'app',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'comics',
        loadComponent: () => import('./features/comics/comics-list/comics-list.component').then(m => m.ComicsListComponent),
      },
      {
        path: 'comics/new',
        loadComponent: () => import('./features/comics/comic-form/comic-form.component').then(m => m.ComicFormComponent),
      },
      {
        path: 'comics/:id',
        loadComponent: () => import('./features/comics/comic-detail/comic-detail.component').then(m => m.ComicDetailComponent),
      },
      {
        path: 'collections/:id',
        loadComponent: () => import('./features/collections/collection-detail/collection-detail.component').then(m => m.CollectionDetailComponent),
      },
      {
        path: 'books',
        loadComponent: () => import('./features/books/books-list/books-list.component').then(m => m.BooksListComponent),
      },
      {
        path: 'books/new',
        loadComponent: () => import('./features/books/book-form/book-form.component').then(m => m.BookFormComponent),
      },
      {
        path: 'books/:id',
        loadComponent: () => import('./features/books/book-detail/book-detail.component').then(m => m.BookDetailComponent),
      },
    ]
  },
  { path: '**', redirectTo: '/app/dashboard' }
];
