# WebMCP POC - Detailed Technical Flow Documentation

This document provides a comprehensive walkthrough of the WebMCP (Web Model Context Protocol) Proof of Concept, explaining each step in the architectural flow with actual code snippets that demonstrate how components communicate and maintain separation of responsibilities.

## Overview

The WebMCP POC demonstrates how AI agents can interact with web applications through a standardized protocol. The flow involves 6 distinct layers, each with specific responsibilities and clean interfaces.

---

## 1. User Input Layer

### User → Chat Interface

**Flow Step**: User enters natural language input into the chat interface.

**Example Input**: *"Transfer $5000 from my Brokerage to my Roth IRA"*

**Code Implementation**: 

```html
<!-- index.html - Chat Interface UI -->
<div class="ai-input-area">
    <textarea id="ai-user-prompt" 
              placeholder="e.g., Transfer $5000 from my Brokerage to my Roth IRA">
    </textarea>
    <button id="ai-send-btn">Send</button>
</div>
```

**Responsibility**: Capture user intent in natural language format.

---

## 2. Agent Processing Layer

### Chat Interface → Agent Client

**Flow Step**: User clicks "Send" button, triggering the Agent Client to process the input.

**Code Implementation**:

```javascript
// agentClient.js - Event Handling
constructor(mockAgent) {
    this.agent = mockAgent;
    this.llmClient = new LLMClient(window.Config);
    this.promptInput = document.getElementById('ai-user-prompt');
    this.sendButton = document.getElementById('ai-send-btn');
    
    // Bind event handlers
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    });
}
```

**Separation of Concerns**: The Agent Client manages UI interactions but delegates actual processing to the LLM Client.

### Agent Client → LLM Client

**Flow Step**: Agent Client passes the user prompt to the LLM Client for processing.

**Code Implementation**:

```javascript
// agentClient.js - Request Processing
async handleSend() {
    if (this.isProcessing) return;
    
    const prompt = this.promptInput.value.trim();
    if (!prompt) return;

    this.isProcessing = true;
    this.addMessage(prompt, 'user');
    this.promptInput.value = '';
    this.updateSendButton(false);

    try {
        // Show typing indicator
        const typingId = this.showTypingIndicator();

        // Process with real LLM - This is where we delegate to LLM Client
        const response = await this.processUserPromptWithLLM(prompt);

        // Remove typing indicator and display response
        this.removeTypingIndicator(typingId);
        if (response.message) {
            this.addMessage(response.message, 'agent');
        }
    } catch (error) {
        console.error('Error processing user prompt:', error);
        this.addMessage('Sorry, I encountered an error. Please try again.', 'agent');
    } finally {
        this.isProcessing = false;
        this.updateSendButton(true);
    }
}
```

**Communication Method**: Async function call with error handling and UI state management.

---

## 3. LLM Integration Layer

### Configuration → LLM Client

**Flow Step**: LLM Client reads configuration settings for API keys and model parameters.

**Code Implementation**:

```javascript
// config.js - Configuration Management
const Config = {
    llm: {
        provider: 'openai',
        apiKey: 'sk-proj-***',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4-turbo-preview',
        maxTokens: 1500,
        temperature: 0.1,
        functionCalling: true
    },
    
    development: {
        enableMockMode: false,
        logRequests: true,
        logResponses: true
    }
};

// Helper to get API key securely
Config.getApiKey = function() {
    if (this.llm.apiKey) {
        return this.llm.apiKey;
    }
    throw new Error('API key not configured. Please set Config.llm.apiKey or enable mock mode.');
};
```

**Responsibility**: Centralized configuration management with security considerations.

### LLM Client → OpenAI API

**Flow Step**: LLM Client formats the request with available tools and sends to OpenAI.

**Code Implementation**:

```javascript
// llmClient.js - API Communication
async generateResponse(userMessage, availableTools) {
    try {
        if (this.config.development.enableMockMode) {
            return this.mockResponse(userMessage);
        }

        const apiKey = this.config.getApiKey();
        
        // Add user message to conversation history
        this.conversationHistory.push({
            role: "user",
            content: userMessage
        });

        let response;
        
        switch (this.config.llm.provider) {
            case 'openai':
                response = await this.callOpenAI(userMessage, availableTools, apiKey);
                break;
            default:
                throw new Error(`Unsupported LLM provider: ${this.config.llm.provider}`);
        }

        return response;
        
    } catch (error) {
        console.error('LLM API Error:', error);
        return {
            type: 'error',
            message: 'Sorry, I encountered an error processing your request. Please try again.'
        };
    }
}
```

**Communication Protocol**: HTTP REST API with JSON payloads, including conversation history and function definitions.

