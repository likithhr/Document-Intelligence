package com.docai.document_intelligence.service;

import com.docai.document_intelligence.model.Document;
import com.docai.document_intelligence.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class DocumentService {

    @Autowired private S3Client s3Client;
    @Autowired private SqsClient sqsClient;
    @Autowired private DocumentRepository documentRepository;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.sqs.queue-url}")
    private String queueUrl;

    public Document uploadDocument(MultipartFile file) throws IOException {
        String s3Key = "documents/" + UUID.randomUUID() + "-" + file.getOriginalFilename();

        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(file.getContentType())
                .build(),
            RequestBody.fromBytes(file.getBytes())
        );

        Document doc = new Document();
        doc.setFileName(file.getOriginalFilename());
        doc.setS3Key(s3Key);
        doc.setStatus("UPLOADED");
        Document saved = documentRepository.save(doc);

        sqsClient.sendMessage(SendMessageRequest.builder()
            .queueUrl(queueUrl)
            .messageBody(String.valueOf(saved.getId()))
            .build());

        log.info("Document uploaded: {} with id: {}", s3Key, saved.getId());
        return saved;
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAllByOrderByUploadedAtDesc();
    }

    public Optional<Document> getDocument(Long id) {
        return documentRepository.findById(id);
    }
}