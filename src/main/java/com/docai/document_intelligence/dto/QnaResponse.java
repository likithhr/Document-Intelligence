package com.docai.document_intelligence.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QnaResponse {
    private String question;
    private String answer;
    private Long documentId;
}