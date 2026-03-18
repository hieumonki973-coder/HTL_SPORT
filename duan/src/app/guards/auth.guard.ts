import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  } else {
    // Chuyển hướng về /home kèm query param
    router.navigate(['/home'], {
      queryParams: { message: 'auth_required' }
    });
    return false;
  }
};
