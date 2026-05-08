import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fournisseur } from '../models/fournisseur.model';

@Injectable({ providedIn: 'root' })
export class FournisseurService {

  private apiUrl = 'http://localhost:8777/msfournisseur/fournisseurs';

  constructor(private http: HttpClient) {}

  // GET
  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<Fournisseur[]>(this.apiUrl);
  }

  // POST
  createFournisseur(f: Fournisseur): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(this.apiUrl, f);
  }

  deleteFournisseur(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getFournisseurById(id: any): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.apiUrl}/${id}`);
  }

  updateFournisseur(id: number, fournisseur: any) {
    return this.http.put(`${this.apiUrl}/${id}`, fournisseur);
  }


}
