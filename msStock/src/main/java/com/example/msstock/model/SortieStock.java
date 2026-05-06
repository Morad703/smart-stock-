package com.example.msstock.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class SortieStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantite;
    private String raison;
    private String commentaire;
    private LocalDateTime dateSortie;

    @ManyToOne
    @JoinColumn(name = "stock_id")
    @JsonIgnoreProperties("sorties")
    private Stock stock;

}
