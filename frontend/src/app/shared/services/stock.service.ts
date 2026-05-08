import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stock } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {

  private apiUrl = 'http://localhost:8777/msstock/stocks';

  constructor(private http: HttpClient) {}

  // GET
  getAllStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(this.apiUrl);
  }

  // GET BY ID
  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/${id}`);
  }

  // POST
  createStock(stock: Stock): Observable<Stock> {
    return this.http.post<Stock>(this.apiUrl, stock);
  }

  // PUT
  updateStock(id: number, stock: Stock): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${id}`, stock);
  }

  // DELETE
  deleteStock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // SORTIE DE STOCK
  sortieStock(id: number, quantite: number, raison: string, commentaire?: string): Observable<Stock> {
    return this.http.post<Stock>(`${this.apiUrl}/${id}/sortie`, {
      quantite,
      raison,
      commentaire: commentaire || ''
    });
  }

  getSorties(stockId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${stockId}/sorties`);
  }


}

