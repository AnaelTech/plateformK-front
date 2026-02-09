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
  
  // Nouveaux champs pour gérer les types de factures et le paiement
  invoiceType: 'CLIENT_INVOICE' | 'TEACHER_INVOICE';
  paidAt?: string;
  isPaid: boolean;
  isOverdue: boolean;
  teacher?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CompletedUnbilledCours {
  coursId: number;
  titre: string;
  matiere: string;
  dureeMinutes: number;
  dateCours: string;
  tarif: number;
  eleveId: number;
  eleveName: string;
  parentId: number;
  parentName: string;
  parentEmail: string;
  notionsCovered?: string;
  teacherFeedback?: string;
}

export interface CreateInvoiceRequest {
  coursIds: number[];
  parentId: number;
  description?: string;
  notes?: string;
  paymentDelayDays?: number;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly apiUrl = `${environment.apiUrl}invoices`;

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

  /**
   * Met à jour le statut d'une facture
   * @param invoiceId ID de la facture
   * @param status Nouveau statut (DRAFT, SENT, PAID, etc.)
   * @param notes Notes optionnelles
   */
  updateInvoiceStatus(
    invoiceId: number,
    status: string,
    notes?: string,
  ): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/status`, {
      status,
      notes,
    });
  }

  /**
   * Marque une facture comme payée avec la date actuelle
   * @param invoiceId ID de la facture
   */
  markInvoiceAsPaid(invoiceId: number): Observable<Invoice> {
    return this.http.patch<Invoice>(
      `${this.apiUrl}/${invoiceId}/mark-paid`,
      {},
    );
  }

  /**
   * Annule le paiement d'une facture
   * @param invoiceId ID de la facture
   */
  markInvoiceAsUnpaid(invoiceId: number): Observable<Invoice> {
    return this.http.patch<Invoice>(
      `${this.apiUrl}/${invoiceId}/mark-unpaid`,
      {},
    );
  }

  /**
   * Récupère toutes les factures d'un professeur
   * @param teacherId ID du professeur
   */
  getInvoicesByTeacher(teacherId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/teacher/${teacherId}`);
  }

  /**
   * Crée une nouvelle facture à partir de cours terminés sélectionnés
   * @param request Données de création de la facture
   */
  createInvoice(request: CreateInvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(this.apiUrl, request);
  }
}
