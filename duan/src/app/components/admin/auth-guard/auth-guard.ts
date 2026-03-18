import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const rawToken = token.replace(/^Bearer\s/, '');
      const payload: any = jwtDecode(rawToken);
      console.log('Decoded payload:', payload);

      // ✅ Check đúng field
      if (payload.admin === true) {
        return true;
      }
    } catch (err) {
      console.error('Token decode failed', err);
    }
  }

  // ❌ Không phải admin thì redirect
  return router.createUrlTree(['/home'], {
    queryParams: { message: 'admin_required' }
  });
};
