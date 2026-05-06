package com.example.mscommande.repository;

import com.example.mscommande.model.Commande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    @Query("SELECT DISTINCT c FROM Commande c JOIN c.items i WHERE i.produitId = :produitId")
    List<Commande> findCommandesByProduitId(@Param("produitId") Long produitId);
}
