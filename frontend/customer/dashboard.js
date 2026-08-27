"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let allProducts = [];
let allCategories = [];
let shoppingCart = [];
let currentUserObj = null;

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try { currentUserObj = JSON.parse(savedUser); } catch (e) {}
        }

        updateHeaderUI();
        await loadStoreData();
    } catch (error) {
        console.error("DASHBOARD INIT ERROR:", error);
    }
});

function updateHeaderUI() {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const isLoggedIn = Boolean(token);

    const nameEl = document.getElementById("badgeName");
    const roleEl = document.getElementById("badgeRole");
    const avatarEl = document.getElementById("badgeAvatar");

    if (isLoggedIn && currentUserObj) {
        const name = currentUserObj.full_name || currentUserObj.username || "Customer";
        if (nameEl) nameEl.textContent = name;
        if (roleEl) roleEl.textContent = "CUSTOMER";
        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    } else {
        if (nameEl) nameEl.textContent = "Guest";
        if (roleEl) roleEl.textContent = "GUEST";
        if (avatarEl) avatarEl.textContent = "G";
    }
}

async function loadStoreData() {
    const grid = document.getElementById("productGrid");
    try {
        const [pRes, cRes] = await Promise.all([
            fetch(`${API_URL}/products`).catch(() => null),
            fetch(`${API_URL}/categories`).catch(() => null)
        ]);

        const prodData = (pRes && pRes.ok) ? await pRes.json() : [];
        const catData = (cRes && cRes.ok) ? await cRes.json() : [];

        allProducts = Array.isArray(prodData) ? prodData : (prodData.data || []);
        allCategories = Array.isArray(catData) ? catData : (catData.data || []);

        renderCategoryPills();
        renderProductGrid(allProducts);
    } catch (err) {
        console.error("LOAD STORE DATA ERROR:", err);
        if (grid) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #ef4444;">Failed to load products.</div>`;
        }
    }
}

function renderCategoryPills() {
    const container = document.getElementById("categoryPills");
    if (!container) return;

    let html = `<button class="pill-btn active" onclick="filterByCategory('ALL', this)" style="padding: 8px 18px; border-radius: 20px; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; background: #3b82f6; color: #ffffff;">All Products</button>`;
    
    allCategories.forEach(cat => {
        html += `<button class="pill-btn" onclick="filterByCategory(${cat.id}, this)" style="padding: 8px 18px; border-radius: 20px; border: 1px solid #e2e8f0; font-weight: 600; font-size: 0.85rem; cursor: pointer; background: #ffffff; color: #475569; margin-left: 6px;">${escapeHtml(cat.name)}</button>`;
    });

    container.innerHTML = html;
}

function filterByCategory(catId, btnEl) {
    document.querySelectorAll("#categoryPills .pill-btn").forEach(b => {
        b.style.background = "#ffffff";
        b.style.color = "#475569";
        b.style.border = "1px solid #e2e8f0";
    });

    btnEl.style.background = "#3b82f6";
    btnEl.style.color = "#ffffff";
    btnEl.style.border = "none";

    if (catId === 'ALL') {
        renderProductGrid(allProducts);
    } else {
        const filtered = allProducts.filter(p => Number(p.category_id) === Number(catId));
        renderProductGrid(filtered);
    }
}

function getProductImagesList(product) {
    const images = [];
    if (product.image_url && product.image_url.trim() !== "") {
        images.push(product.image_url.trim());
    }

    const nameLower = (product.name || "").toLowerCase();
    if (nameLower.includes("laptop")) {
        images.push("/frontend/images/laptop-1.jpg");
    } else if (nameLower.includes("shirt") || nameLower.includes("t-shirt")) {
        images.push("/frontend/images/T-Shirt-1.jpg");
    } else if (nameLower.includes("burger")) {
        images.push("/frontend/images/Burger.jpg");
    }

    return [...new Set(images)];
}

