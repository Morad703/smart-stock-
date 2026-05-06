package com.example.mscommande.controller;

import com.example.mscommande.model.Commande;
import com.example.mscommande.service.CommandeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/commandes")
public class CommandeController {

    private final CommandeService commandeService;

    public CommandeController(CommandeService commandeService) {
        this.commandeService = commandeService;
    }

    @PostMapping("/ajouter")
    public Commande ajouter(@RequestBody Commande commande) {
        return commandeService.ajouter(commande);
    }

    @PutMapping("/modifier/{id}")
    public Commande modifier(@PathVariable Long id, @RequestBody Commande commande) {
        return commandeService.modifier(id, commande);
    }

    @DeleteMapping("/supprimer/{id}")
    public String supprimer(@PathVariable Long id) {
        commandeService.supprimer(id);
        return "Commande supprimée avec succès !";
    }

    @DeleteMapping("/produit/{produitId}")
    public String supprimerCommandesByProduitId(@PathVariable Long produitId) {
        commandeService.supprimerCommandesByProduitId(produitId);
        return "Commandes associées au produit supprimées avec succès !";
    }

    @GetMapping("/{id}")
    public Commande obtenir(@PathVariable Long id) {
        return commandeService.obtenir(id);
    }

    @GetMapping
    public List<Commande> liste() {
        return commandeService.liste();
    }
}