### OpenAI API Request Format

**Code Implementation**:

```javascript
// llmClient.js - OpenAI Request Formation
async callOpenAI(userMessage, availableTools, apiKey) {
    const tools = this.formatToolsForOpenAI(availableTools);
    
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

    const response = await fetch(`${this.config.llm.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return this.processOpenAIResponse(data);
}
```

**Tool Format Conversion**:

```javascript
// llmClient.js - Tool Format Conversion
formatToolsForOpenAI(tools) {
    return Array.from(tools.values()).map(tool => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
        }
    }));
}
```

**Responsibility**: Convert WebMCP tool definitions to OpenAI's function calling format.

---

## 4. WebMCP Tools Layer

### WebMCP Provider → Mock Agent API

**Flow Step**: WebMCP Provider registers available tools with the Mock Agent API.

**Code Implementation**:

```javascript
// webmcpProvider.js - Tool Registration
function registerFidelityTools() {
    if (window.agent && typeof window.agent.provideContext === 'function') {
        window.agent.provideContext({
            tools: [
                // Tool 1: Get a list of all accounts
                {
                    name: "getAccountList",
                    description: "Retrieves a list of all the user's available accounts, including their names and unique IDs.",
                    inputSchema: { type: "object", properties: {} },
                    async execute() {
                        console.log("WebMCP Tool Executed: getAccountList");
                        return { success: true, accounts: Object.values(mockAccountData) };
                    }
                },
                
                // Tool 2: Get account balance
                {
                    name: "getAccountBalance",
                    description: "Gets the current total market value for a specific account identified by its name or type.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            accountIdentifier: {
                                type: "string",
                                description: "The name or type of the account to query, like '401k' or 'Brokerage'."
                            }
                        },
                        required: ["accountIdentifier"]
                    },
                    async execute({ accountIdentifier }) {
                        console.log(`WebMCP Tool Executed: getAccountBalance for ${accountIdentifier}`);
                        const lowerIdentifier = accountIdentifier.toLowerCase();
                        const account = Object.values(mockAccountData).find(acc => 
                            acc.name.toLowerCase().includes(lowerIdentifier)
                        );

                        if (account) {
                            App.highlightAccount(account.id);
                            return { success: true, accountName: account.name, balance: account.balance };
                        }
                        return { success: false, message: `Account '${accountIdentifier}' not found.` };
                    }
                },
                
                // Tool 3: Portfolio performance
                {
                    name: "getPortfolioPerformance",
                    description: "Retrieves the historical investment performance data for the user's total portfolio over a given time period.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            timePeriod: {
                                type: "string",
                                description: "The desired time frame, e.g., 'YTD', '1 Year', '3 Year'.",
                                enum: ["YTD", "1 Year", "3 Year", "5 Year"]
                            }
                        },
                        required: ["timePeriod"]
                    },
                    async execute({ timePeriod }) {
                        console.log(`WebMCP Tool Executed: getPortfolioPerformance for ${timePeriod}`);
                        App.updatePerformanceChart(timePeriod);
                        return { success: true, message: `Portfolio performance chart is now showing data for '${timePeriod}'.` };
                    }
                },
                
                // Tool 4: Fund transfer (requires confirmation)
                {
                    name: "initiateFundTransfer",
                    description: "Pre-fills the fund transfer form to move a specific amount of money between two of the user's Fidelity accounts. This action requires final user confirmation.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            fromAccount: { type: "string", description: "The name of the source account." },
                            toAccount: { type: "string", description: "The name of the destination account." },
                            amount: { type: "number", description: "The dollar amount to transfer." }
                        },
                        required: ["fromAccount", "toAccount", "amount"]
                    },
                    async execute({ fromAccount, toAccount, amount }) {
                        console.log(`WebMCP Tool Executed: initiateFundTransfer from ${fromAccount} to ${toAccount} for $${amount}`);
                        const fromAcc = Object.values(mockAccountData).find(acc => 
                            acc.name.toLowerCase().includes(fromAccount.toLowerCase())
                        );
                        const toAcc = Object.values(mockAccountData).find(acc => 
                            acc.name.toLowerCase().includes(toAccount.toLowerCase())
                        );

                        if (!fromAcc || !toAcc) {
                            return { success: false, message: "One of the specified accounts could not be found." };
                        }

                        // Security best practice: only prepare the action, require user confirmation
                        App.showTransferModal({ from: fromAcc.id, to: toAcc.id, amount });
                        return { success: true, message: "I've prepared the transfer for you. Please review and click 'Submit' to complete it." };
                    }
                }
            ]
        });
    } else {
        console.error("WebMCP agent is not available.");
    }
}
```

**Responsibility**: Define available tools with their schemas and execution logic.

### Mock Agent API Implementation

**Code Implementation**:

```javascript
// main.js - Mock WebMCP Browser API
const mockAgentAPI = {
    tools: new Map(),

    // The function Fidelity's frontend calls to expose its tools
    provideContext: function(context) {
        console.log("MockAgentAPI: provideContext called. Registering tools:", 
                   context.tools.map(t => t.name));
        this.tools.clear(); // Clear old tools for simplicity
        context.tools.forEach(tool => {
            this.tools.set(tool.name, tool);
        });
    },

    // Helper function for the AgentClient to call a registered tool
    invokeTool: async function(toolName, parameters) {
        if (this.tools.has(toolName)) {
            const tool = this.tools.get(toolName);
            try {
                // Execute the tool's function and return the result
                return await tool.execute(parameters);
            } catch (error) {
                console.error(`Error executing tool '${toolName}':`, error);
                return { success: false, message: `An internal error occurred.` };
            }
        } else {
            console.error(`Error: Agent tried to invoke unknown tool '${toolName}'`);
            return { success: false, message: `Unknown action.` };
        }
    }
};

