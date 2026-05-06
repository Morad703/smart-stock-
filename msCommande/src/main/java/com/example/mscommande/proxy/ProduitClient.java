package com.example.mscommande.proxy;

import com.example.mscommande.dto.Produit;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "msproduit")  // Nom EXACT dans Eureka
public interface ProduitClient {

    @GetMapping("/produits/{id}")
    Produit getProduit(@PathVariable("id") Long id);
}

