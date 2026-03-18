import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    NgApexchartsModule
  ],
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.css']
})
export class DashboardComponent implements OnInit {

  /** ====== STATS ====== */
  totalRevenue = 0;        // tạm để
  totalInventory = 0;
  totalOrders = 0;

  /** ====== DATA ====== */
  recentOrders: any[] = [];
  categoryRevenue: any[] = [];

  /** ====== UI ====== */
  isLoading = true;
  errorMessage = '';

  /** ====== CHART ====== */
  chartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 350
    },
    xaxis: {
      categories: []
    },
    title: {
      text: 'Doanh thu theo danh mục'
    },
    noData: {
      text: 'Chưa có dữ liệu'
    }
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  /** ====== LOAD DASHBOARD ====== */
  loadDashboard(): void {
    this.isLoading = true;

    this.http.get<any>('http://localhost:8000/api/admin/dashboard')
      .subscribe({
        next: (res) => {
          this.totalRevenue   = res.totalRevenue || 0;
          this.totalInventory = res.totalInventory || 0;
          this.totalOrders    = res.totalOrders || 0;

          this.recentOrders   = res.recentOrders || [];
          this.categoryRevenue = res.categoryRevenue || [];

          this.buildCategoryChart(this.categoryRevenue);

          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Không tải được dữ liệu dashboard';
          this.isLoading = false;
        }
      });
  }

  /** ====== BUILD CHART ====== */
  buildCategoryChart(data: any[]): void {
    if (!data.length) return;

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        {
          name: 'Doanh thu',
          data: data.map(d => d.revenue || 0)
        }
      ],
      xaxis: {
        categories: data.map(d => d._id || 'Không xác định')
      }
    };
  }

  /** ====== ACTION ====== */
  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