// Attach the mock API to the window object
window.agent = mockAgentAPI;
```

**Communication Method**: Tool registration via `provideContext()` and execution via `invokeTool()`.

---

## 5. Decision Processing

### OpenAI Response → LLM Client Decision

**Flow Step**: Process OpenAI's response to determine if it's a text response or function call.

**Code Implementation**:

```javascript
// llmClient.js - Response Processing
processOpenAIResponse(apiResponse) {
    const message = apiResponse.choices[0].message;
    
    // Add assistant message to history
    this.conversationHistory.push(message);

    // Check if the assistant wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
            functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (error) {
            console.error('Error parsing function arguments:', error);
            return {
                type: 'error',
                message: 'I had trouble understanding the parameters for that request.'
            };
        }

        return {
            type: 'function_call',
            functionName: functionName,
            arguments: functionArgs,
            toolCallId: toolCall.id
        };
    }

    // Regular text response
    return {
        type: 'text',
        message: message.content
    };
}
```

**Decision Logic**: Inspect response structure to determine next action (text vs. function call).

### Function Call Processing

**Code Implementation**:

```javascript
// agentClient.js - Function Call Handling
async processUserPromptWithLLM(prompt) {
    try {
        // Get available tools from the WebMCP agent
        const availableTools = this.agent.tools;

        // Send prompt to LLM with available tools
        const llmResponse = await this.llmClient.generateResponse(prompt, availableTools);

        switch (llmResponse.type) {
            case 'function_call':
                // LLM wants to call a function
                const functionResult = await this.agent.invokeTool(
                    llmResponse.functionName, 
                    llmResponse.arguments
                );

                // Send function result back to LLM for final response
                if (llmResponse.toolCallId) {
                    const finalResponse = await this.llmClient.handleFunctionResult(
                        llmResponse.toolCallId,
                        llmResponse.functionName,
                        functionResult
                    );
                    return finalResponse;
                } else {
                    // Format the result as a user-friendly message
                    return this.formatFunctionResult(llmResponse.functionName, functionResult);
                }

            case 'text':
                // Direct text response from LLM
                return { message: llmResponse.message };

            case 'error':
                return { message: llmResponse.message };

            default:
                return { message: "I'm not sure how to help with that. Please try asking about your accounts, balances, or transfers." };
        }

    } catch (error) {
        console.error("Error processing prompt with LLM:", error);
        return { message: "I encountered an error processing your request. Please try again." };
    }
}
```

**Responsibility**: Route between direct responses and function execution based on LLM decision.

---

## 6. Application Integration Layer

### Tool Execution → Fidelity App Logic

**Flow Step**: WebMCP tools call into the simulated Fidelity application logic.

**Code Implementation**:

```javascript
// fidelityApp.js - Application Logic
const mockAccountData = {
    "acc_brokerage_123": { id: "acc_brokerage_123", name: "Brokerage Account", balance: 15430.25, type: "taxable" },
    "acc_roth_456": { id: "acc_roth_456", name: "Roth IRA", balance: 89500.75, type: "retirement" },
    "acc_401k_789": { id: "acc_401k_789", name: "401(k) Rollover", balance: 245100.40, type: "retirement" },
    "acc_cash_101": { id: "acc_cash_101", name: "Cash Management", balance: 5200.00, type: "cash" },
};

