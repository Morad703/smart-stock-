package com.example.msstock.service;

import com.example.msstock.model.Stock;
import com.example.msstock.repository.SortieStockRepository;
import com.example.msstock.repository.StockRepository;
import com.example.msstock.dto.Produit;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class StockService {

    private final StockRepository stockRepository;
    private final SortieStockRepository sortieStockRepository;
    private final AmqpTemplate amqpTemplate;
    private final RestTemplate restTemplate;

    public StockService(StockRepository stockRepository,
                        SortieStockRepository sortieStockRepository,
                        AmqpTemplate amqpTemplate,
                        RestTemplate restTemplate) {
        this.stockRepository = stockRepository;
        this.sortieStockRepository = sortieStockRepository;
        this.amqpTemplate = amqpTemplate;
        this.restTemplate = restTemplate;
    }

    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    public Stock addStock(Stock stock) {
        // Vérifier si un stock existe déjà pour ce produit
        Optional<Stock> existingStock = stockRepository.findByProduitId(stock.getProduitId());
        if (existingStock.isPresent()) {
            throw new RuntimeException("Un stock existe déjà pour ce produit. Utilisez la mise à jour pour modifier le stock existant.");
        }
        
        Stock savedStock = stockRepository.save(stock);
        checkAndSendAlert(savedStock);
        return savedStock;
    }

    public Stock updateStock(Long id, Stock stockDetails) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock introuvable"));

        stock.setProduitId(stockDetails.getProduitId());
        stock.setQuantite(stockDetails.getQuantite());
        stock.setSeuilCritique(stockDetails.getSeuilCritique());
        stock.setEmplacement(stockDetails.getEmplacement());

        Stock savedStock = stockRepository.save(stock);
        checkAndSendAlert(savedStock);
        return savedStock;
    }

    public void deleteStock(Long id) {
        stockRepository.deleteById(id);
    }

    public void deleteStockByProduitId(Long produitId) {
        System.out.println("[STOCK] Tentative de suppression des stocks pour le produit " + produitId);
        
        // Trouver tous les stocks associés au produit
        List<Stock> stocks = stockRepository.findAllByProduitId(produitId);
        System.out.println("[STOCK] " + stocks.size() + " stock(s) trouvé(s) pour le produit " + produitId);
        
        if (stocks.isEmpty()) {
            System.out.println("[STOCK] Aucun stock à supprimer pour le produit " + produitId);
            return;
        }
        
        // Supprimer chaque stock (cela supprimera aussi les SortieStock en cascade grâce à cascade = CascadeType.ALL)
        for (Stock stock : stocks) {
            System.out.println("[STOCK] Suppression du stock ID: " + stock.getId() + " pour le produit " + produitId);
            stockRepository.deleteById(stock.getId());
        }
        
        System.out.println("[STOCK] " + stocks.size() + " stock(s) supprimé(s) avec succès pour le produit " + produitId);
    }

    public Stock sortieStock(Long stockId, int quantite, String raison, String commentaire) {
        Stock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock introuvable"));

        if (quantite > stock.getQuantite()) {
            throw new RuntimeException("Quantité insuffisante. Stock disponible: " + stock.getQuantite());
        }

        if (quantite <= 0) {
            throw new RuntimeException("La quantité doit être supérieure à 0");
        }

        int nouvelleQuantite = stock.getQuantite() - quantite;
        stock.setQuantite(nouvelleQuantite);

        Stock updatedStock = stockRepository.save(stock);
        checkAndSendAlert(updatedStock);

        System.out.println("Sortie enregistrée - Stock ID: " + stockId +
                ", Quantité: " + quantite +
                ", Raison: " + raison +
                ", Commentaire: " + commentaire +
                ", Nouveau stock: " + nouvelleQuantite);

        return updatedStock;
    }

    /**
     * Vérifie si le stock est critique et envoie une notification si nécessaire
     */
    private void checkAndSendAlert(Stock stock) {
        if (stock.getQuantite() < stock.getSeuilCritique()) {
            try {
                Produit produit = restTemplate.getForObject(
                        "http://localhost:7777/msproduit/produits/" + stock.getProduitId(),
                        Produit.class
                );

                if (produit != null) {
                    String message = String.format(
                            " Stock critique !\n" +
                                    "Produit : %s\n" +
                                    "Référence : %s\n" +
                                    "Quantité actuelle : %d\n" +
                                    "Seuil critique : %d",
                            produit.getDesignation(),
                            produit.getReference(),
                            stock.getQuantite(),
                            stock.getSeuilCritique()
                    );

                    amqpTemplate.convertAndSend("notification-queue", message);
                    System.out.println("[ALERTE] Notification envoyée en temps reel : " + message);
                }
            } catch (Exception e) {
                System.err.println("[ERREUR] Erreur lors de l'envoi de l'alerte : " + e.getMessage());
            }
        }
    }
}