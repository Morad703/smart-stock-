import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../models/commande.model';

@Injectable({
  providedIn: 'root'
})
export class CommandeService {
  private apiUrl = 'http://localhost:8777/mscommande/commandes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Commande[]> {
    return this.http.get<Commande[]>(this.apiUrl);
  }

  getById(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${this.apiUrl}/${id}`);
  }

  create(commande: Commande): Observable<Commande> {
    return this.http.post<Commande>(`${this.apiUrl}/ajouter`, commande);
  }

  update(id: number, commande: Commande): Observable<Commande> {
    return this.http.put<Commande>(`${this.apiUrl}/modifier/${id}`, commande);
  }

  delete(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/supprimer/${id}`, { responseType: 'text' as 'json' });
  }
}
