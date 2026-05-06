package com.example.msstock.config;

import com.example.msstock.model.Stock;
import com.example.msstock.repository.StockRepository;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.Step;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.infrastructure.item.ItemProcessor;
import org.springframework.batch.infrastructure.item.ItemReader;
import org.springframework.batch.infrastructure.item.ItemWriter;
import org.springframework.batch.infrastructure.item.support.ListItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import com.example.msstock.dto.Produit;

import org.springframework.web.client.RestTemplate;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ConcurrentLinkedQueue;

@Configuration
@EnableBatchProcessing
public class BatchJobConfig {

    private final StockRepository stockRepository;
    private final AmqpTemplate amqpTemplate;
    // Utiliser ConcurrentLinkedQueue pour thread-safety
    private final ConcurrentLinkedQueue<String> stocksCritiques = new ConcurrentLinkedQueue<>();

    public BatchJobConfig(StockRepository stockRepository, AmqpTemplate amqpTemplate) {
        this.stockRepository = stockRepository;
        this.amqpTemplate = amqpTemplate;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public Job checkStockJob(JobRepository jobRepository,
                             PlatformTransactionManager transactionManager) {

        return new JobBuilder("checkStockJob", jobRepository)
                .start(checkStockStep(jobRepository, transactionManager))
                .build();
    }

    @Bean
    public Step checkStockStep(JobRepository jobRepository,
                               PlatformTransactionManager transactionManager) {

        return new StepBuilder("checkStockStep", jobRepository)
                .<Stock, Stock>chunk(10, transactionManager)
                .reader(stockReader())
                .processor(stockProcessor(restTemplate()))
                .writer(stockWriter())
                .build();
    }

    @Bean
    public ItemReader<Stock> stockReader() {
        return new ListItemReader<>(stockRepository.findAll());
    }

    @Bean
    public ItemProcessor<Stock, Stock> stockProcessor(RestTemplate restTemplate) {
        return stock -> {
            if (stock.getQuantite() < stock.getSeuilCritique()) {
                try {
                    Produit produit = restTemplate.getForObject(
                            "http://localhost:7777/msproduit/produits/" + stock.getProduitId(),
                            Produit.class
                    );

                    if (produit != null) {
                        String ligne = String.format(
                                "%s (Réf: %s) - Stock: %d unité(s) | Seuil: %d",
                                produit.getDesignation(),
                                produit.getReference(),
                                stock.getQuantite(),
                                stock.getSeuilCritique()
                        );
                        stocksCritiques.add(ligne);
                    }
                } catch (Exception e) {
                    System.err.println("[BATCH] Erreur lors de la recuperation du produit " + stock.getProduitId() + ": " + e.getMessage());
                }
            }
            return stock;
        };
    }

    
    @Bean
    public ItemWriter<Stock> stockWriter() {
        return items -> {
            System.out.println("[BATCH] Chunk traite - " + items.size() + " stocks");
        };
    }
    
    // Méthode publique pour réinitialiser (appelée depuis le scheduler)
    public void resetStocksCritiques() {
        stocksCritiques.clear();
    }
    
    // Méthode publique pour générer le rapport (appelée depuis le scheduler)
    public void generateReportAfterJob() {
        generateAndSendReport();
    }
    
    // Méthode pour générer et envoyer le rapport final
    private void generateAndSendReport() {
        LocalDate today = LocalDate.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        String dateStr = today.format(dateFormatter);
        String timeStr = LocalTime.now().format(timeFormatter);
        
        StringBuilder rapport = new StringBuilder();
        
        rapport.append("RAPPORT QUOTIDIEN DE STOCK\n");

        if (stocksCritiques.isEmpty()) {
            rapport.append("Etat : Tous les stocks sont dans les normes\n");
            rapport.append("Aucun stock critique détecté à ce moment.\n");
        } else {
            rapport.append("Etat : ").append(stocksCritiques.size()).append(" stock(s) critique(s) détecté(s)\n\n");
            rapport.append("Produits nécessitant un réapprovisionnement :\n\n");
            
            int index = 1;
            for (String ligne : stocksCritiques) {
                rapport.append(index).append(". ").append(ligne).append("\n");
                index++;
            }
            
        }

        String messageRapport = rapport.toString();
        amqpTemplate.convertAndSend("notification-queue", messageRapport);
        System.out.println("[BATCH] Rapport quotidien envoye - " + stocksCritiques.size() + " stock(s) critique(s)");
        
        // Réinitialiser la liste pour le prochain batch
        stocksCritiques.clear();
    }
}
