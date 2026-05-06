package com.example.msstock.dto;

import lombok.Data;

@Data
public class Produit {
    private Long id;
    private String designation;
    private String reference;
    private Long fournisseur_id;
}

