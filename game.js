// ==================== GAME CONFIG ====================
const CONFIG = {
    DIFFICULTY: {
        easy: { startMoney: 50000, speedMultiplier: 1.5 },
        normal: { startMoney: 25000, speedMultiplier: 1 },
        hard: { startMoney: 10000, speedMultiplier: 0.8 },
        extreme: { startMoney: 5000, speedMultiplier: 0.6 }
    },
    ASSETS: [
        { name: 'Bitcoin', symbol: 'BTC', emoji: '₿', basePrice: 45000 },
        { name: 'Ethereum', symbol: 'ETH', emoji: '🔷', basePrice: 2500 },
        { name: 'Cardano', symbol: 'ADA', emoji: '₳', basePrice: 0.50 },
        { name: 'Ripple', symbol: 'XRP', emoji: '✕', basePrice: 0.75 },
        { name: 'Litecoin', symbol: 'LTC', emoji: '◆', basePrice: 150 },
        { name: 'Polkadot', symbol: 'DOT', emoji: '⬤', basePrice: 25 },
        { name: 'Doge', symbol: 'DOGE', emoji: '🐕', basePrice: 0.25 },
        { name: 'Solana', symbol: 'SOL', emoji: '◉', basePrice: 140 }
    ],
    PROPERTIES: [
        { name: 'Apartamento Centro', type: 'apartment', price: 50000, income: 2500, emoji: '🏠' },
        { name: 'Casa Suburbana', type: 'house', price: 100000, income: 5000, emoji: '🏡' },
        { name: 'Oficina Comercial', type: 'office', price: 150000, income: 8000, emoji: '🏢' },
        { name: 'Local de Tienda', type: 'store', price: 80000, income: 4000, emoji: '🏬' },
        { name: 'Hotel Resort', type: 'hotel', price: 300000, income: 15000, emoji: '🏨' },
        { name: 'Nave Industrial', type: 'factory', price: 200000, income: 10000, emoji: '🏭' },
        { name: 'Edificio Residencial', type: 'building', price: 250000, income: 12000, emoji: '🏗️' },
        { name: 'Centro Comercial', type: 'mall', price: 400000, income: 20000, emoji: '🛍️' }
    ],
    BUSINESS: [
        { name: 'Oficina', icon: '💼', price: 10000, income: 500 },
        { name: 'Empleados', icon: '👥', price: 5000, income: 300 },
        { name: 'Servidor', icon: '🖥️', price: 15000, income: 800 },
        { name: 'Taller', icon: '🔧', price: 20000, income: 1000 },
        { name: 'Tienda Online', icon: '🛒', price: 8000, income: 400 },
        { name: 'Granja', icon: '🌾', price: 12000, income: 600 }
    ]
};

// ==================== GAME STATE ====================
let gameState = {
    playerName: 'Player',
    money: 25000,
    day: 1,
    gameSpeed: 1,
    isPaused: false,
    portfolio: {},
    properties: [],
    business: {},
    achievements: [],
    wealthHistory: [],
    settings: {
        sound: true,
        notifications: true
    }
};

let assetPrices = {};
let selectedAsset = null;
let selectedProperty = null;
let mapZoom = 1;
let propertyMap = null;
let mapCtx = null;

// ==================== INITIALIZATION ====================
function initGame() {
    setupEventListeners();
    loadDifficultySettings();
    document.getElementById('startBtn').addEventListener('click', startGame);
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.querySelector('.close-btn').addEventListener('click', closeSettings);
    document.getElementById('resetGameBtn').addEventListener('click', resetGame);

    // Trading Modal
    document.getElementById('tradeAmount').addEventListener('input', updateTradeTotal);

    // Map Controls
    document.getElementById('zoomInBtn').addEventListener('click', () => zoomMap(1.2));
    document.getElementById('zoomOutBtn').addEventListener('click', () => zoomMap(0.8));

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', setGameSpeed);
    });
}

function loadDifficultySettings() {
    const difficulty = document.getElementById('difficulty').value;
    const settings = CONFIG.DIFFICULTY[difficulty];
    gameState.money = settings.startMoney;
    gameState.startMoney = settings.startMoney;
    gameState.speedMultiplier = settings.speedMultiplier;
}

