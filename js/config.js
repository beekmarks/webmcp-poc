/**
 * config.js
 * ---------
 * Configuration for LLM API integration
 */

const Config = {
    // LLM Provider Settings
    llm: {
        // Choose your provider: 'openai', 'anthropic', 'azure', or 'custom'
        provider: 'openai',
        
        // API Configuration
        apiKey: 'sk-your-api-key-here', // Add your OpenAI API key here
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo', 'claude-3-sonnet', etc.
        
        // Request settings
        maxTokens: 1500,
        temperature: 0.1, // Lower temperature for more consistent function calling
        
        // Function calling settings
        functionCalling: true
    },

    // Alternative providers
    providers: {
        openai: {
            baseUrl: 'https://api.openai.com/v1',
            chatEndpoint: '/chat/completions',
            models: {
                'gpt-4': 'gpt-4-turbo-preview',
                'gpt-3.5': 'gpt-3.5-turbo'
            }
        },
        anthropic: {
            baseUrl: 'https://api.anthropic.com/v1',
            chatEndpoint: '/messages',
            models: {
                'claude-3': 'claude-3-sonnet-20240229'
            }
        },
        azure: {
            baseUrl: '', // Your Azure OpenAI endpoint
            chatEndpoint: '/openai/deployments/{deployment-name}/chat/completions',
            apiVersion: '2023-12-01-preview'
        }
    },

    // Development settings
    development: {
        enableMockMode: false, // Set to true to fall back to mock behavior
        logRequests: true,
        logResponses: true
    }
};

// Helper to get API key from environment or prompt user
Config.getApiKey = function() {
    if (this.llm.apiKey) {
        return this.llm.apiKey;
    }
    
    // In development, you could prompt for the key
    if (this.development.enableMockMode) {
        console.warn('Mock mode enabled - no API key required');
        return 'mock-key';
    }
    
    throw new Error('API key not configured. Please set Config.llm.apiKey or enable mock mode.');
};

// Export for use in other files
window.Config = Config;