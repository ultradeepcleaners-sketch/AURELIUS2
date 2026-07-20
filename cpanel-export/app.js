// Aurelius Atelier - Static Products Catalog Loader
// Pulls product listings dynamically from products.json and updates live prices

document.addEventListener("DOMContentLoaded", () => {
    const productsGrid = document.getElementById("products-grid");
    const currencySelect = document.getElementById("currency-select");

    // Dynamic state
    let currentCurrency = localStorage.getItem("aurelius_static_currency") || "USD";
    let productsData = [];
    let exchangeRates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.78,
        JPY: 155.0,
        CAD: 1.36,
        AUD: 1.50
    };

    // Initialize dropdown selector values
    if (currencySelect) {
        currencySelect.value = currentCurrency;
        currencySelect.addEventListener("change", (e) => {
            currentCurrency = e.target.value;
            localStorage.setItem("aurelius_static_currency", currentCurrency);
            renderCatalog(productsData);
        });
    }

    // Fetch products catalog and live exchange rates concurrently
    Promise.all([
        fetchProducts(),
        fetchExchangeRates()
    ])
    .then(([products]) => {
        productsData = products || [];
        renderCatalog(productsData);
    })
    .catch(error => {
        console.error("Failed to fully synchronize catalog or currency:", error);
        if (productsGrid && productsData.length === 0) {
            productsGrid.innerHTML = `
                <div class="loading-placeholder" style="color: #ea580c; border-color: rgba(234, 88, 12, 0.3)">
                    Vault Synchronization Interrupted.<br>
                    <span style="font-size: 11px; font-family: monospace; color: #a1a1aa; display: block; margin-top: 10px;">
                        Details: Verify products.json matches exact array formatting structure.
                    </span>
                </div>
            `;
        }
    });

    function fetchProducts() {
        return fetch("products.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Ledger request returned failure status.");
                }
                return response.json();
            });
    }

    function fetchExchangeRates() {
        return fetch("https://open.er-api.com/v6/latest/USD")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Currency rate feed unavailable.");
            })
            .then(data => {
                if (data && data.rates) {
                    exchangeRates = {
                        USD: 1.0,
                        EUR: data.rates.EUR || 0.92,
                        GBP: data.rates.GBP || 0.78,
                        JPY: data.rates.JPY || 155.0,
                        CAD: data.rates.CAD || 1.36,
                        AUD: data.rates.AUD || 1.50
                    };
                    console.log("Static Catalog - Live Exchange rates synchronized:", exchangeRates);
                }
            })
            .catch(err => {
                console.warn("Using default cached high-fidelity exchange rates:", err);
            });
    }

    function formatPrice(usdPrice, currency) {
        const rate = exchangeRates[currency] || 1.0;
        const converted = usdPrice * rate;
        const symbols = {
            USD: "$",
            EUR: "€",
            GBP: "£",
            JPY: "¥",
            CAD: "CA$",
            AUD: "A$"
        };
        const symbol = symbols[currency] || "$";
        const displayVal = Number.isInteger(converted) ? converted.toFixed(0) : converted.toFixed(2);
        return `${symbol}${displayVal}`;
    }

    function renderCatalog(products) {
        if (!productsGrid) return;
        
        if (!products || products.length === 0) {
            productsGrid.innerHTML = `
                <div class="loading-placeholder">
                    The leather master inventory vault is currently empty.
                </div>
            `;
            return;
        }

        // Clean out loading messages
        productsGrid.innerHTML = "";

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "product-card";

            // Support both full local URLs or external references
            const imageSource = product.imageUrl || product.image_path || product.image || "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=600&q=80";
            const category = product.category || "Heritage Item";
            const subcat = product.subcategory || "Exclusive Craft";

            card.innerHTML = `
                <div class="product-img-wrap">
                    <img src="${imageSource}" alt="${product.title || product.name}" class="product-img" loading="lazy">
                    <span class="product-badge">${subcat}</span>
                </div>
                <div class="product-info">
                    <div class="product-category">${category}</div>
                    <h3 class="product-name">${product.title || product.name}</h3>
                    <p class="product-desc">${product.description || "Individually selected full-grain hide, hand-molded and processed for lifetime endurance and beautiful aging."}</p>
                    <div class="product-footer">
                        <span class="product-price">${formatPrice(parseFloat(product.price), currentCurrency)}</span>
                        <button class="acquire-btn" onclick="alert('Masterpiece Acquisition: Please contact the corporate representative to process custom hand-tailored leatherwork for: ${product.title || product.name}')">
                            Acquire
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }
});
