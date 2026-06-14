import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token caducado/inválido: limpia sesión y redirige a login en vez de
      // dejar la app "muerta" devolviendo 401 en cada petición.
      if (err.status === 401 && auth.token()) auth.logout();
      return throwError(() => err);
    })
  );
};
