package com.example.msfournisseur.controller;

import com.example.msfournisseur.model.Fournisseur;
import com.example.msfournisseur.service.FournisseurService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fournisseurs")
public class FournisseurController {

    private final FournisseurService service;

    public FournisseurController(FournisseurService service) {
        this.service = service;
    }

    @PostMapping
    public Fournisseur create(@RequestBody Fournisseur fournisseur) {
        return service.save(fournisseur);
    }

    @GetMapping
    public List<Fournisseur> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Fournisseur getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public Fournisseur update(@PathVariable Long id, @RequestBody Fournisseur fournisseur) {
        return service.update(id, fournisseur);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
