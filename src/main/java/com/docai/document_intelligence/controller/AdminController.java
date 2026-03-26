package com.docai.document_intelligence.controller;

import com.docai.document_intelligence.model.Document;
import com.docai.document_intelligence.service.DocumentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/documents")
@Slf4j
public class AdminController {

    @Autowired
    private DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<Document>> listAllDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        Map<String, String> response = new HashMap<>();
        try {
            documentService.deleteDocument(id);
            response.put("message", "Document deleted successfully");
            response.put("id", String.valueOf(id));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete document {}: {}", id, e.getMessage());
            response.put("error", "Failed to delete document: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable Long id) {
        return documentService.getDocument(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAllDocuments() {
        Map<String, Object> response = new HashMap<>();
        try {
            int deletedCount = documentService.deleteAllDocuments();
            response.put("message", "All documents deleted successfully");
            response.put("deletedCount", deletedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete all documents: {}", e.getMessage());
            response.put("error", "Failed to delete all documents: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
