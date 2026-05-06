package com.example.msfournisseur.service;

import com.example.msfournisseur.model.Fournisseur;
import com.example.msfournisseur.repository.FournisseurRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FournisseurService {

    private final FournisseurRepository repo;

    public FournisseurService(FournisseurRepository repo) {
        this.repo = repo;
    }

    public Fournisseur save(Fournisseur fournisseur) {
        return repo.save(fournisseur);
    }

    public List<Fournisseur> findAll() {
        return repo.findAll();
    }

    public Fournisseur findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public Fournisseur update(Long id, Fournisseur fournisseur) {
        Fournisseur f = repo.findById(id).orElse(null);
        if (f == null) return null;

        f.setNom(fournisseur.getNom());
        f.setAdresse(fournisseur.getAdresse());
        f.setEmail(fournisseur.getEmail());
        f.setTelephone(fournisseur.getTelephone());


        return repo.save(f);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
