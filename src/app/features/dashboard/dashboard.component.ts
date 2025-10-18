import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DashboardService,
  Kpis,
  TimeseriesPoint,
  PaymentMethod,
} from '../../services/dashboard.service';
import { Chart, registerables } from 'chart.js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';

Chart.register(...registerables);
// Mejora: plugin para texto centrado en doughnut
const centerTextPlugin: any = {
  id: 'centerText',
  afterDraw(chart: any) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[0]) return;
    const center = meta.data[0];
    const total = (chart.data.datasets?.[0]?.data || []).reduce(
      (a: number, b: number) => a + b,
      0
    );
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 14px Roboto, Arial, sans-serif';
    ctx.fillStyle = '#616161';
    ctx.fillText(`Total: ${total}`, center.x, center.y);
    ctx.restore();
  },
};
Chart.register(centerTextPlugin);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonToggleModule,
    MatDividerModule,
  ],
  styleUrls: ['dashboard.component.css'],
  templateUrl: 'dashboard.component.html',
})
export class DashboardComponent {
  private service = inject(DashboardService);

  loading = signal(false);
  error = signal<string | null>(null);

  kpis = signal<Kpis | null>(null);
  sales = signal<TimeseriesPoint[]>([]);
  payments = signal<PaymentMethod[]>([]);

  from?: string;
  to?: string;
  selectedRange: string = '7d';

  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsChart')
  topProductsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentChartRef!: ElementRef<HTMLCanvasElement>;

  private salesChart?: Chart;
  private topProductsChart?: Chart;
  private paymentChart?: Chart;

  ngAfterViewInit(): void {
    this.applyQuickRange('7d');
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getKpis(this.from, this.to).subscribe({
      next: (res) => {
        this.kpis.set(res.data);
        this.renderTopProducts();
      },
      error: (err) =>
        this.error.set(err?.error?.message || 'Error cargando KPIs'),
    });

    this.service.getSalesTimeseries(this.from, this.to).subscribe({
      next: (res) => {
        this.sales.set(res.data);
        this.renderSales();
      },
      error: (err) =>
        this.error.set(err?.error?.message || 'Error cargando serie temporal'),
      complete: () => this.loading.set(false),
    });

    this.service.getPaymentMethods(this.from, this.to).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.renderPayments();
      },
      error: (err) =>
        this.error.set(err?.error?.message || 'Error cargando métodos de pago'),
    });
  }

  private renderSales(): void {
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const data = this.sales();
    const labels = data.map((d) => d.date);
    const values = data.map((d) => d.total);

    const h = this.salesChartRef.nativeElement.height || 320;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(63,81,181,0.35)');
    gradient.addColorStop(1, 'rgba(63,81,181,0.0)');

    this.salesChart?.destroy();
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas',
            data: values,
            borderColor: '#3f51b5',
            backgroundColor: gradient,
            fill: 'start',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          decimation: { enabled: true, algorithm: 'lttb', samples: 250 },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `Ventas: ${this.formatCurrency(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { callback: (v: any) => this.formatCurrency(v) },
          },
        },
      },
    });
  }

  private renderTopProducts(): void {
    const ctx = this.topProductsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const top = (this.kpis()?.topProducts || []).slice(0, 5);
    const labels = top.map((p) => p.name);
    const values = top.map((p) => p.sold);

    const palette = this.getPalette(values.length, '#20c997');

    this.topProductsChart?.destroy();
    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Unidades vendidas',
            data: values,
            backgroundColor: palette,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) =>
                `Unidades: ${this.formatNumber(context.parsed.y)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.06)' },
            ticks: { callback: (v: any) => this.formatNumber(v) },
          },
        },
      },
    });
  }

  private renderPayments(): void {
    const ctx = this.paymentChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const labels = this.payments().map((p) => p.method);
    const values = this.payments().map((p) => p.count);
    const total = values.reduce((a, b) => a + b, 0);

    const palette = this.getPalette(values.length, '#3f51b5');

    this.paymentChart?.destroy();
    this.paymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: palette }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const val = context.parsed;
                const pct = total ? Math.round((val / total) * 100) : 0;
                return `${context.label}: ${this.formatNumber(val)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  private formatNumber(n: number): string {
    return new Intl.NumberFormat('es-ES').format(Number(n) || 0);
  }
  private formatCurrency(n: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Number(n) || 0);
  }
  private getPalette(n: number, base: string): string[] {
    const bases = [
      '#3f51b5',
      '#20c997',
      '#9e9e9e',
      '#43a047',
      '#e53935',
      '#fdd835',
      '#fb8c00',
      '#8e24aa',
    ];
    const arr: string[] = [];
    for (let i = 0; i < n; i++) arr.push(bases[i % bases.length]);
    return arr;
  }

  applyQuickRange(range: string): void {
    const today = new Date();
    let from = new Date(today);
    if (range === '7d') {
      from.setDate(today.getDate() - 6);
    } else if (range === '30d') {
      from.setDate(today.getDate() - 29);
    } else if (range === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    const to = new Date(today);
    this.from = this.formatDateForInput(from);
    this.to = this.formatDateForInput(to);
    this.reload();
  }

  private formatDateForInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  }
}
