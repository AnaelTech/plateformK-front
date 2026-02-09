import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  InvitationRequest,
  InvitationResponse,
  ValidateTokenResponse,
  RegisterViaInvitationRequest,
  AuthResponse,
} from '../models/invitation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private readonly apiUrl = `${environment.apiUrl}invitations`;

  constructor(private http: HttpClient) {}

  /**
   * Envoie une invitation.
   */
  sendInvitation(request: InvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(`${this.apiUrl}/send`, request);
  }

  /**
   * Valide un token d'invitation.
   */
  validateToken(token: string): Observable<ValidateTokenResponse> {
    return this.http.get<ValidateTokenResponse>(
      `${this.apiUrl}/validate/${token}`,
    );
  }

  /**
   * Crée un compte via invitation.
   */
  registerViaInvitation(
    request: RegisterViaInvitationRequest,
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }
}
