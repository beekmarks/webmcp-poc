/**
 * agentClient.js
 * ----------------
 * This file manages the AI Agent Client with real LLM integration.
 * It handles chat UI, processes user input, and coordinates between the LLM and WebMCP tools.
 * Updated to use actual LLM APIs instead of mock keyword matching.
 */
class AgentClient {
    constructor(mockAgent) {
        console.log('🤖 [Agent Client] Initializing AI Agent Client for WebMCP demo');
        console.log('🤖 [Agent Client] This orchestrates the entire human-AI-web interaction flow');
        
        this.agent = mockAgent;
        this.llmClient = new LLMClient(window.Config);
        this.promptInput = document.getElementById('ai-user-prompt');
        this.sendButton = document.getElementById('ai-send-btn');
        this.chatHistory = document.getElementById('ai-chat-history');
        this.isProcessing = false;

        console.log('🎯 [Agent Client] Setting up UI event listeners for chat interaction');
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });
        
        console.log('✅ [Agent Client] Agent client initialized successfully');
    }

    // Adds a message to the chat UI
    addMessage(text, sender) {
        console.log(`💬 [Chat UI] Adding ${sender} message to chat interface`);
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.textContent = text;
        this.chatHistory.appendChild(msgDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        console.log(`✅ [Chat UI] Message displayed and chat scrolled to bottom`);
    }

    // Handles the user clicking "Send"
    async handleSend() {
        if (this.isProcessing) {
            console.log('⚠️ [User Input] Ignoring user input - already processing previous request');
            return;
        }
        
        const prompt = this.promptInput.value.trim();
        if (!prompt) {
            console.log('⚠️ [User Input] Empty prompt - no action taken');
            return;
        }

        console.log('🚀 [User Input] Processing new user request:', prompt);
        console.log('🚀 [User Input] Starting WebMCP workflow: User → AI → WebMCP Tools → Fidelity App → UI');
        
        this.isProcessing = true;
        this.addMessage(prompt, 'user');
        this.promptInput.value = '';
        this.updateSendButton(false);

        try {
            // Show typing indicator
            console.log('⏳ [Chat UI] Displaying AI thinking indicator');
            const typingId = this.showTypingIndicator();

            // Process with real LLM
            console.log('🤖 [Agent Processing] Sending user prompt to LLM for analysis and potential tool execution');
            const response = await this.processUserPromptWithLLM(prompt);

            // Remove typing indicator
            console.log('⏳ [Chat UI] Removing AI thinking indicator - processing complete');
            this.removeTypingIndicator(typingId);

            // Display the agent's final message to the user
            if (response.message) {
                console.log('💬 [Agent Response] Displaying AI response to user:', response.message);
                this.addMessage(response.message, 'agent');
            }
        } catch (error) {
            console.error('❌ [Agent Processing] Error during user prompt processing:', error);
            console.error('❌ [Agent Processing] This could be LLM API, WebMCP tool, or UI error');
            this.addMessage('Sorry, I encountered an error. Please try again.', 'agent');
        } finally {
            console.log('🔄 [Agent Processing] Request processing complete - resetting UI state');
            this.isProcessing = false;
            this.updateSendButton(true);
        }
    }

    /**
     * REAL LLM Integration with Function Calling
     * This function uses actual LLM APIs to understand user requests and call appropriate tools.
     */
    async processUserPromptWithLLM(prompt) {
        try {
            console.log('🔄 [LLM Processing] Starting LLM-powered prompt analysis');
            // Get available tools from the WebMCP agent
            const availableTools = this.agent.tools;
            console.log('🔧 [LLM Processing] Available WebMCP tools for LLM:', availableTools.size);

            // Send prompt to LLM with available tools
            console.log('🤖 [LLM Processing] Sending prompt and tools to LLM for function calling decision');
            const llmResponse = await this.llmClient.generateResponse(prompt, availableTools);
            console.log('🤖 [LLM Processing] LLM response type:', llmResponse.type);

            switch (llmResponse.type) {
                case 'function_call':
                    console.log('⚡ [Function Call] LLM decided to execute WebMCP tool:', llmResponse.functionName);
                    console.log('⚡ [Function Call] Tool arguments:', llmResponse.arguments);
                    
                    // LLM wants to call a function
                    const functionResult = await this.agent.invokeTool(
                        llmResponse.functionName, 
                        llmResponse.arguments
                    );
                    console.log('✅ [Function Call] WebMCP tool execution completed');

                    // Send function result back to LLM for final response
                    if (llmResponse.toolCallId) {
                        console.log('🔄 [Function Call] Sending tool result back to LLM for final user response');
                        const finalResponse = await this.llmClient.handleFunctionResult(
                            llmResponse.toolCallId,
                            llmResponse.functionName,
                            functionResult
                        );
                        console.log('✅ [Function Call] Received final LLM response based on tool result');
                        return finalResponse;
                    } else {
                        // Format the result as a user-friendly message
                        console.log('📝 [Function Call] Formatting tool result for user display (legacy mode)');
                        return this.formatFunctionResult(llmResponse.functionName, functionResult);
                    }

                case 'text':
                    console.log('💬 [LLM Response] LLM provided direct text response (no tools needed)');
                    // Direct text response from LLM
                    return { message: llmResponse.message };

                case 'error':
                    console.log('❌ [LLM Response] LLM reported error condition');
                    return { message: llmResponse.message };

                default:
                    console.log('⚠️ [LLM Response] Unknown response type, using fallback message');
                    return { message: "I'm not sure how to help with that. Please try asking about your accounts, balances, or transfers." };
            }

        } catch (error) {
            console.error("❌ [LLM Processing] Error during LLM prompt processing:", error);
            
            // Fallback to mock behavior if enabled
            if (window.Config.development.enableMockMode) {
                console.log('🧪 [LLM Processing] Falling back to mock mode due to error');
                return await this.processUserPromptMock(prompt);
            }
            
            console.log('❌ [LLM Processing] Returning error message to user');
            return { message: "I encountered an error processing your request. Please try again." };
        }
    }

    /**
     * Format function results into user-friendly messages
     */
    formatFunctionResult(functionName, result) {
        switch (functionName) {
            case 'getAccountBalance':
                if (result.success) {
                    return { message: `The balance for ${result.accountName} is $${result.balance.toFixed(2)}.` };
                }
                break;
            case 'getAccountList':
                if (result.success) {
                    const accountNames = result.accounts.map(a => a.name).join(', ');
                    return { message: `Here are your accounts: ${accountNames}.` };
                }
                break;
            case 'initiateFundTransfer':
                return { message: result.message };
            case 'getPortfolioPerformance':
                return { message: result.message };
        }
        
        return { message: result.success ? result.message : `Error: ${result.message}` };
    }

    /**
     * Legacy mock processing (fallback)
     */
    async processUserPromptMock(prompt) {
        // Keep the original mock logic as fallback
        return { message: `Mock response: I can help with account balances, transfers, and portfolio performance. Try: "What's my Roth IRA balance?" or "Transfer $1000 from Brokerage to Roth IRA"` };
    }

    /**
     * UI Helper Methods
     */
    updateSendButton(enabled) {
        console.log(`🔘 [UI State] ${enabled ? 'Enabling' : 'Disabling'} send button`);
        this.sendButton.disabled = !enabled;
        this.sendButton.textContent = enabled ? 'Send' : 'Processing...';
    }

    showTypingIndicator() {
        console.log('⏳ [UI Animation] Showing AI typing indicator');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message agent-message typing';
        typingDiv.innerHTML = '<span class="typing-dots">●●●</span>';
        typingDiv.id = 'typing-indicator';
        this.chatHistory.appendChild(typingDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        return 'typing-indicator';
    }

    removeTypingIndicator(typingId) {
        console.log('⏳ [UI Animation] Removing AI typing indicator');
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.remove();
        }
    }
}