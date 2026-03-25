package com.docai.document_intelligence.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;

import java.util.stream.Collectors;

@Service
@Slf4j
public class ExtractionService {

    @Autowired private TextractClient textractClient;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public String extractText(String s3Key) {
        log.info("Extracting text from s3Key: {}", s3Key);

        DetectDocumentTextRequest request = DetectDocumentTextRequest.builder()
            .document(Document.builder()
                .s3Object(S3Object.builder()
                    .bucket(bucket)
                    .name(s3Key)
                    .build())
                .build())
            .build();

        DetectDocumentTextResponse response = textractClient.detectDocumentText(request);

        String extractedText = response.blocks().stream()
            .filter(b -> b.blockType() == BlockType.LINE)
            .map(Block::text)
            .collect(Collectors.joining("\n"));

        log.info("Extracted {} characters from document", extractedText.length());
        return extractedText;
    }
}