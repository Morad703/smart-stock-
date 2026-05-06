package com.example.msstock.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long produitId;     // Id du produit
    private int quantite;       // Quantité en stock
    private int seuilCritique;  // Stock minimum critique

    private String emplacement; // Optionnel : lieu de stockage
    @OneToMany(mappedBy = "stock", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("stock")
    private List<SortieStock> sorties = new ArrayList<>();

}
