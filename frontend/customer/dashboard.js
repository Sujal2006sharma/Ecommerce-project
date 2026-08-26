"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let allProducts = [];
let allCategories = [];
let shoppingCart = [];

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["CUSTOMER", "ADMIN", "SUPERADMIN"]);
        if (!user) return;

        await loadStoreData();
    } catch (error) {
        console.error("CUSTOMER DASHBOARD ERROR:", error);
    }
});

// Load products and categories from FastAPI
async function loadStoreData() {
    try {
        const [pRes, cRes] = await Promise.all([
            authFetch(`${API_URL}/products`).catch(() => null),
            authFetch(`${API_URL}/categories`).catch(() => null)
        ]);

        const prodData = pRes && pRes.ok ? await pRes.json() : [];
        const catData = cRes && cRes.ok ? await cRes.json() : [];

        allProducts = Array.isArray(prodData) ? prodData : (prodData.data || []);
        allCategories = Array.isArray(catData) ? catData : (catData.data || []);

        renderCategoryPills();
        renderProductGrid(allProducts);
    } catch (err) {
        console.error("DATA FETCH ERROR:", err);
    }
}

// Render Category Filter Pills
function renderCategoryPills() {
    const container = document.getElementById("categoryPills");
    if (!container) return;

    let html = `<button class="pill-btn active" onclick="filterByCategory('ALL', this)">All Products</button>`;
    allCategories.forEach(cat => {
        html += `<button class="pill-btn" onclick="filterByCategory(${cat.id}, this)">${escapeHtml(cat.name)}</button>`;
    });

    container.innerHTML = html;
}

// Filter Products by Category
function filterByCategory(catId, btnEl) {
    document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
    btnEl.classList.add("active");

    if (catId === 'ALL') {
        renderProductGrid(allProducts);
    } else {
        const filtered = allProducts.filter(p => Number(p.category_id) === Number(catId));
        renderProductGrid(filtered);
    }
}

// Render Product Cards Grid
function renderProductGrid(products) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column: span 3; text-align: center; padding: 3rem; color: #6b7280;">No products available in this category.</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        // Fallback image if image_url is missing
        const imgUrl = p.image_url ? p.image_url : `../images/default-product.png`;
        const categoryName = p.category ? (p.category.name || p.category) : "General";
        const inStock = Number(p.quantity) > 0;

        return `
            <div class="product-card">
                <img src="${imgUrl}" class="product-image" alt="${escapeHtml(p.name)}" onerror="this.src='https://via.placeholder.com/250x180?text=Product'">
                <div class="product-info">
                    <span class="product-category">${escapeHtml(categoryName)}</span>
                    <h3 class="product-title">${escapeHtml(p.name)}</h3>
                    <div style="font-size: 0.85rem; color: ${inStock ? '#16a34a' : '#dc2626'}; font-weight: 600; margin-bottom: 0.5rem;">
                        ${inStock ? `In Stock (${p.quantity})` : 'Out of Stock'}
                    </div>
                    <div class="product-bottom">
                        <span class="product-price">₹${Number(p.price).toLocaleString("en-IN")}</span>
                        <button class="add-cart-btn" ${!inStock ? 'disabled' : ''} onclick="addToCart(${p.id})">
                            ${inStock ? '+ Add to Cart' : 'Sold Out'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Shopping Cart Functions
function addToCart(productId) {
    const product = allProducts.find(p => Number(p.id) === Number(productId));
    if (!product) return;

    const existing = shoppingCart.find(item => item.id === productId);
    if (existing) {
        if (existing.qty < product.quantity) {
            existing.qty++;
        } else {
            alert("Cannot add more than available stock limit!");
            return;
        }
    } else {
        shoppingCart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            qty: 1
        });
    }

    updateCartUI();
}

function removeFromCart(productId) {
    shoppingCart = shoppingCart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById("cartCount");
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    const totalCount = shoppingCart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = shoppingCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (cartCount) cartCount.textContent = totalCount;
    if (cartTotal) cartTotal.textContent = "₹" + totalPrice.toLocaleString("en-IN");

    if (!cartItems) return;

    if (shoppingCart.length === 0) {
        cartItems.innerHTML = `<p style="text-align: center; color: #6b7280; margin-top: 2rem;">Your cart is empty.</p>`;
        return;
    }

    cartItems.innerHTML = shoppingCart.map(item => `
        <div class="cart-item">
            <div>
                <strong style="color: #1f2937; display: block;">${escapeHtml(item.name)}</strong>
                <span style="color: #6b7280; font-size: 0.85rem;">₹${item.price} x ${item.qty}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #1f2937;">₹${(item.price * item.qty).toLocaleString("en-IN")}</span>
                <button onclick="removeFromCart(${item.id})" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">&times;</button>
            </div>
        </div>
    `).join("");
}

function toggleCart() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (drawer && overlay) {
        drawer.classList.toggle("open");
        overlay.classList.toggle("show");
    }
}

// Checkout & Submit Order to Backend API
async function checkoutOrder() {
    if (shoppingCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderPayload = {
        items: shoppingCart.map(item => ({
            product_id: item.id,
            quantity: item.qty
        }))
    };

    try {
        const response = await authFetch(`${API_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
        });

        if (response && response.ok) {
            alert("Order placed successfully!");
            shoppingCart = [];
            updateCartUI();
            toggleCart();
            await loadStoreData(); // Refresh product quantities
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.detail || "Failed to place order.");
        }
    } catch (err) {
        console.error("CHECKOUT ERROR:", err);
        alert("Network error. Could not complete order.");
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}