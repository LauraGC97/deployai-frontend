import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { publicGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('../pages/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [publicGuard] // si ya estás logado, redirige al chat
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('../pages/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard] // solo usuarios logados
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('../pages/docs/docs.component').then(m => m.DocsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];