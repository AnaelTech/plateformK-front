import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  creationDate: string;
  dueDate: string;
  statut: string;
  description?: string;
  notes?: string;
  studentName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private readonly http: HttpClient) {}

  getMyInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/my`);
  }

  getInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
  }

  sendInvoiceByEmail(invoiceId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${invoiceId}/email`, {});
  }
}
