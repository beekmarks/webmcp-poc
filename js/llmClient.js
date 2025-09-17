/**
 * llmClient.js
 * ------------
 * Handles communication with real LLM APIs (OpenAI, Anthropic, etc.)
 * Supports function calling for WebMCP tool integration
 */

class LLMClient {
    constructor(config) {
        console.log('🤖 [LLM Client] Initializing LLM client with configuration');
        console.log('🤖 [LLM Client] Provider:', config.llm.provider, 'Model:', config.llm.model);
        console.log('🤖 [LLM Client] This enables real AI-powered natural language processing for WebMCP');
        this.config = config;
        this.conversationHistory = [];
        console.log('✅ [LLM Client] Client initialized successfully');
    }

    /**
     * Converts WebMCP tools to OpenAI function calling format
     */
    formatToolsForOpenAI(tools) {
        console.log('🔧 [LLM Client] Converting WebMCP tools to OpenAI function calling format');
        console.log('🔧 [LLM Client] Available WebMCP tools:', Array.from(tools.keys()));
        const formattedTools = Array.from(tools.values()).map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));
        console.log('✅ [LLM Client] Tools formatted for OpenAI function calling:', formattedTools.length, 'functions');
        return formattedTools;
    }

    /**
     * Converts WebMCP tools to Anthropic tool format
     */
    formatToolsForAnthropic(tools) {
        return Array.from(tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema
        }));
    }

    /**
     * Make API call to LLM with function calling support
     */
    async generateResponse(userMessage, availableTools) {
        console.log('💬 [LLM Client] Processing user message:', userMessage);
        console.log('💬 [LLM Client] Available WebMCP tools for this request:', availableTools.size);
        
        try {
            if (this.config.development.enableMockMode) {
                console.log('🧪 [LLM Client] Mock mode enabled - using simulated responses');
                return this.mockResponse(userMessage);
            }

            console.log('🔑 [LLM Client] Retrieving API key for real LLM integration');
            const apiKey = this.config.getApiKey();
            
            // Add user message to conversation history
            console.log('📝 [LLM Client] Adding user message to conversation history');
            this.conversationHistory.push({
                role: "user",
                content: userMessage
            });

            let response;
            
            console.log('🌐 [LLM Client] Routing to provider-specific API handler');
            switch (this.config.llm.provider) {
                case 'openai':
                    console.log('🤖 [LLM Client] Using OpenAI API with GPT-4 and function calling');
                    response = await this.callOpenAI(userMessage, availableTools, apiKey);
                    break;
                case 'anthropic':
                    console.log('🤖 [LLM Client] Using Anthropic Claude API with tool calling');
                    response = await this.callAnthropic(userMessage, availableTools, apiKey);
                    break;
                default:
                    throw new Error(`Unsupported LLM provider: ${this.config.llm.provider}`);
            }

            return response;
            
        } catch (error) {
            console.error('❌ [LLM Client] Error during LLM processing:', error.message);
            console.error('❌ [LLM Client] This could be API key, network, or rate limiting issue');
            return {
                type: 'error',
                message: 'Sorry, I encountered an error processing your request. Please try again.'
            };
        }
    }

    /**
     * OpenAI API integration
     */
    async callOpenAI(userMessage, availableTools, apiKey) {
        console.log('🔄 [OpenAI API] Preparing OpenAI chat completions request');
        const tools = this.formatToolsForOpenAI(availableTools);
        
        console.log('📋 [OpenAI API] Building request payload with system prompt and WebMCP tools');
        const requestBody = {
            model: this.config.llm.model,
            messages: [
                {
                    role: "system",
                    content: `You are a helpful financial assistant for Fidelity Investments. You can help users with account inquiries, portfolio performance, and fund transfers. 
                    
                    Available tools: ${tools.map(t => t.function.name).join(', ')}
                    
                    Always be helpful and professional. When users request transfers, explain that you'll prepare the form but they need to confirm the transaction for security.`
                },
                ...this.conversationHistory
            ],
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: tools.length > 0 ? "auto" : undefined,
            max_tokens: this.config.llm.maxTokens,
            temperature: this.config.llm.temperature
        };

        console.log('📋 [OpenAI API] Request configuration:', {
            model: requestBody.model,
            messageCount: requestBody.messages.length,
            toolCount: tools.length,
            toolChoice: requestBody.tool_choice
        });

        if (this.config.development.logRequests) {
            console.log('📤 [OpenAI API] Full request payload:', requestBody);
        }

        console.log('🌐 [OpenAI API] Sending HTTP request to OpenAI chat completions endpoint');
        const response = await fetch(`${this.config.llm.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('❌ [OpenAI API] HTTP error response:', response.status, response.statusText);
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ [OpenAI API] Error details:', errorData);
            throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
        }

        console.log('✅ [OpenAI API] Successful response received from OpenAI');
        const data = await response.json();
        console.log('📊 [OpenAI API] Response metadata:', {
            id: data.id,
            model: data.model,
            usage: data.usage,
            finishReason: data.choices?.[0]?.finish_reason
        });
        
        if (this.config.development.logResponses) {
            console.log('📥 [OpenAI API] Full response payload:', data);
        }

        return this.processOpenAIResponse(data);
    }

    /**
     * Process OpenAI response and handle function calls
     */
    processOpenAIResponse(apiResponse) {
        console.log('🔄 [OpenAI Response] Processing OpenAI API response');
        const message = apiResponse.choices[0].message;
        
        // Add assistant message to history
        console.log('📝 [OpenAI Response] Adding assistant message to conversation history');
        this.conversationHistory.push(message);

        // Check if the assistant wants to call a function
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log('🔧 [OpenAI Response] AI wants to execute WebMCP tool function call');
            const toolCall = message.tool_calls[0];
            const functionName = toolCall.function.name;
            console.log('🎯 [OpenAI Response] Tool to execute:', functionName);
            console.log('🎯 [OpenAI Response] Raw function arguments:', toolCall.function.arguments);
            
            let functionArgs;
            
            try {
                functionArgs = JSON.parse(toolCall.function.arguments);
                console.log('✅ [OpenAI Response] Successfully parsed function arguments:', functionArgs);
            } catch (error) {
                console.error('❌ [OpenAI Response] Error parsing function arguments:', error);
                return {
                    type: 'error',
                    message: 'I had trouble understanding the parameters for that request.'
                };
            }

            console.log('🚀 [OpenAI Response] Preparing WebMCP function call execution');
            return {
                type: 'function_call',
                functionName: functionName,
                arguments: functionArgs,
                toolCallId: toolCall.id
            };
        }

        // Regular text response
        console.log('💬 [OpenAI Response] AI provided text response (no function calls)');
        console.log('💬 [OpenAI Response] Response content:', message.content);
        return {
            type: 'text',
            message: message.content
        };
    }

    /**
     * Handle function call results and get follow-up response
     */
    async handleFunctionResult(toolCallId, functionName, functionResult) {
        console.log('🔄 [Function Result] Processing WebMCP tool execution result');
        console.log('🔄 [Function Result] Tool:', functionName, 'Result:', functionResult);
        
        // Add function result to conversation history
        console.log('📝 [Function Result] Adding tool result to conversation context');
        this.conversationHistory.push({
            role: "tool",
            content: JSON.stringify(functionResult),
            tool_call_id: toolCallId
        });

        // Get follow-up response from LLM
        console.log('🤖 [Function Result] Requesting follow-up response from AI based on tool execution');
        const followUpResponse = await this.callOpenAI('', new Map(), this.config.getApiKey());
        console.log('✅ [Function Result] Received AI follow-up response');
        return followUpResponse;
    }

    /**
     * Anthropic API integration (similar structure)
     */
    async callAnthropic(userMessage, availableTools, apiKey) {
        // Implementation for Anthropic Claude API
        // Similar structure but different API format
        throw new Error('Anthropic integration not implemented yet');
    }

    /**
     * Fallback mock response for testing
     */
    mockResponse(userMessage) {
        console.log('🧪 [Mock LLM] Generating mock response (no real API call)');
        console.log('🧪 [Mock LLM] User input:', userMessage);
        return {
            type: 'text',
            message: `Mock LLM response to: "${userMessage}". Enable a real LLM provider in config.js for actual AI responses.`
        };
    }

    /**
     * Clear conversation history
     */
    reset() {
        this.conversationHistory = [];
    }
}

window.LLMClient = LLMClient;