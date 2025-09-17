# WebMCP POC - Complete Architectural Flow

This diagram illustrates the complete end-to-end process of how the WebMCP (Web Model Context Protocol) Proof of Concept works, from user input to final response. 

**Note:** The system includes comprehensive console logging at every step, making it an excellent technical demonstration of the WebMCP workflow. Open your browser's Developer Console to see the complete technical narrative during interactions.

```mermaid
flowchart TD
    %% User Input Layer
    User[User] -->|Natural Language Input| ChatUI[Chat Interface]
    
    %% Agent Processing Layer
    ChatUI --> AgentClient[Agent Client]
    AgentClient -->|User Prompt| LLMClient[LLM Client]
    
    %% Configuration and Setup
    Config[Configuration] --> LLMClient
    
    %% LLM Processing
    LLMClient -->|API Request with Tools| OpenAI[OpenAI API GPT-4]
    
    %% Tool Discovery
    WebMCPProvider[WebMCP Provider] --> MockAgent[Mock Agent API]
    MockAgent -->|Available Tools| LLMClient
    
    %% Decision Processing
    OpenAI -->|Function Call Response| LLMClient
    LLMClient --> Decision{LLM Decision}
    
    Decision -->|Text Response| TextResponse[Direct Text Response]
    Decision -->|Function Call| FunctionCall[Function Call Request]
    
    %% Function Execution
    FunctionCall --> MockAgent
    MockAgent --> ToolExecution[Tool Execution]
    
    %% Available Tools
    ToolExecution --> Tool1[getAccountList]
    ToolExecution --> Tool2[getAccountBalance]
    ToolExecution --> Tool3[getPortfolioPerformance]
    ToolExecution --> Tool4[initiateFundTransfer]
    
    %% App Integration
    Tool1 --> FidelityApp[Fidelity App Logic]
    Tool2 --> FidelityApp
    Tool3 --> FidelityApp
    Tool4 --> FidelityApp
    
    %% UI Updates
    FidelityApp --> UIUpdate[UI Updates]
    
    %% Result Processing
    Tool1 --> ToolResult[Tool Result]
    Tool2 --> ToolResult
    Tool3 --> ToolResult
    Tool4 --> ToolResult
    ToolResult --> LLMClient
    
    %% Final Response
    TextResponse --> FinalResponse[Final Response]
    LLMClient -->|Follow-up Response| FinalResponse
    
    %% User Feedback
    FinalResponse --> ChatUI
    UIUpdate --> ChatUI
    ChatUI --> User
    
    %% Security Layer
    Tool4 --> Security[Security Check]
    Security --> UserConfirm[User Must Confirm]
    UserConfirm --> FidelityApp
    
    %% Styling
    classDef userLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef agentLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef llmLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef toolLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef appLayer fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    classDef securityLayer fill:#ffebee,stroke:#c62828,stroke-width:2px
    
    class User,ChatUI userLayer
    class AgentClient,MockAgent agentLayer
    class LLMClient,OpenAI,Config llmLayer
    class WebMCPProvider,ToolExecution,Tool1,Tool2,Tool3,Tool4,ToolResult toolLayer
    class FidelityApp,UIUpdate appLayer
    class Security,UserConfirm securityLayer
```