package com.example.mscommande.service;

import com.example.mscommande.model.Commande;
import com.example.mscommande.model.CommandeStatus;
import com.example.mscommande.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class CommandeService {

    private final CommandeRepository commandeRepository;

    @Autowired
    private RestTemplate restTemplate;

    public CommandeService(CommandeRepository commandeRepository) {
        this.commandeRepository = commandeRepository;
    }

    public Commande ajouter(Commande commande) {
        // Générer la référence si elle n'est pas fournie
        if (commande.getReference() == null || commande.getReference().isEmpty()) {
            commande.setReference(generateReference());
        }

        // Assurer la relation bidirectionnelle
        if (commande.getItems() != null) {
            commande.getItems().forEach(item -> item.setCommande(commande));
        }

        return commandeRepository.save(commande);
    }

    public Commande modifier(Long id, Commande commandeModifiee) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable !"));

        // Sauvegarder l'ancien statut pour détecter le changement
        CommandeStatus ancienStatut = commande.getStatus();

        // Mettre à jour les champs simples
        commande.setDateCommande(commandeModifiee.getDateCommande());
        commande.setStatus(commandeModifiee.getStatus());
        // Ne pas modifier la référence une fois créée
        if (commandeModifiee.getReference() != null && !commandeModifiee.getReference().isEmpty()) {
            commande.setReference(commandeModifiee.getReference());
        }

        // Ne pas modifier les items lors de la modification du statut uniquement
        // Si des items sont fournis, les mettre à jour
        if (commandeModifiee.getItems() != null && !commandeModifiee.getItems().isEmpty()) {
            // Vider l'ancienne liste d'items proprement
            commande.getItems().clear();
            // Ajouter les nouveaux items
            commandeModifiee.getItems().forEach(item -> {
                item.setCommande(commande);   // définir la relation parent -> enfant
                commande.getItems().add(item);
            });
        }

        Commande updatedCommande = commandeRepository.save(commande);

        if (ancienStatut != CommandeStatus.REÇUE &&
                updatedCommande.getStatus() == CommandeStatus.REÇUE) {
            updateStocksFromCommande(updatedCommande);
        }

        return updatedCommande;
    }

    public void supprimer(Long id) {
        commandeRepository.deleteById(id);
    }

    public void supprimerCommandesByProduitId(Long produitId) {
        List<Commande> commandes = commandeRepository.findCommandesByProduitId(produitId);
        commandeRepository.deleteAll(commandes);
    }

    public Commande obtenir(Long id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande introuvable !"));
    }

    public List<Commande> liste() {
        return commandeRepository.findAll();
    }

    /**
     * Génère une référence unique au format CMD01, CMD02, etc.
     */
    private String generateReference() {
        List<Commande> toutesCommandes = commandeRepository.findAll();
        int maxNum = 0;

        for (Commande c : toutesCommandes) {
            if (c.getReference() != null && c.getReference().startsWith("CMD")) {
                try {
                    String numStr = c.getReference().replace("CMD", "").trim();
                    int num = Integer.parseInt(numStr);
                    if (num > maxNum) {
                        maxNum = num;
                    }
                } catch (NumberFormatException e) {
                    // Ignorer les références mal formées
                }
            }
        }

        int nextNum = maxNum + 1;
        return String.format("CMD%02d", nextNum);
    }

    /**
     * Met à jour les stocks lorsque la commande est reçue
     */
    private void updateStocksFromCommande(Commande commande) {
        if (commande.getItems() == null || commande.getItems().isEmpty()) {
            return;
        }

        for (var item : commande.getItems()) {
            try {
                // Récupérer tous les stocks et trouver celui correspondant au produit
                List<?> allStocks = restTemplate.getForObject(
                        "http://localhost:7777/msstock/stocks",
                        List.class
                );

                if (allStocks != null) {
                    // Trouver le stock existant pour ce produit
                    Object stockObj = allStocks.stream()
                            .filter(s -> {
                                try {
                                    java.util.Map<String, Object> stockMap = (java.util.Map<String, Object>) s;
                                    Object produitId = stockMap.get("produitId");
                                    return produitId != null &&
                                            Long.valueOf(produitId.toString()).equals(item.getProduitId());
                                } catch (Exception e) {
                                    return false;
                                }
                            })
                            .findFirst()
                            .orElse(null);

                    if (stockObj != null) {
                        // Mettre à jour le stock existant
                        java.util.Map<String, Object> stockMap = (java.util.Map<String, Object>) stockObj;
                        Long stockId = Long.valueOf(stockMap.get("id").toString());
                        Integer quantiteActuelle = Integer.valueOf(stockMap.get("quantite").toString());
                        Integer nouvelleQuantite = quantiteActuelle + item.getQuantite();

                        stockMap.put("quantite", nouvelleQuantite);
                        restTemplate.put(
                                "http://localhost:7777/msstock/stocks/" + stockId,
                                stockMap
                        );
                    } else {
                        // Créer un nouveau stock si il n'existe pas
                        java.util.Map<String, Object> newStock = new java.util.HashMap<>();
                        newStock.put("produitId", item.getProduitId());
                        newStock.put("quantite", item.getQuantite());
                        newStock.put("seuilCritique", 10); // Valeur par défaut
                        newStock.put("emplacement", null);

                        restTemplate.postForObject(
                                "http://localhost:7777/msstock/stocks",
                                newStock,
                                Object.class
                        );
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la mise à jour du stock pour le produit " +
                        item.getProduitId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
