package com.example.msproduit.service;

import com.example.msproduit.model.Produit;
import com.example.msproduit.proxy.FournisseurClient;
import com.example.msproduit.repository.ProduitRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class ProduitService {

    private final ProduitRepository produitRepository;
    private final FournisseurClient fournisseurClient;
    private final RestTemplate restTemplate;

    public ProduitService(ProduitRepository produitRepository, FournisseurClient fournisseurClient) {
        this.produitRepository = produitRepository;
        this.fournisseurClient = fournisseurClient;
        this.restTemplate = new RestTemplate();
    }

    public Produit ajouter(Produit produit) {

        // Vérifier si le fournisseur existe
        fournisseurClient.getFournisseurById(produit.getFournisseur_id());

        return produitRepository.save(produit);
    }

    public Produit modifier(int id, Produit produit) {

        Produit p = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable !"));

        // Vérifier le fournisseur
        fournisseurClient.getFournisseurById(produit.getFournisseur_id());

        p.setDesignation(produit.getDesignation());
        p.setDescription(produit.getDescription());
        p.setPrix(produit.getPrix());
        p.setCategorie(produit.getCategorie());
        p.setReference(produit.getReference());
        p.setFournisseur_id(produit.getFournisseur_id());

        return produitRepository.save(p);
    }

    public void supprimer(int id) {
        Long produitId = Long.valueOf(id);
        
        // Supprimer les stocks associés via Gateway
        try {
            restTemplate.delete("http://localhost:7777/msstock/stocks/produit/" + produitId);
            System.out.println("[PRODUIT] Stocks associés au produit " + id + " supprimés");
        } catch (Exception e) {
            System.err.println("[PRODUIT] Erreur lors de la suppression des stocks : " + e.getMessage());
        }
        
        // Supprimer les commandes associées via Gateway  
        try {
            restTemplate.delete("http://localhost:7777/mscommande/commandes/produit/" + produitId);
            System.out.println("[PRODUIT] Commandes associées au produit " + id + " supprimées");
        } catch (Exception e) {
            System.err.println("[PRODUIT] Erreur lors de la suppression des commandes : " + e.getMessage());
        }
        
        // Supprimer le produit
        produitRepository.deleteById(id);
    }

    public Produit obtenir(int id) {
        return produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit introuvable !"));
    }

    public List<Produit> liste() {
        return produitRepository.findAll();
    }
}
