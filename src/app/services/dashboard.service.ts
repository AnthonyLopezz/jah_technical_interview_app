import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../core/api.config';

export interface TopProduct { name: string; sold: number; revenue: number; }
export interface Kpis { totalSales: number; totalOrders: number; avgTicket: number; topProducts: TopProduct[]; }
export interface TimeseriesPoint { date: string; total: number; }
export interface PaymentMethod { method: string; count: number; }

export interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = inject(API_URL);

  getKpis(from?: string, to?: string): Observable<ApiResponse<Kpis>> {
    const params = this.buildParams(from, to);
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/dashboard/kpis`, { params }).pipe(
      map((res) => ({
        data: {
          totalSales: Number(res?.data?.totalSales ?? 0),
          totalOrders: Number(res?.data?.ordersCount ?? 0),
          avgTicket: Number(res?.data?.averageTicket ?? 0),
          topProducts: (res?.data?.topProducts ?? []).map((p: any) => ({
            name: p?.name ?? '',
            sold: Number(p?.quantity ?? 0),
            revenue: Number(p?.revenue ?? 0),
          })),
        },
      }))
    );
  }

  getSalesTimeseries(from?: string, to?: string): Observable<ApiResponse<TimeseriesPoint[]>> {
    const params = this.buildParams(from, to);
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/dashboard/timeseries`, { params }).pipe(
      map((res) => ({
        data: (res?.data ?? []).map((p: any) => ({
          date: String(p?.period ?? ''),
          total: Number(p?.total ?? 0),
        })),
      }))
    );
  }

  getPaymentMethods(from?: string, to?: string): Observable<ApiResponse<PaymentMethod[]>> {
    const params = this.buildParams(from, to);
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/dashboard/kpis`, { params }).pipe(
      map((res) => ({
        data: (res?.data?.paymentDistribution ?? []).map((d: any) => ({
          method: String(d?.paymentMethod ?? ''),
          count: Number(d?.orders ?? 0),
        })),
      }))
    );
  }

  private buildParams(from?: string, to?: string): HttpParams {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return params;
  }
}