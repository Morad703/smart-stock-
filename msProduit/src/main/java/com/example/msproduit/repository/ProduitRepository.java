package com.example.msproduit.repository;

import com.example.msproduit.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProduitRepository extends JpaRepository<Produit, Integer> {
}
