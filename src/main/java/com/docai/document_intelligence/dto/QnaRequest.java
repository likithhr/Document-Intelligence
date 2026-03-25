package com.docai.document_intelligence.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QnaRequest {
    @NotBlank(message = "Question cannot be empty")
    private String question;
}