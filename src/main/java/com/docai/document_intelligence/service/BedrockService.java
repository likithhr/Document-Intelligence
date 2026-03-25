package com.docai.document_intelligence.service;

import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

@Service
@Slf4j
public class BedrockService {

    @Autowired private BedrockRuntimeClient bedrockClient;

    @Value("${aws.bedrock.model-id}")
    private String modelId;

    public String summarize(String text) {
        String prompt = "Summarize the following document in 5 concise bullet points:\n\n" + text;
        return invokeModel(prompt);
    }

    public String askQuestion(String documentText, String question) {
        String prompt = String.format(
            "You are a helpful document assistant.\n\n" +
            "Document Content:\n%s\n\n" +
            "Question: %s\n\n" +
            "Answer based only on the document above. Be concise and clear.",
            documentText, question
        );
        return invokeModel(prompt);
    }

    private String invokeModel(String prompt) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("anthropic_version", "bedrock-2023-05-31");
            payload.put("max_tokens", 1024);

            JSONArray messages = new JSONArray();
            JSONObject message = new JSONObject();
            message.put("role", "user");
            message.put("content", prompt);
            messages.put(message);
            payload.put("messages", messages);

            InvokeModelRequest request = InvokeModelRequest.builder()
                .modelId(modelId)
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromUtf8String(payload.toString()))
                .build();

            InvokeModelResponse response = bedrockClient.invokeModel(request);
            String responseBody = response.body().asUtf8String();

            JSONObject json = new JSONObject(responseBody);
            return json.getJSONArray("content")
                       .getJSONObject(0)
                       .getString("text");

        } catch (Exception e) {
            log.error("Bedrock invocation failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }
}