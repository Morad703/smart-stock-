import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private baseUrl = 'http://localhost:8777/msproduit/produits';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  add(produit: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ajouter`, produit);
  }

  update(id: number, produit: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/modifier/${id}`, produit);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/supprimer/${id}`, { responseType: 'text' });
  }
}
