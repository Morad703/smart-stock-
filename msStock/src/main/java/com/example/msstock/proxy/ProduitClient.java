package com.example.msstock.proxy;

import com.example.msstock.dto.Produit;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "msproduit")
public interface ProduitClient {

    @GetMapping("/produits/{id}")
    Produit getProduit(@PathVariable("id") Long id);
}

