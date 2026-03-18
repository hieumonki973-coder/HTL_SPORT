import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  tinh: string;
  quan: string;
  phuong: string;
  duong: string;
  soNha: string;
  isDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private apiUrl = 'http://127.0.0.1:8000/v1/addresses';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const loginData = localStorage.getItem('login');
    const token = loginData ? JSON.parse(loginData).accessToken : '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getMyAddresses(): Observable<{ success: boolean; data: Address[] }> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  addAddress(address: Address): Observable<{ success: boolean; data: Address; message: string }> {
    return this.http.post<any>(this.apiUrl, address, { headers: this.getHeaders() });
  }

  updateAddress(id: string, address: Address): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, address, { headers: this.getHeaders() });
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  setDefault(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/default`, {}, { headers: this.getHeaders() });
  }
}