function startGame() {
    const playerName = document.getElementById('playerName').value || 'Player';
    gameState.playerName = playerName;
    loadDifficultySettings();

    // Initialize prices
    CONFIG.ASSETS.forEach(asset => {
        assetPrices[asset.symbol] = {
            price: asset.basePrice,
            history: [asset.basePrice],
            change24h: 0
        };
    });

    // Initialize portfolio
    CONFIG.ASSETS.forEach(asset => {
        gameState.portfolio[asset.symbol] = 0;
    });

    // Initialize business
    CONFIG.BUSINESS.forEach(b => {
        gameState.business[b.name] = 0;
    });

    gameState.wealthHistory = [gameState.money];

    // Switch screens
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    updateDisplay();
    startGameLoop();
}

// ==================== GAME LOOP ====================
function startGameLoop() {
    setInterval(() => {
        if (!gameState.isPaused) {
            updateGame();
        }
    }, 1000 / gameState.gameSpeed);
}

function updateGame() {
    gameState.day += gameState.gameSpeed * 0.016 / gameState.speedMultiplier;

    // Update prices
    updatePrices();

    // Update business income
    updateBusinessIncome();

    // Update property income
    updatePropertyIncome();

    // Update display
    updateDisplay();
}

function updatePrices() {
    CONFIG.ASSETS.forEach(asset => {
        const current = assetPrices[asset.symbol];
        const change = (Math.random() - 0.48) * current.price * 0.02;
        current.price = Math.max(current.price + change, 0.01);
        current.history.push(current.price);
        if (current.history.length > 100) current.history.shift();
        
        current.change24h = ((current.price - asset.basePrice) / asset.basePrice) * 100;
    });
}

function updateBusinessIncome() {
    Object.keys(gameState.business).forEach(business => {
        const count = gameState.business[business];
        if (count > 0) {
            const businessConfig = CONFIG.BUSINESS.find(b => b.name === business);
            gameState.money += (businessConfig.income * count * gameState.gameSpeed) / 1000;
        }
    });
}

function updatePropertyIncome() {
    gameState.properties.forEach(prop => {
        gameState.money += (prop.income * gameState.gameSpeed) / 1000;
    });
}

// ==================== DISPLAY UPDATES ====================
function updateDisplay() {
    updateNavbar();
    updateDashboard();
    updateMarket();
    updatePortfolio();
    updateProperties();
    updateBusiness();
    updateStats();
}

function updateNavbar() {
    document.getElementById('playerInfo').textContent = `${gameState.playerName} - Día ${Math.floor(gameState.day)}`;
    document.getElementById('money').textContent = `$${formatMoney(gameState.money)}`;
    document.getElementById('netWorth').textContent = `$${formatMoney(getNetWorth())}`;
    document.getElementById('gameTime').textContent = `Día ${Math.floor(gameState.day)}`;
}

