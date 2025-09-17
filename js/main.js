/**
 * main.js
 * -------
 * This is the entry point for the POC application.
 * 1. It creates a MOCK `window.agent` object to simulate the proposed browser API. This is
 * the key piece that allows the POC to be self-contained.
 * 2. It initializes the `AgentClient`, which powers the chat UI.
 * 3. It calls `registerFidelityTools()` to expose the frontend's capabilities via WebMCP.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [WebMCP Demo] Starting WebMCP Proof of Concept application');
    console.log('🚀 [WebMCP Demo] This demonstrates the W3C WebMCP specification for AI-web interaction');

    // --- 1. Mock WebMCP Browser API Implementation ---
    // In a real browser supporting WebMCP, this object would be provided natively.
    // For the POC, we simulate its behavior.
    console.log('🔧 [WebMCP Simulation] Creating mock WebMCP browser API (window.agent)');
    console.log('🔧 [WebMCP Simulation] In production, this would be provided by the browser natively');
    
    const mockAgentAPI = {
        tools: new Map(),

        // The function Fidelity's frontend will call to expose its tools.
        provideContext: function(context) {
            console.log("🔌 [WebMCP API] provideContext() called - website registering WebMCP tools");
            console.log("🔌 [WebMCP API] Tools being registered:", context.tools.map(t => t.name));
            console.log("🔌 [WebMCP API] This simulates the official WebMCP tool registration protocol");
            this.tools.clear(); // Clear old tools for simplicity
            context.tools.forEach(tool => {
                this.tools.set(tool.name, tool);
                console.log(`🔌 [WebMCP API] Registered tool: ${tool.name} - ${tool.description}`);
            });
            console.log("✅ [WebMCP API] All tools registered successfully in browser API");
        },

        // A helper function for the AgentClient to call a registered tool.
        // This simulates the browser invoking the tool's 'execute' function.
        invokeTool: async function(toolName, parameters) {
            console.log(`⚡ [WebMCP Execution] AI agent requesting tool execution: ${toolName}`);
            console.log(`⚡ [WebMCP Execution] Tool parameters:`, parameters);
            console.log(`⚡ [WebMCP Execution] This simulates browser-mediated tool execution`);
            
            if (this.tools.has(toolName)) {
                const tool = this.tools.get(toolName);
                console.log(`✅ [WebMCP Execution] Tool found, executing: ${toolName}`);
                try {
                    // Execute the tool's function and return the result
                    const result = await tool.execute(parameters);
                    console.log(`✅ [WebMCP Execution] Tool execution completed successfully:`, result);
                    return result;
                } catch (error) {
                    console.error(`❌ [WebMCP Execution] Error executing tool '${toolName}':`, error);
                    return { success: false, message: `An internal error occurred.` };
                }
            } else {
                console.error(`❌ [WebMCP Execution] Unknown tool requested: '${toolName}'`);
                console.error(`❌ [WebMCP Execution] Available tools:`, Array.from(this.tools.keys()));
                return { success: false, message: `Unknown action.` };
            }
        }
    };

    // Attach the mock API to the window object.
    console.log('🔧 [WebMCP Simulation] Attaching mock WebMCP API to window.agent');
    window.agent = mockAgentAPI;


    // --- 2. Initialize the AI Agent Client ---
    // The AgentClient is the UI the user interacts with. It's passed the mockAgentAPI
    // so it knows how to invoke the tools.
    console.log('🤖 [Agent Client] Initializing AI Agent Client with WebMCP API');
    console.log('🤖 [Agent Client] This provides the chat interface for human-AI interaction');
    new AgentClient(mockAgentAPI);
    console.log('✅ [Agent Client] AI Agent Client initialized successfully');


    // --- 3. Register Fidelity's WebMCP Tools ---
    // This call simulates the Fidelity.com frontend application making its
    // functionality available to the agent.
    console.log('🏦 [Fidelity Integration] Registering Fidelity financial tools with WebMCP');
    console.log('🏦 [Fidelity Integration] This simulates how real websites would expose functionality');
    registerFidelityTools();
    console.log('✅ [Fidelity Integration] Fidelity tools registration completed');

    console.log("🎉 [WebMCP Demo] WebMCP Proof of Concept fully initialized and ready!");
    console.log("🎉 [WebMCP Demo] Try asking: 'What's my Roth IRA balance?' or 'Show me 3-year performance'");
    console.log("🎉 [WebMCP Demo] Watch the console for detailed technical flow during interactions");

});