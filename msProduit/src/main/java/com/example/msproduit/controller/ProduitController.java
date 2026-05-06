package com.example.msproduit.controller;

import com.example.msproduit.model.Produit;
import com.example.msproduit.service.ProduitService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/produits")
public class ProduitController {

    private final ProduitService produitService;

    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    @PostMapping("/ajouter")
    public Produit ajouter(@RequestBody Produit produit) {
        return produitService.ajouter(produit);
    }

    @PutMapping("/modifier/{id}")
    public Produit modifier(@PathVariable int id, @RequestBody Produit produit) {
        return produitService.modifier(id, produit);
    }

    @DeleteMapping("/supprimer/{id}")
    public String supprimer(@PathVariable int id) {
        produitService.supprimer(id);
        return "Produit supprimé avec succès !";
    }

    @GetMapping("/{id}")
    public Produit obtenir(@PathVariable int id) {
        return produitService.obtenir(id);
    }

    @GetMapping
    public List<Produit> liste() {
        return produitService.liste();
    }
}
