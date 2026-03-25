package com.docai.document_intelligence.service;

import com.docai.document_intelligence.model.Document;
import com.docai.document_intelligence.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class SqsListenerService {

    @Autowired private SqsClient sqsClient;
    @Autowired private ExtractionService extractionService;
    @Autowired private BedrockService bedrockService;
    @Autowired private DocumentRepository documentRepository;

    @Value("${aws.sqs.queue-url}")
    private String queueUrl;

    @Scheduled(fixedDelay = 5000)
    public void pollQueue() {
        ReceiveMessageResponse response = sqsClient.receiveMessage(
            ReceiveMessageRequest.builder()
                .queueUrl(queueUrl)
                .maxNumberOfMessages(5)
                .waitTimeSeconds(2)
                .build()
        );

        List<Message> messages = response.messages();
        if (!messages.isEmpty()) {
            log.info("Picked up {} message(s) from SQS", messages.size());
        }

        for (Message message : messages) {
            try {
                Long docId = Long.parseLong(message.body());
                processDocument(docId);

                sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());

            } catch (Exception e) {
                log.error("Failed to process SQS message: {}", e.getMessage());
            }
        }
    }

    private void processDocument(Long docId) {
        Document doc = documentRepository.findById(docId)
            .orElseThrow(() -> new RuntimeException("Document not found: " + docId));

        doc.setStatus("PROCESSING");
        documentRepository.save(doc);
        log.info("Processing document id: {}", docId);

        try {
            String text = extractionService.extractText(doc.getS3Key());
            String summary = bedrockService.summarize(text);

            doc.setExtractedText(text);
            doc.setSummary(summary);
            doc.setStatus("DONE");
            doc.setProcessedAt(LocalDateTime.now());
            log.info("Document {} processed successfully", docId);

        } catch (Exception e) {
            doc.setStatus("FAILED");
            log.error("Processing failed for document {}: {}", docId, e.getMessage());
        }

        documentRepository.save(doc);
    }
}