function renderProductGrid(products) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #64748b;">No products available.</div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const imagesList = getProductImagesList(p);
        const mainImgUrl = imagesList.length > 0 ? imagesList[0] : "";
        const categoryName = p.category ? (p.category.name || p.category) : "GENERAL";
        const inStock = Number(p.quantity) > 0;

        return `
            <div class="product-card" style="background: #ffffff; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;">
                <div>
                    <div style="position: relative; width: 100%; height: 180px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
                        ${mainImgUrl ? `
                            <img src="${mainImgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${escapeHtml(p.name)}">
                        ` : `
                            <div style="color: #94a3b8; font-weight: 600;">No Image</div>
                        `}
                        <span style="position: absolute; top: 10px; left: 10px; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; background: ${inStock ? '#dcfce7' : '#fee2e2'}; color: ${inStock ? '#15803d' : '#dc2626'};">
                            ${inStock ? `In Stock (${p.quantity})` : 'Sold Out'}
                        </span>
                    </div>
                    <span style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">${escapeHtml(categoryName)}</span>
                    <h3 style="font-size: 1rem; color: #0f172a; margin: 4px 0 10px 0; font-weight: 700;">${escapeHtml(p.name)}</h3>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 12px;">₹${Number(p.price).toLocaleString("en-IN")}</div>
                </div>

                <button ${!inStock ? 'disabled' : ''} onclick="addToCart(${p.id})" style="width: 100%; background: ${inStock ? '#ffc107' : '#e2e8f0'}; color: #000000; border: none; padding: 10px; border-radius: 20px; font-weight: 700; cursor: ${inStock ? 'pointer' : 'not-allowed'}; font-size: 0.9rem;">
                    ${inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        `;
    }).join("");
}

function addToCart(productId) {
    const product = allProducts.find(p => Number(p.id) === Number(productId));
    if (!product) return;

    const existing = shoppingCart.find(item => item.id === productId);
    if (existing) {
        if (existing.qty < product.quantity) {
            existing.qty++;
        } else {
            alert("Maximum stock limit reached!");
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
        cartItems.innerHTML = `<p style="text-align: center; color: #64748b; margin-top: 3rem;">Your cart is empty.</p>`;
        return;
    }

    cartItems.innerHTML = shoppingCart.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
            <div>
                <strong style="color: #0f172a; display: block; font-size: 0.95rem;">${escapeHtml(item.name)}</strong>
                <span style="color: #64748b; font-size: 0.85rem;">₹${item.price} × ${item.qty}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 700; color: #0f172a;">₹${(item.price * item.qty).toLocaleString("en-IN")}</span>
                <button onclick="removeFromCart(${item.id})" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: bold;">&times;</button>
            </div>
        </div>
    `).join("");
}

function toggleCart() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (drawer && overlay) {
        drawer.style.right = drawer.style.right === "0px" ? "-400px" : "0px";
        overlay.style.display = overlay.style.display === "block" ? "none" : "block";
    }
}

function closeAllModals() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    const modal = document.getElementById("loginRequiredModal");

    if (drawer) drawer.style.right = "-400px";
    if (overlay) overlay.style.display = "none";
    if (modal) modal.style.display = "none";
}

function handleCheckoutClick() {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");

    if (!token) {
        document.getElementById("loginRequiredModal").style.display = "flex";
        return;
    }

    if (shoppingCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    processOrder();
}

function closeLoginModal() {
    document.getElementById("loginRequiredModal").style.display = "none";
}

function handleMyOrdersClick(e) {
    e.preventDefault();
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) {
        document.getElementById("loginRequiredModal").style.display = "flex";
    } else {
        window.location.href = "/frontend/customer/orders.html";
    }
}

function handleAuthAction() {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token) {
        localStorage.clear();
        window.location.reload();
    } else {
        window.location.href = "/frontend/auth/login.html";
    }
}

async function processOrder() {
    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem("customer_profile_details") || "{}");
    } catch(e) {}

    const orderPayload = {
        customer_name: savedProfile.name || currentUserObj.username || "Customer",
        customer_email: savedProfile.email || currentUserObj.email || "",
        customer_phone: savedProfile.phone || "",
        shipping_address: savedProfile.address || "",
        items: shoppingCart.map(item => ({ product_id: item.id, quantity: item.qty }))
    };

    try {
        const fetchFunc = typeof authFetch === "function" ? authFetch : fetch;
        const response = await fetchFunc(`${API_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
        });

        if (response && response.ok) {
            alert("Order placed successfully!");
            shoppingCart = [];
            updateCartUI();
            closeAllModals();
            await loadStoreData();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.detail || "Failed to place order.");
        }
    } catch (err) {
        console.error("ORDER ERROR:", err);
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}