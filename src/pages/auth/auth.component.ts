import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  // Alterna entre login y registro
  isLogin   = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  error     = signal<string>('');

  // Campos del formulario
  name     = '';
  email    = '';
  password = '';

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  toggleMode(): void {
    this.isLogin.update(v => !v);
    this.error.set('');
    this.name = '';
    this.email = '';
    this.password = '';
  }

  private isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

  goHome(): void {
    this.router.navigate(['/']);
  }

submit(): void {
  this.error.set('');

  if (!this.email || !this.password) {
    this.error.set('Email y contraseña son obligatorios');
    return;
  }
  if (!this.isValidEmail(this.email)) {
    this.error.set('El formato del email no es válido');
    return;
  }
  if (!this.isLogin() && !this.name) {
    this.error.set('El nombre es obligatorio');
    return;
  }
  if (this.password.length < 6) {
    this.error.set('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  this.isLoading.set(true);

  const request$ = this.isLogin()
    ? this.authService.login(this.email, this.password)
    : this.authService.register(this.email, this.password, this.name);

  request$.subscribe({
    next: () => {
      this.isLoading.set(false);
      this.router.navigate(['/chat']);
    },
    error: (err) => {
      this.isLoading.set(false);
      this.error.set(err.error?.error ?? 'Error de conexión');
    }
  });
}
}