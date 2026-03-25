package com.docai.document_intelligence.controller;

import com.docai.document_intelligence.dto.QnaRequest;
import com.docai.document_intelligence.dto.QnaResponse;
import com.docai.document_intelligence.model.Document;
import com.docai.document_intelligence.repository.DocumentRepository;
import com.docai.document_intelligence.service.BedrockService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qna")
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class QnaController {

    @Autowired private BedrockService bedrockService;
    @Autowired private DocumentRepository documentRepository;

    @PostMapping("/{docId}")
    public ResponseEntity<?> ask(
            @PathVariable Long docId,
            @RequestBody QnaRequest request) {

        Document doc = documentRepository.findById(docId)
            .orElseThrow(() -> new RuntimeException("Document not found"));

        if (!"DONE".equals(doc.getStatus())) {
            return ResponseEntity.badRequest()
                .body("Document not ready. Current status: " + doc.getStatus());
        }

        if (doc.getExtractedText() == null || doc.getExtractedText().isBlank()) {
            return ResponseEntity.badRequest()
                .body("No extracted text found for this document");
        }

        log.info("Q&A request for doc {}: {}", docId, request.getQuestion());
        String answer = bedrockService.askQuestion(doc.getExtractedText(), request.getQuestion());
        return ResponseEntity.ok(new QnaResponse(request.getQuestion(), answer, docId));
    }
}