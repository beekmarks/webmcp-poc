# WebMCP POC - LLM Integration Setup

This document explains how to set up the WebMCP POC with your LLM API credentials. **A valid API key is required for the POC to function.**

## Quick Setup

### 1. Choose Your LLM Provider

The POC supports multiple providers:
- **OpenAI** (GPT-4, GPT-3.5-turbo) - Recommended
- **Anthropic** (Claude) - Coming soon
- **Azure OpenAI** - Configurable

### 2. Get API Key

**For OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-...`)

**For Anthropic:**
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy the key

### 3. Configure the Application

Open `js/config.js` and update the configuration:

```javascript
const Config = {
    llm: {
        provider: 'openai',           // or 'anthropic'
        apiKey: 'YOUR_API_KEY_HERE',  // Paste your API key
        model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo'
        // ... other settings
    }
};
```

**⚠️ Security Warning:** 
- Never commit API keys to version control!
- Use environment variables or local config files in production
- The included API key placeholder should be replaced with your own key
- Consider using `.gitignore` to exclude config files with real keys

### 4. Test the Integration

1. Refresh your browser
2. Try natural language commands like:
   - "What's the balance in my Roth IRA?"
   - "Show me last year's performance"
   - "Transfer $2000 from my brokerage account to my Roth IRA"

## Development Mode

For testing without API costs:

```javascript
const Config = {
    development: {
        enableMockMode: true,  // Falls back to mock responses
        logRequests: true,     // Log API requests to console
        logResponses: true     // Log API responses to console
    }
};
```

## Supported LLM Features

### Function Calling
The LLM can automatically:
- Detect when to call WebMCP tools
- Extract parameters from natural language
- Handle multi-step workflows
- Provide conversational responses

### Available Tools
- `getAccountList` - List all accounts
- `getAccountBalance` - Get specific account balance
- `getPortfolioPerformance` - Show performance charts
- `initiateFundTransfer` - Prepare transfer forms (user must confirm)

## Error Handling

The system includes robust error handling:
- Network failures → Graceful error messages
- Invalid API keys → Clear error messages with setup instructions
- Rate limits → Retry logic (coming soon)
- Malformed responses → Error display with debugging information

**Note**: The POC requires a valid API key to function. Mock mode is available for development but not enabled by default.

## Monitoring & Debugging

### Console Logging
The POC includes comprehensive console logging to help you understand the complete technical flow:

```javascript
// Enable detailed logging in config.js
development: {
    logRequests: true,     // See OpenAI API requests
    logResponses: true,    // See OpenAI API responses
    enableMockMode: false  // Use real API calls
}
```

**Console Output Includes:**
- WebMCP tool registration and discovery
- LLM function calling decisions and parameters
- OpenAI API request/response cycles
- WebMCP tool execution results
- UI state changes and visual updates

### Performance Monitoring
Watch the console during interactions to see:
- API response times
- Tool execution duration
- UI update performance
- Error handling and recovery

## Customization

### Adding New Providers
1. Add provider config in `config.js`
2. Implement API client in `llmClient.js`
3. Add format conversion for that provider's function calling

### Modifying System Prompts
Edit the system message in `llmClient.js` → `callOpenAI()` function.

### Adding New Tools
1. Register tools in `webmcpProvider.js`
2. The LLM will automatically discover and use them

## Production Considerations

### Security
- Use environment variables for API keys
- Implement rate limiting
- Add user authentication
- Sanitize all inputs/outputs

### Performance
- Cache frequent responses
- Implement request batching
- Add response streaming for long responses

### Monitoring
- Track API usage and costs
- Log all function calls for audit
- Monitor response quality

## Troubleshooting

### "No API key configured"
- Check `config.js` has your API key set
- Or enable mock mode for testing

### "OpenAI API error: 401"
- Invalid API key
- Check key is correct and active

### "OpenAI API error: 429"
- Rate limit exceeded
- Wait and retry, or upgrade API plan

### Functions not being called
- Check tool definitions in `webmcpProvider.js`
- Verify LLM model supports function calling
- Enable request/response logging to debug

## Next Steps

1. **Add Authentication**: Secure the application with user login
2. **Real Data Integration**: Connect to actual Fidelity APIs
3. **Enhanced Security**: Add transaction confirmation flows
4. **Response Streaming**: Stream LLM responses for better UX
5. **Multi-turn Conversations**: Maintain conversation context
6. **Voice Integration**: Add speech-to-text for voice commands

## Cost Management

**Typical API costs:**
- GPT-3.5-turbo: ~$0.001 per request
- GPT-4: ~$0.01-0.03 per request

**Cost optimization:**
- Use GPT-3.5 for simple queries
- Implement response caching
- Set usage limits and monitoring