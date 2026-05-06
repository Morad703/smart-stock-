package com.example.mscommande.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long produitId;

    private int quantite;


    // Chaque item appartient à UNE commande
    @ManyToOne
    @JoinColumn(name = "commande_id")  // clé étrangère dans la table commande_item
    @JsonBackReference
    private Commande commande;
}
