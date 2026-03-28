import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatRequest } from '../models/message.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ClaudeService {

  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL     = 'http://localhost:3000/api/chat';

  sendMessage(request: ChatRequest): Observable<string> {
    const token   = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{ content: string }>(this.API_URL, request, { headers }).pipe(
      map(response => response.content),
      catchError(error => {
        console.error('Error al llamar a la API:', error);
        return throwError(() => new Error('No se pudo conectar con Deploy AI'));
      })
    );
  }
}