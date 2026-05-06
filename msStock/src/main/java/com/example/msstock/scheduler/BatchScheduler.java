package com.example.msstock.scheduler;

import com.example.msstock.config.BatchJobConfig;
import org.springframework.batch.core.job.Job;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;

import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BatchScheduler {
    private final JobLauncher jobLauncher;
    private final Job checkStockJob;
    private final BatchJobConfig batchJobConfig;

    public BatchScheduler(JobLauncher jobLauncher, Job checkStockJob, BatchJobConfig batchJobConfig) {
        this.jobLauncher = jobLauncher;
        this.checkStockJob = checkStockJob;
        this.batchJobConfig = batchJobConfig;
    }

    @Scheduled(cron = "0 37 00 * * *") // tous les jours à 18:20
    public void runStockJob() throws Exception {
        // Réinitialiser la liste avant le batch
        batchJobConfig.resetStocksCritiques();
        
        // Utiliser un timestamp comme paramètre unique pour chaque exécution
        // Spring Batch identifie les instances de job par leur nom + paramètres identifying
        long timestamp = System.currentTimeMillis();
        String dateStr = java.time.LocalDate.now().toString();
        String timeStr = java.time.LocalTime.now().toString();
        
        JobParameters params = new JobParametersBuilder()
                .addLong("run.id", timestamp) // Utiliser run.id comme paramètre identifying
                .addString("execution.date", dateStr)
                .addString("execution.time", timeStr)
                .toJobParameters();

        System.out.println("[BATCH] Paramètres du job:");
        System.out.println("  - run.id: " + timestamp);
        System.out.println("  - execution.date: " + dateStr);
        System.out.println("  - execution.time: " + timeStr);
        System.out.println("[BATCH] JobParameters.toString(): " + params);

        jobLauncher.run(checkStockJob, params);
        
        // Générer le rapport après l'exécution du job
        // Le job s'exécute de manière synchrone, donc on peut générer le rapport immédiatement
        Thread.sleep(500); // Petit délai pour s'assurer que le traitement est terminé
        batchJobConfig.generateReportAfterJob();
        
        System.out.println("[BATCH] Job de verification du stock termine et rapport genere");
    }
}
