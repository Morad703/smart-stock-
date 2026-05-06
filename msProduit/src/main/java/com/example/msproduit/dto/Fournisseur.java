package com.example.msproduit.dto;

import lombok.Data;

@Data
public class Fournisseur {
    private Long id;
    private String nom;
    private String adresse;
    private String email;
    private String telephone;
}
