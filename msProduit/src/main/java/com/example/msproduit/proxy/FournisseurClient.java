package com.example.msproduit.proxy;

import com.example.msproduit.dto.Fournisseur;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "msfournisseur") // le nom EXACT dans Eureka
public interface FournisseurClient {

    @GetMapping("/fournisseurs/{id}")   // endpoint du MS fournisseur
    Fournisseur getFournisseurById(@PathVariable("id") Long id);
}
