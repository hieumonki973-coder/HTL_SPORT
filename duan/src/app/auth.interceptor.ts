import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Lấy token đã lưu khi login
  const token = localStorage.getItem('token');

  if (token) {
    // Clone request và thêm Authorization header
    const cloned = req.clone({
      setHeaders: {
        Authorization: token
      }
    });
    return next(cloned);
  }

  return next(req);
};
