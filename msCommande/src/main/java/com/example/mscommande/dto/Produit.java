package com.example.mscommande.dto;

import lombok.Data;

@Data
public class Produit {
    private Long id;
    private String designation;
    private String description;
    private double prix;
    private String categorie;
    private String reference;
    private Long fournisseur_id;
}
