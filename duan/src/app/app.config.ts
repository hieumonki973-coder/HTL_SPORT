import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth.interceptor';


export const appConfig: ApplicationConfig = {
 providers: [
  provideZoneChangeDetection({ eventCoalescing: true }),

  provideRouter(
    routes,
    withComponentInputBinding(),
    withInMemoryScrolling({
      scrollPositionRestoration: 'top', // 👈 LUÔN CUỘN VỀ ĐẦU
      anchorScrolling: 'enabled'        // 👈 hỗ trợ #anchor (bonus)
    })
  ),

  provideHttpClient(
    withInterceptors([AuthInterceptor])
  )
]

};
