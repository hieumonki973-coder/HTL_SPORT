import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Contact {
  name: string;
  phone: string;
  email: string;
  message: string;

}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://127.0.0.1:8000/v1/contact';

  constructor(private http: HttpClient) {}

  sendContact(data: Contact): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

}

