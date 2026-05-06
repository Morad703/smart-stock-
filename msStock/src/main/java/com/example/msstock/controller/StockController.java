package com.example.msstock.controller;

import com.example.msstock.model.SortieStock;
import com.example.msstock.model.Stock;
import com.example.msstock.repository.SortieStockRepository;
import com.example.msstock.service.StockService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stocks")
public class StockController {

    private final StockService stockService;
    private final SortieStockRepository sortieStockRepository;

    public StockController(StockService stockService, SortieStockRepository sortieStockRepository) {
        this.stockService = stockService;
        this.sortieStockRepository = sortieStockRepository;
    }

    @GetMapping
    public List<Stock> getAllStocks() {
        return stockService.getAllStocks();
    }

    @GetMapping("/{id}")
    public Stock getStockById(@PathVariable Long id) {
        return stockService.getStockById(id).orElseThrow(() -> new RuntimeException("Stock introuvable"));
    }

    @PostMapping
    public ResponseEntity<?> addStock(@RequestBody Stock stock) {
        try {
            Stock savedStock = stockService.addStock(stock);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedStock);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}")
    public Stock updateStock(@PathVariable Long id, @RequestBody Stock stockDetails) {
        return stockService.updateStock(id, stockDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteStock(@PathVariable Long id) {
        stockService.deleteStock(id);
    }

    @DeleteMapping("/produit/{produitId}")
    public void deleteStockByProduitId(@PathVariable Long produitId) {
        stockService.deleteStockByProduitId(produitId);
    }

    @PostMapping("/{id}/sortie")
    public Stock enregistrerSortie(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        int quantite = (int) payload.get("quantite");
        String raison = (String) payload.get("raison");
        String commentaire = (String) payload.getOrDefault("commentaire", "");

        // 👉 Charger le stock pour le lier
        Stock stock = stockService.getStockById(id)
                .orElseThrow(() -> new RuntimeException("Stock introuvable"));

        // 👉 Créer l'objet sortie
        SortieStock sortie = new SortieStock();
        sortie.setStock(stock); // 🔥🔥 LA CORRECTION IMPORTANTE !!
        sortie.setQuantite(quantite);
        sortie.setRaison(raison);
        sortie.setCommentaire(commentaire);
        sortie.setDateSortie(LocalDateTime.now());

        sortieStockRepository.save(sortie);

        return stockService.sortieStock(id, quantite, raison, commentaire);
    }



    @GetMapping("/{id}/sorties")
    public List<SortieStock> getSortiesByStock(@PathVariable Long id) {
        return sortieStockRepository.findByStockId(id);
    }


}
