import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface RevenueByCategory {
  categoryName: string;
  totalRevenue: number;
}

export interface Stats {
  totalRevenue: number;
  revenueGrowth: number;
  totalInventory: number;
  orderGrowth: number;
  percentageSold: number;
  revenueByCategory: RevenueByCategory[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private url = 'https://backend-funsport-6e9i.onrender.com/v1';

  constructor(private http: HttpClient) {}

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.url}/stats`);
  }

  getAllStats(): Observable<Stats[]> {
    return this.http.get<Stats[]>(`${this.url}/stats/all`);
  }
}