const App = {
    // Renders the list of accounts on the main page
    renderAccountList: () => {
        const listEl = document.getElementById('accounts-list');
        listEl.innerHTML = '';
        for (const accountId in mockAccountData) {
            const account = mockAccountData[accountId];
            const itemEl = document.createElement('div');
            itemEl.className = 'account-item';
            itemEl.id = `account-${account.id}`;
            itemEl.innerHTML = `
                <span class="account-name">${account.name}</span>
                <span class="account-balance">$${account.balance.toFixed(2)}</span>
            `;
            listEl.appendChild(itemEl);
        }
    },

    // Simulates opening the fund transfer modal and pre-filling it
    showTransferModal: ({ from, to, amount }) => {
        const fromAccount = mockAccountData[from]?.name || 'N/A';
        const toAccount = mockAccountData[to]?.name || 'N/A';

        document.getElementById('fromAccount').value = fromAccount;
        document.getElementById('toAccount').value = toAccount;
        document.getElementById('amount').value = amount.toFixed(2);

        document.getElementById('portfolio-summary').style.display = 'none';
        document.getElementById('transfer-module').style.display = 'block';
    },

    // Highlights a specific account in the UI
    highlightAccount: (accountId) => {
        // Clear previous highlights
        document.querySelectorAll('.account-item.highlight').forEach(el => 
            el.classList.remove('highlight')
        );
        // Add new highlight
        const accountEl = document.getElementById(`account-${accountId}`);
        if (accountEl) {
            accountEl.classList.add('highlight');
        }
    },

    // Updates the performance chart UI
    updatePerformanceChart: (timePeriod) => {
        const chartEl = document.getElementById('chart-time-period');
        chartEl.textContent = `Time Period: ${timePeriod}`;
    }
};
```

**Separation of Concerns**: App logic handles UI updates while tools handle business logic and validation.

---

## 7. Security Layer

### Security Check → User Confirmation

**Flow Step**: Sensitive operations require explicit user confirmation before execution.

**Code Implementation**:

```javascript
// fidelityApp.js - Security Implementation
document.addEventListener('DOMContentLoaded', () => {
    App.renderAccountList();

    // Event listeners for the mock transfer modal
    document.getElementById('submit-transfer-btn').addEventListener('click', () => {
        App.displayAgentMessage("Transfer submitted successfully!");
        App.hideTransferModal();
    });
    
    document.getElementById('cancel-transfer-btn').addEventListener('click', () => {
        App.displayAgentMessage("Transfer canceled.");
        App.hideTransferModal();
    });
});
```

**HTML Security Form**:

```html
<!-- index.html - Transfer Confirmation UI -->
<div id="transfer-module" class="content-module" style="display: none;">
    <div id="transfer-form-container">
        <h2>Fund Transfer</h2>
        <form id="transfer-form">
            <label for="fromAccount">From:</label>
            <input type="text" id="fromAccount" name="fromAccount" readonly>
            <label for="toAccount">To:</label>
            <input type="text" id="toAccount" name="toAccount" readonly>
            <label for="amount">Amount ($):</label>
            <input type="text" id="amount" name="amount" readonly>
            <button type="button" id="submit-transfer-btn">Submit</button>
            <button type="button" id="cancel-transfer-btn">Cancel</button>
        </form>
    </div>
</div>
```

**Security Principle**: AI can prepare actions but cannot execute sensitive operations without explicit user consent.

---

## 8. Response Flow

### Final Response → User

**Flow Step**: Processed response is displayed to the user with updated UI state.

**Code Implementation**:

```javascript
// agentClient.js - Response Display
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

addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.textContent = text;
    this.chatHistory.appendChild(msgDiv);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
}
```

**User Experience**: Natural language responses with synchronized UI updates.

---

## Communication Patterns Summary

### 1. **Event-Driven Architecture**
- User interactions trigger events
- Each component responds to specific events
- Clean separation between UI and business logic

### 2. **Async/Await Pattern**
- All API calls use async/await for non-blocking execution
- Error handling at each level
- Graceful degradation on failures

### 3. **Configuration-Driven**
- Centralized configuration management
- Environment-specific settings
- Secure credential handling

### 4. **Tool Registration Pattern**
- WebMCP tools register capabilities dynamically
- LLM discovers tools at runtime
- Standardized tool interface (name, description, schema, execute)

### 5. **Security-First Design**
- Sensitive operations require user confirmation
- API keys managed securely
- Input validation at multiple levels
- Audit logging for all tool executions

---

## Key Architectural Benefits

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: New tools can be added without changing core logic
3. **Security**: Multi-layer validation and user confirmation requirements
4. **Maintainability**: Clear interfaces between components
5. **Testability**: Each component can be tested independently
6. **Scalability**: Architecture supports multiple LLM providers and tool types

This architectural pattern demonstrates how WebMCP can enable natural language interfaces while maintaining security, modularity, and professional software development practices.