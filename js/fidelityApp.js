/**
 * fidelityApp.js
 * -----------------
 * This file simulates the core logic and state management of the Fidelity.com frontend application.
 * In a real-world scenario, this would be a complex system managing API calls, UI state, etc.
 * For this POC, it provides mock data and functions for our WebMCP tools to interact with.
 */

// Mock database of user accounts
const mockAccountData = {
    "acc_brokerage_123": { id: "acc_brokerage_123", name: "Brokerage Account", balance: 15430.25, type: "taxable" },
    "acc_roth_456": { id: "acc_roth_456", name: "Roth IRA", balance: 89500.75, type: "retirement" },
    "acc_401k_789": { id: "acc_401k_789", name: "401(k) Rollover", balance: 245100.40, type: "retirement" },
    "acc_cash_101": { id: "acc_cash_101", name: "Cash Management", balance: 5200.00, type: "cash" },
};

// Simulated Application Logic Namespace
const App = {
    // Renders the list of accounts on the main page
    renderAccountList: () => {
        console.log('🏦 [Fidelity App] Rendering account list UI component');
        console.log('🏦 [Fidelity App] This simulates a real Fidelity.com dashboard with mock account data');
        const listEl = document.getElementById('accounts-list');
        listEl.innerHTML = '';
        
        console.log('🏦 [Fidelity App] Processing accounts from mock database:', Object.keys(mockAccountData).length, 'accounts');
        for (const accountId in mockAccountData) {
            const account = mockAccountData[accountId];
            console.log(`🏦 [Fidelity App] Rendering account: ${account.name} ($${account.balance})`);
            const itemEl = document.createElement('div');
            itemEl.className = 'account-item';
            itemEl.id = `account-${account.id}`;
            itemEl.innerHTML = `
                <span class="account-name">${account.name}</span>
                <span class="account-balance">$${account.balance.toFixed(2)}</span>
            `;
            listEl.appendChild(itemEl);
        }
        console.log('✅ [Fidelity App] Account list rendering complete');
    },

    // Simulates opening the fund transfer modal and pre-filling it
    showTransferModal: ({ from, to, amount }) => {
        console.log(`showTransferModal called with:`, { from, to, amount });
        console.log(`Available accounts:`, mockAccountData);
        
        const fromAccount = mockAccountData[from]?.name || 'N/A';
        const toAccount = mockAccountData[to]?.name || 'N/A';
        
        console.log(`Resolved accounts - From: ${fromAccount}, To: ${toAccount}`);

        const fromInput = document.getElementById('fromAccount');
        const toInput = document.getElementById('toAccount');
        const amountInput = document.getElementById('amount');
        const portfolioSummary = document.getElementById('portfolio-summary');
        const transferModule = document.getElementById('transfer-module');
        
        console.log(`DOM elements found:`, {
            fromInput: !!fromInput,
            toInput: !!toInput,
            amountInput: !!amountInput,
            portfolioSummary: !!portfolioSummary,
            transferModule: !!transferModule
        });

        if (fromInput) fromInput.value = fromAccount;
        if (toInput) toInput.value = toAccount;
        if (amountInput) amountInput.value = amount.toFixed(2);

        if (portfolioSummary) portfolioSummary.style.display = 'none';
        if (transferModule) {
            transferModule.style.display = 'block';
            console.log(`Transfer modal should now be visible`);
            
            // Scroll the modal into view with offset for fixed header
            setTimeout(() => {
                const headerHeight = 80; // Account for fixed header
                const elementTop = transferModule.offsetTop - headerHeight;
                window.scrollTo({
                    top: elementTop,
                    behavior: 'smooth'
                });
            }, 100); // Small delay to ensure the element is visible first
        } else {
            console.error('Transfer module element not found!');
        }
    },

    // Hides the transfer modal
    hideTransferModal: () => {
        document.getElementById('transfer-module').style.display = 'none';
        document.getElementById('portfolio-summary').style.display = 'block';
    },

    // Updates the UI to show a message from the agent
    displayAgentMessage: (message) => {
        console.log('💬 [Fidelity App] Displaying agent message in chat UI:', message);
        console.log('💬 [Fidelity App] This simulates app-initiated messages to the user');
        const chatHistory = document.getElementById('ai-chat-history');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message agent-message';
        msgDiv.textContent = message;
        chatHistory.appendChild(msgDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
        console.log('✅ [Fidelity App] Agent message displayed and chat scrolled');
    },

    // Highlights a specific account in the UI
    highlightAccount: (accountId) => {
        console.log(`Attempting to highlight account: ${accountId}`);
        
        // Clear previous highlights
        document.querySelectorAll('.account-item.highlight').forEach(el => {
            el.classList.remove('highlight');
            console.log(`Removed highlight from: ${el.id}`);
        });
        
        // Add new highlight
        const elementId = `account-${accountId}`;
        const accountEl = document.getElementById(elementId);
        console.log(`Looking for element with ID: ${elementId}`);
        console.log(`Found element:`, accountEl);
        
        if (accountEl) {
            accountEl.classList.add('highlight');
            console.log(`Successfully highlighted account: ${accountId}`);
            
            // Scroll the highlighted account into view
            accountEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Auto-remove highlight after 5 seconds
            setTimeout(() => {
                accountEl.classList.remove('highlight');
                console.log(`Removed highlight from ${accountId} after 5 seconds`);
            }, 5000);
        } else {
            console.error(`Could not find account element with ID: ${elementId}`);
            // List all account elements for debugging
            const allAccountElements = document.querySelectorAll('.account-item');
            console.log('Available account elements:', Array.from(allAccountElements).map(el => el.id));
        }
    },

    // Updates the performance chart UI
    updatePerformanceChart: (timePeriod) => {
        console.log(`📈 [Fidelity App] Starting portfolio performance chart update for: ${timePeriod}`);
        console.log(`📈 [Fidelity App] This demonstrates real-time UI manipulation via WebMCP tools`);
        
        // Update time period text
        const chartEl = document.getElementById('chart-time-period');
        chartEl.textContent = `Time Period: ${timePeriod}`;
        console.log(`📈 [Fidelity App] Updated chart time period display`);
        
        // Activate the chart area
        const chartContainer = document.getElementById('performance-chart');
        chartContainer.classList.add('active');
        console.log(`📈 [Fidelity App] Activated chart container with enhanced styling`);
        
        // Mock performance data based on time period
        const performanceData = {
            'YTD': { 
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                values: [8.2, 12.5, 9.8, 15.3, 11.7, 12.5],
                totalReturn: '+12.5%',
                portfolioValue: '$355,231'
            },
            '1 Year': { 
                months: ['Q1', 'Q2', 'Q3', 'Q4'],
                values: [15.5, 18.2, 22.1, 19.8],
                totalReturn: '+19.8%',
                portfolioValue: '$355,231'
            },
            '3 Year': { 
                months: ['2022', '2023', '2024'],
                values: [35.2, 42.1, 48.5],
                totalReturn: '+48.5%',
                portfolioValue: '$355,231'
            },
            '5 Year': { 
                months: ['2020', '2021', '2022', '2023', '2024'],
                values: [22.3, 28.7, 35.2, 42.1, 48.5],
                totalReturn: '+48.5%',
                portfolioValue: '$355,231'
            }
        };
        
        const data = performanceData[timePeriod] || performanceData['YTD'];
        
        // Generate chart bars
        console.log(`📈 [Fidelity App] Generating animated chart bars for ${timePeriod} data`);
        const chartBars = document.getElementById('chart-bars');
        chartBars.innerHTML = '';
        
        const maxValue = Math.max(...data.values);
        console.log(`📈 [Fidelity App] Chart data - Periods: ${data.months.join(', ')}, Max value: ${maxValue}%`);
        data.months.forEach((month, index) => {
            const barHeight = (data.values[index] / maxValue) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.setProperty('--bar-height', `${barHeight}px`);
            bar.style.height = `${barHeight}px`;
            bar.setAttribute('data-value', `${data.values[index]}%`);
            bar.title = `${month}: ${data.values[index]}%`;
            chartBars.appendChild(bar);
        });
        console.log(`📈 [Fidelity App] Created ${data.months.length} animated chart bars`);
        
        // Update performance summary
        console.log(`📈 [Fidelity App] Updating performance metrics - Return: ${data.totalReturn}, Value: ${data.portfolioValue}`);
        document.getElementById('total-return').textContent = data.totalReturn;
        document.getElementById('portfolio-value').textContent = data.portfolioValue;
        
        // Scroll chart into view
        console.log(`📈 [Fidelity App] Scrolling chart into user viewport`);
        chartContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide active state after 10 seconds
        setTimeout(() => {
            chartContainer.classList.remove('active');
            console.log(`📈 [Fidelity App] Auto-removed chart highlight after 10 seconds`);
        }, 10000);
        
        console.log(`✅ [Fidelity App] Performance chart update completed successfully for ${timePeriod}`);
    }
};

// Initial render on page load
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