function updateDashboard() {
    const netWorth = getNetWorth();
    document.getElementById('dashMoney').textContent = `$${formatMoney(gameState.money)}`;
    document.getElementById('dashAssets').textContent = `$${formatMoney(getPortfolioValue())}`;
    document.getElementById('dashProperties').textContent = `$${formatMoney(getPropertiesValue())}`;
    document.getElementById('dashTotal').textContent = `$${formatMoney(netWorth)}`;

    const prevNetWorth = gameState.wealthHistory[gameState.wealthHistory.length - 2] || netWorth;
    const profit = netWorth - prevNetWorth;
    const profitPercent = (profit / prevNetWorth) * 100;
    
    document.getElementById('profitValue').textContent = `${profit >= 0 ? '+' : ''}$${formatMoney(profit)}`;
    document.getElementById('profitValue').className = `profit-value ${profit >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('profitPercent').textContent = `${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`;
    document.getElementById('profitPercent').className = `profit-percent ${profitPercent >= 0 ? 'positive' : 'negative'}`;

    // Top Assets
    const topAssets = Object.entries(assetPrices)
        .sort((a, b) => b[1].change24h - a[1].change24h)
        .slice(0, 3);
    
    document.getElementById('topAssets').innerHTML = topAssets.map(([symbol, data]) => `
        <div class="asset-item">
            <span class="name">${symbol}</span>
            <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                ${data.change24h >= 0 ? '📈' : '📉'} ${data.change24h.toFixed(2)}%
            </span>
        </div>
    `).join('');

    // Update wealth history
    if (gameState.wealthHistory.length > 50) gameState.wealthHistory.shift();
    gameState.wealthHistory.push(netWorth);
}

function updateMarket() {
    const searchTerm = document.getElementById('searchAsset').value.toLowerCase();
    const filteredAssets = CONFIG.ASSETS.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.symbol.toLowerCase().includes(searchTerm)
    );

    document.getElementById('assetsGrid').innerHTML = filteredAssets.map(asset => {
        const data = assetPrices[asset.symbol];
        return `
            <div class="asset-card" onclick="selectAsset('${asset.symbol}')">
                <div class="asset-header">
                    <span class="asset-name">${asset.emoji} ${asset.name}</span>
                    <span class="asset-symbol">${asset.symbol}</span>
                </div>
                <div class="asset-price">$${data.price.toFixed(2)}</div>
                <div class="asset-change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                    ${data.change24h >= 0 ? '📈' : '📉'} ${data.change24h.toFixed(2)}%
                </div>
                <div style="font-size: 0.8rem; color: var(--gray);">
                    Tu saldo: ${gameState.portfolio[asset.symbol].toFixed(4)} ${asset.symbol}
                </div>
            </div>
        `;
    }).join('');
}

function updatePortfolio() {
    let hasAssets = false;
    const portfolioHTML = CONFIG.ASSETS.map(asset => {
        if (gameState.portfolio[asset.symbol] > 0) {
            hasAssets = true;
            const amount = gameState.portfolio[asset.symbol];
            const currentPrice = assetPrices[asset.symbol].price;
            const totalValue = amount * currentPrice;
            const costValue = amount * asset.basePrice;
            const profit = totalValue - costValue;
            const profitPercent = (profit / costValue) * 100;

            return `
                <div class="portfolio-item">
                    <div class="portfolio-header">
                        <span class="portfolio-name">${asset.emoji} ${asset.symbol}</span>
                        <span class="portfolio-value">$${formatMoney(totalValue)}</span>
                    </div>
                    <div class="portfolio-details">
                        <div class="portfolio-detail">
                            <span class="portfolio-detail-label">Cantidad</span>
                            <span class="portfolio-detail-value">${amount.toFixed(4)}</span>
                        </div>
                        <div class="portfolio-detail">
                            <span class="portfolio-detail-label">Precio Actual</span>
                            <span class="portfolio-detail-value">$${currentPrice.toFixed(2)}</span>
                        </div>
                        <div class="portfolio-detail">
                            <span class="portfolio-detail-label">Costo Total</span>
                            <span class="portfolio-detail-value">$${formatMoney(costValue)}</span>
                        </div>
                        <div class="portfolio-detail">
                            <span class="portfolio-detail-label ${profit >= 0 ? 'positive' : 'negative'}">Ganancia</span>
                            <span class="portfolio-detail-value ${profit >= 0 ? 'positive' : 'negative'}">
                                ${profit >= 0 ? '+' : ''}$${formatMoney(profit)} (${profitPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');

    document.getElementById('portfolioList').innerHTML = hasAssets ? portfolioHTML : 
        '<div style="text-align: center; color: var(--gray); padding: 40px;">No tienes activos. ¡Comienza a invertir!</div>';
}

function updateProperties() {
    if (gameState.properties.length === 0) {
        document.getElementById('propertiesList').innerHTML = 
            '<div style="text-align: center; color: var(--gray); padding: 40px;">No tienes propiedades aún.</div>';
    } else {
        document.getElementById('propertiesList').innerHTML = gameState.properties.map((prop, idx) => `
            <div class="property-item property-own" onclick="selectProperty(${idx})">
                <div class="property-name">${prop.emoji} ${prop.name}</div>
                <div class="property-type">${prop.type}</div>
                <div class="property-income">💰 Ingresos: +$${formatMoney(prop.income)}/mes</div>
                <button class="property-buy-btn" style="background: rgba(239, 68, 68, 0.2); color: var(--danger);">Vender</button>
            </div>
        `).join('');
    }

    // Dibujar mapa
    drawPropertyMap();
}

function updateBusiness() {
    const businessHTML = CONFIG.BUSINESS.map(business => {
        const count = gameState.business[business.name] || 0;
        return `
            <div class="business-item" onclick="buyBusiness('${business.name}')">
                <div class="business-icon">${business.icon}</div>
                <div class="business-name">${business.name}</div>
                <div class="business-price">$${formatMoney(business.price)}</div>
                <div class="business-income">Ingreso: $${business.income}/s</div>
                <div style="margin-top: 8px; color: var(--primary);">Tienes: ${count}</div>
            </div>
        `;
    }).join('');

    document.getElementById('businessItems').innerHTML = businessHTML;

    // Income list
    const incomeHTML = CONFIG.BUSINESS.map(business => {
        const count = gameState.business[business.name] || 0;
        if (count > 0) {
            return `
                <div class="income-item">
                    <span class="name">${business.icon} ${business.name}</span>
                    <span class="amount">+$${formatMoney(business.income * count)}/s</span>
                </div>
            `;
        }
        return '';
    }).join('') + gameState.properties.map(prop => `
        <div class="income-item">
            <span class="name">${prop.emoji} ${prop.name}</span>
            <span class="amount">+$${formatMoney(prop.income)}/mes</span>
        </div>
    `).join('');

    document.getElementById('businessIncomeList').innerHTML = incomeHTML || 
        '<div style="text-align: center; color: var(--gray);">Sin ingresos pasivos aún.</div>';
}

function updateStats() {
    const netWorth = getNetWorth();
    const totalSpent = gameState.startMoney - gameState.money + getPortfolioValue() + getPropertiesValue();
    
    document.getElementById('generalStats').innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Patrimonio Total</span>
            <span class="stat-value">$${formatMoney(netWorth)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Dinero en Efectivo</span>
            <span class="stat-value">$${formatMoney(gameState.money)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Valor en Activos</span>
            <span class="stat-value">$${formatMoney(getPortfolioValue())}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Valor en Propiedades</span>
            <span class="stat-value">$${formatMoney(getPropertiesValue())}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Día</span>
            <span class="stat-value">${Math.floor(gameState.day)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Invertido</span>
            <span class="stat-value">$${formatMoney(totalSpent)}</span>
        </div>
    `;

    document.getElementById('achievements').innerHTML = `
        <div class="achievement ${gameState.money > 0 ? 'unlocked' : ''}">
            <span class="achievement-icon">🎮</span>
            <div class="achievement-text">
                <div class="achievement-name">Primera Operación</div>
                <div class="achievement-desc">Realiza tu primer movimiento</div>
            </div>
        </div>
        <div class="achievement ${netWorth >= 1000000 ? 'unlocked' : ''}">
            <span class="achievement-icon">💎</span>
            <div class="achievement-text">
                <div class="achievement-name">Millonario</div>
                <div class="achievement-desc">Alcanza $1,000,000</div>
            </div>
        </div>
        <div class="achievement ${gameState.properties.length > 0 ? 'unlocked' : ''}">
            <span class="achievement-icon">🏢</span>
            <div class="achievement-text">
                <div class="achievement-name">Dueño de Propiedad</div>
                <div class="achievement-desc">Compra tu primera propiedad</div>
            </div>
        </div>
        <div class="achievement ${getPassiveIncome() > 0 ? 'unlocked' : ''}">
            <span class="achievement-icon">💰</span>
            <div class="achievement-text">
                <div class="achievement-name">Empresario</div>
                <div class="achievement-desc">Genera ingresos pasivos</div>
            </div>
        </div>
    `;
}

// ==================== TRADING FUNCTIONS ====================
function selectAsset(symbol) {
    selectedAsset = symbol;
    const asset = CONFIG.ASSETS.find(a => a.symbol === symbol);
    const data = assetPrices[symbol];

    document.getElementById('tradingAssetName').textContent = `${asset.emoji} ${asset.name}`;
    document.getElementById('currentPrice').textContent = `$${data.price.toFixed(2)}`;
    document.getElementById('change24h').textContent = `${data.change24h >= 0 ? '📈' : '📉'} ${data.change24h.toFixed(2)}%`;
    document.getElementById('assetBalance').textContent = `${gameState.portfolio[symbol].toFixed(4)} ${symbol}`;
    document.getElementById('tradeAmount').value = '';
    document.getElementById('tradeTotal').textContent = '$0.00';

    drawAssetChart(symbol);
    openModal('tradingModal');
}

function updateTradeTotal() {
    if (!selectedAsset) return;
    const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
    const price = assetPrices[selectedAsset].price;
    const total = amount * price;
    document.getElementById('tradeTotal').textContent = `$${total.toFixed(2)}`;
}

function buyAsset() {
    if (!selectedAsset) return;
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const price = assetPrices[selectedAsset].price;
    const total = amount * price;

    if (amount <= 0) {
        showNotification('Ingresa una cantidad válida', 'warning');
        return;
    }

    if (total > gameState.money) {
        showNotification('No tienes suficiente dinero', 'error');
        return;
    }

    gameState.money -= total;
    gameState.portfolio[selectedAsset] += amount;
    showNotification(`✅ Compraste ${amount.toFixed(4)} ${selectedAsset}`, 'success');
    document.getElementById('tradeAmount').value = '';
    updateTradeTotal();
    updateDisplay();
}

function sellAsset() {
    if (!selectedAsset) return;
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const balance = gameState.portfolio[selectedAsset];

    if (amount <= 0) {
        showNotification('Ingresa una cantidad válida', 'warning');
        return;
    }

    if (amount > balance) {
        showNotification('No tienes suficiente saldo', 'error');
        return;
    }

    const price = assetPrices[selectedAsset].price;
    const total = amount * price;

    gameState.money += total;
    gameState.portfolio[selectedAsset] -= amount;
    showNotification(`✅ Vendiste ${amount.toFixed(4)} ${selectedAsset}`, 'success');
    document.getElementById('tradeAmount').value = '';
    updateTradeTotal();
    updateDisplay();
}

document.getElementById('buyBtn').addEventListener('click', buyAsset);
document.getElementById('sellBtn').addEventListener('click', sellAsset);

// ==================== PROPERTY FUNCTIONS ====================
function drawPropertyMap() {
    const canvas = document.getElementById('propertyMap');
    if (!canvas) return;

    mapCtx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#f97316'];
    
    // Draw properties on map
    CONFIG.PROPERTIES.forEach((prop, idx) => {
        const x = (idx % 4) * (canvas.width / 4) + canvas.width / 8;
        const y = Math.floor(idx / 4) * (canvas.height / 2) + canvas.height / 4;
        
        const isOwned = gameState.properties.some(p => p.name === prop.name);
        
        // Draw circle
        mapCtx.fillStyle = isOwned ? colors[idx] : `${colors[idx]}40`;
        mapCtx.beginPath();
        mapCtx.arc(x, y, 30 * mapZoom, 0, Math.PI * 2);
        mapCtx.fill();
        
        // Draw border
        mapCtx.strokeStyle = isOwned ? colors[idx] : `${colors[idx]}80`;
        mapCtx.lineWidth = 2;
        mapCtx.stroke();
        
        // Draw emoji
        mapCtx.fillStyle = '#fff';
        mapCtx.font = `${20 * mapZoom}px Arial`;
        mapCtx.textAlign = 'center';
        mapCtx.textBaseline = 'middle';
        mapCtx.fillText(prop.emoji, x, y);
    });

    canvas.addEventListener('click', (e) => handleMapClick(e, canvas));
}

function handleMapClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    CONFIG.PROPERTIES.forEach((prop, idx) => {
        const px = (idx % 4) * (canvas.width / 4) + canvas.width / 8;
        const py = Math.floor(idx / 4) * (canvas.height / 2) + canvas.height / 4;
        const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        
        if (distance < 30 * mapZoom) {
            selectPropertyToView(idx);
        }
    });
}

function selectPropertyToView(idx) {
    const prop = CONFIG.PROPERTIES[idx];
    const isOwned = gameState.properties.some(p => p.name === prop.name);

    document.getElementById('propertyName').textContent = `${prop.emoji} ${prop.name}`;
    document.getElementById('propertyLocation').textContent = ['Centro', 'Suburbio', 'Zona Comercial', 'Periferia'][idx % 4];
    document.getElementById('propertyPrice').textContent = `$${formatMoney(prop.price)}`;
    document.getElementById('propertyIncome').textContent = `+$${formatMoney(prop.income)}/mes`;
    document.getElementById('propertyStatus').textContent = isOwned ? '✅ Tuya' : '❌ Disponible';

    const buyBtn = document.getElementById('buyPropertyBtn');
    const sellBtn = document.getElementById('sellPropertyBtn');

    if (isOwned) {
        buyBtn.style.display = 'none';
        sellBtn.style.display = 'block';
        sellBtn.onclick = () => sellProperty(idx);
    } else {
        buyBtn.style.display = 'block';
        sellBtn.style.display = 'none';
        buyBtn.onclick = () => buyProperty(idx);
    }

    openModal('propertyModal');
}

function selectProperty(idx) {
    const prop = gameState.properties[idx];
    document.getElementById('propertyName').textContent = `${prop.emoji} ${prop.name}`;
    document.getElementById('propertyPrice').textContent = `$${formatMoney(prop.price)}`;
    document.getElementById('propertyIncome').textContent = `+$${formatMoney(prop.income)}/mes`;
    document.getElementById('propertyStatus').textContent = '✅ Tuya';

    const buyBtn = document.getElementById('buyPropertyBtn');
    const sellBtn = document.getElementById('sellPropertyBtn');
    buyBtn.style.display = 'none';
    sellBtn.style.display = 'block';
    sellBtn.onclick = () => sellProperty(idx);

    openModal('propertyModal');
}

function buyProperty(idx) {
    const prop = CONFIG.PROPERTIES[idx];

    if (gameState.money < prop.price) {
        showNotification('No tienes suficiente dinero', 'error');
        return;
    }

    gameState.money -= prop.price;
    gameState.properties.push(prop);
    showNotification(`✅ Compraste ${prop.name}`, 'success');
    closeModal('propertyModal');
    updateDisplay();
}

function sellProperty(idx) {
    const prop = gameState.properties[idx];
    gameState.money += prop.price;
    gameState.properties.splice(idx, 1);
    showNotification(`✅ Vendiste ${prop.name}`, 'success');
    closeModal('propertyModal');
    updateDisplay();
}

function zoomMap(factor) {
    mapZoom *= factor;
    mapZoom = Math.max(0.5, Math.min(mapZoom, 2));
    drawPropertyMap();
}

document.getElementById('searchAsset').addEventListener('input', updateMarket);
document.getElementById('sortPropertiesBtn').addEventListener('click', () => {
    gameState.properties.sort((a, b) => b.income - a.income);
    updateProperties();
});

// ==================== BUSINESS FUNCTIONS ====================
function buyBusiness(businessName) {
    const business = CONFIG.BUSINESS.find(b => b.name === businessName);

    if (gameState.money < business.price) {
        showNotification('No tienes suficiente dinero', 'error');
        return;
    }

    gameState.money -= business.price;
    gameState.business[businessName] = (gameState.business[businessName] || 0) + 1;
    showNotification(`✅ Compraste ${businessName}`, 'success');
    updateDisplay();
}

// ==================== UTILITY FUNCTIONS ====================
function getNetWorth() {
    return gameState.money + getPortfolioValue() + getPropertiesValue();
}

function getPortfolioValue() {
    return Object.entries(gameState.portfolio).reduce((total, [symbol, amount]) => {
        return total + (amount * assetPrices[symbol].price);
    }, 0);
}

function getPropertiesValue() {
    return gameState.properties.reduce((total, prop) => total + prop.price, 0);
}

function getPassiveIncome() {
    const businessIncome = Object.entries(gameState.business).reduce((total, [name, count]) => {
        const business = CONFIG.BUSINESS.find(b => b.name === name);
        return total + (business.income * count);
    }, 0);

    const propertyIncome = gameState.properties.reduce((total, prop) => total + prop.income, 0);

    return businessIncome + propertyIncome;
}

function formatMoney(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(2) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(2) + 'K';
    return amount.toFixed(2);
}

// ==================== UI FUNCTIONS ====================
function switchTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function setGameSpeed(e) {
    const speed = parseFloat(e.target.dataset.speed);
    
    document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    if (speed === 0) {
        gameState.isPaused = true;
        gameState.gameSpeed = 1;
    } else {
        gameState.isPaused = false;
        gameState.gameSpeed = speed;
    }
}

document.getElementById('pauseBtn').addEventListener('click', function() {
    gameState.isPaused = !gameState.isPaused;
    this.classList.toggle('active');
});

function openSettings() {
    openModal('settingsModal');
}

function closeSettings() {
    closeModal('settingsModal');
}

function resetGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
        location.reload();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        modal.classList.remove('active');
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ==================== CHARTS ====================
function drawAssetChart(symbol) {
    const canvas = document.getElementById('assetChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = assetPrices[symbol].history;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    const range = maxPrice - minPrice || 1;

    // Draw line chart
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((price, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((price - minPrice) / range) * (height - 20) - 10;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Draw fill
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'info') {
    if (!gameState.settings.notifications) return;

    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type]}</span>
        <span class="notification-text">${message}</span>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== START GAME ====================
document.addEventListener('DOMContentLoaded', initGame);
