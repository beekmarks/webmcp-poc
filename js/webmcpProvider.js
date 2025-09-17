/**
 * webmcpProvider.js
 * -----------------
 * This file is responsible for defining the WebMCP tools and providing them to the agent.
 * It uses the `window.agent.provideContext` API to register a set of functions that the
 * AI agent can discover and execute. The `execute` functions for each tool call into the
 * simulated application logic in `fidelityApp.js`.
 */

// As described in the research report, this function registers the tools available
// to the agent when the user is in a logged-in state.
function registerFidelityTools() {
    console.log('🔧 [WebMCP Provider] Starting WebMCP tool registration process...');
    console.log('🔧 [WebMCP Provider] This demonstrates the W3C WebMCP specification for AI-web interaction');
    
    if (window.agent && typeof window.agent.provideContext === 'function') {
        console.log('✅ [WebMCP Provider] WebMCP browser API detected - proceeding with tool registration');
        console.log('🔧 [WebMCP Provider] Registering 4 financial tools: getAccountList, getAccountBalance, getPortfolioPerformance, initiateFundTransfer');
        window.agent.provideContext({
            tools: [
                // Tool 1: Get a list of all accounts
                {
                    name: "getAccountList",
                    description: "Retrieves a list of all the user's available accounts, including their names and unique IDs.",
                    inputSchema: { type: "object", properties: {} },
                    async execute() {
                        console.log("🏦 [WebMCP Tool: getAccountList] Tool execution initiated by AI agent");
                        console.log("🏦 [WebMCP Tool: getAccountList] Retrieving all user accounts from mock database");
                        console.log("🏦 [WebMCP Tool: getAccountList] Found accounts:", Object.values(mockAccountData).map(acc => `${acc.name} ($${acc.balance})`));
                        const result = { success: true, accounts: Object.values(mockAccountData) };
                        console.log("✅ [WebMCP Tool: getAccountList] Returning account data to AI agent:", result);
                        return result;
                    }
                },
                // Tool 2: Get the balance for a specific account
                {
                    name: "getAccountBalance",
                    description: "Gets the current total market value for a specific account identified by its name or type (e.g., 'Roth IRA', 'Brokerage').",
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
                        console.log(`💰 [WebMCP Tool: getAccountBalance] Tool execution initiated for account: "${accountIdentifier}"`);
                        console.log(`💰 [WebMCP Tool: getAccountBalance] This demonstrates secure account querying via WebMCP`);
                        console.log(`💰 [WebMCP Tool: getAccountBalance] Available accounts in database:`, Object.values(mockAccountData).map(acc => acc.name));
                        
                        const lowerIdentifier = accountIdentifier.toLowerCase();
                        console.log(`💰 [WebMCP Tool: getAccountBalance] Performing fuzzy search for: "${lowerIdentifier}"`);
                        
                        const account = Object.values(mockAccountData).find(acc => {
                            const match = acc.name.toLowerCase().includes(lowerIdentifier);
                            console.log(`💰 [WebMCP Tool: getAccountBalance] Checking "${acc.name.toLowerCase()}" contains "${lowerIdentifier}": ${match}`);
                            return match;
                        });

                        if (account) {
                            console.log(`✅ [WebMCP Tool: getAccountBalance] Account found:`, account);
                            console.log(`🎯 [WebMCP Tool: getAccountBalance] Triggering UI highlight for account ID: ${account.id}`);
                            App.highlightAccount(account.id);
                            const result = { success: true, accountName: account.name, balance: account.balance };
                            console.log(`💰 [WebMCP Tool: getAccountBalance] Returning account data to AI:`, result);
                            return result;
                        }
                        console.log(`❌ [WebMCP Tool: getAccountBalance] No matching account found for: "${accountIdentifier}"`);
                        return { success: false, message: `Account '${accountIdentifier}' not found.` };
                    }
                },
                // Tool 3: Get portfolio performance
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
                        console.log(`📈 [WebMCP Tool: getPortfolioPerformance] Tool execution initiated for time period: "${timePeriod}"`);
                        console.log(`📈 [WebMCP Tool: getPortfolioPerformance] This demonstrates real-time UI manipulation via WebMCP`);
                        console.log(`📈 [WebMCP Tool: getPortfolioPerformance] Calling Fidelity app to update performance chart display`);
                        // This tool interacts directly with the UI components on the page.
                        App.updatePerformanceChart(timePeriod);
                        const result = { success: true, message: `Portfolio performance chart is now showing data for '${timePeriod}'.` };
                        console.log(`✅ [WebMCP Tool: getPortfolioPerformance] Chart updated successfully, returning to AI:`, result);
                        return result;
                    }
                },
                // Tool 4: Initiate a fund transfer (Requires User Confirmation)
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
                        console.log(`🏧 [WebMCP Tool: initiateFundTransfer] Tool execution initiated for transfer request`);
                        console.log(`🏧 [WebMCP Tool: initiateFundTransfer] Transfer details - From: "${fromAccount}", To: "${toAccount}", Amount: $${amount}`);
                        console.log(`🏧 [WebMCP Tool: initiateFundTransfer] This demonstrates WebMCP's human-in-the-loop security model`);
                        console.log(`🏧 [WebMCP Tool: initiateFundTransfer] Available accounts for transfer:`, Object.values(mockAccountData).map(acc => acc.name));
                        
                        const lowerFromAccount = fromAccount.toLowerCase();
                        const lowerToAccount = toAccount.toLowerCase();
                        
                        console.log(`🔍 [WebMCP Tool: initiateFundTransfer] Searching for accounts containing: "${lowerFromAccount}" and "${lowerToAccount}"`);
                        
                        const fromAcc = Object.values(mockAccountData).find(acc => {
                            const match = acc.name.toLowerCase().includes(lowerFromAccount);
                            console.log(`🔍 [WebMCP Tool: initiateFundTransfer] Source account check: "${acc.name.toLowerCase()}" includes "${lowerFromAccount}": ${match}`);
                            return match;
                        });
                        
                        const toAcc = Object.values(mockAccountData).find(acc => {
                            const match = acc.name.toLowerCase().includes(lowerToAccount);
                            console.log(`🔍 [WebMCP Tool: initiateFundTransfer] Destination account check: "${acc.name.toLowerCase()}" includes "${lowerToAccount}": ${match}`);
                            return match;
                        });

                        console.log(`🏧 [WebMCP Tool: initiateFundTransfer] Account resolution results - From:`, fromAcc, `To:`, toAcc);

                        if (!fromAcc || !toAcc) {
                            const message = `Account(s) not found. From: ${fromAccount} ${fromAcc ? '✓' : '✗'}, To: ${toAccount} ${toAcc ? '✓' : '✗'}`;
                            console.error(`❌ [WebMCP Tool: initiateFundTransfer] ${message}`);
                            return { success: false, message };
                        }

                        console.log(`🔒 [WebMCP Tool: initiateFundTransfer] Accounts validated - preparing transfer modal (human confirmation required)`);
                        console.log(`🔒 [WebMCP Tool: initiateFundTransfer] WebMCP security: Tool only prepares action, user must approve`);
                        console.log(`🎯 [WebMCP Tool: initiateFundTransfer] Calling App.showTransferModal with validated IDs:`, { from: fromAcc.id, to: toAcc.id, amount });
                        
                        // As per security best practices (Chapter 7), the tool only prepares the action.
                        // It calls the app logic to show and pre-fill the form. The user must manually submit.
                        App.showTransferModal({ from: fromAcc.id, to: toAcc.id, amount });

                        const result = { success: true, message: "I've prepared the transfer for you. Please review and click 'Submit' to complete it." };
                        console.log(`✅ [WebMCP Tool: initiateFundTransfer] Transfer modal prepared, returning to AI:`, result);
                        return result;
                    }
                }
            ]
        });
        console.log('✅ [WebMCP Provider] All 4 WebMCP tools successfully registered with browser API');
        console.log('✅ [WebMCP Provider] AI agents can now discover and execute these financial operations');
        console.log('🔧 [WebMCP Provider] WebMCP tool registration complete - system ready for AI interaction');
    } else {
        console.error("❌ [WebMCP Provider] WebMCP browser API not available - tools cannot be registered");
        console.error("❌ [WebMCP Provider] This indicates the WebMCP simulation layer is not loaded");
    }
}