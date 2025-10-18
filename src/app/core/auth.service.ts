import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { data?: { token: string }; token?: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_URL);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((res) => {
        const token = res?.token || res?.data?.token;
        if (token) localStorage.setItem('token', token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}