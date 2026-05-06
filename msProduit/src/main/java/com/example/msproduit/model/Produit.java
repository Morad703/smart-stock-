package com.example.msproduit.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

@Entity
@Data
@AllArgsConstructor
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String designation;
    private String description;
    private double prix;
    private String categorie;
    private String reference;
    private Long fournisseur_id;

    public Produit() {}

    public Produit(String designation, String description, double prix, String categorie, String reference , Long fournisseur_id) {
        this.designation = designation;
        this.description = description;
        this.prix = prix;
        this.categorie = categorie;
        this.reference = reference;
        this.fournisseur_id = fournisseur_id;
    }
}
