package com.example.msstock.repository;

import com.example.msstock.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProduitId(Long produitId);
    List<Stock> findAllByProduitId(Long produitId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Stock s WHERE s.produitId = :produitId")
    void deleteByProduitId(@Param("produitId") Long produitId);
}

