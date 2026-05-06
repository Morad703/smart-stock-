package com.example.msstock.repository;

import com.example.msstock.model.SortieStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SortieStockRepository extends JpaRepository<SortieStock, Long> {
    List<SortieStock> findByStockId(Long stockId);
}
