"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let allProducts = [];
let allCategories = [];
let shoppingCart = [];
let currentUserObj = null;
let customerProfile = { name: "", email: "", phone: "", address: "" };

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try { currentUserObj = JSON.parse(savedUser); } catch (e) {}
        }

        initUserProfile();
        await loadStoreData();
    } catch (error) {
        console.error("STOREFRONT INIT ERROR:", error);
    }
});

function initUserProfile() {
    const savedProfile = localStorage.getItem("customer_profile_details");
    if (savedProfile) {
        try { customerProfile = JSON.parse(savedProfile); } catch (e) {}
    }

    if (currentUserObj) {
        if (!customerProfile.name) customerProfile.name = currentUserObj.full_name || currentUserObj.username || currentUserObj.name || "Customer";
        if (!customerProfile.email) customerProfile.email = currentUserObj.email || "";
    }
}

async function loadStoreData() {
    const grid = document.getElementById("productGrid");
    try {
        // Safe fetch handler for guests and authenticated users
        const customFetch = async (url) => {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");
            const headers = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            
            return await fetch(url, { headers });
        };

        const [pRes, cRes] = await Promise.all([
            customFetch(`${API_URL}/products`).catch(() => null),
            customFetch(`${API_URL}/categories`).catch(() => null)
        ]);

        const prodData = (pRes && pRes.ok) ? await pRes.json() : [];
        const catData = (cRes && cRes.ok) ? await cRes.json() : [];

        allProducts = Array.isArray(prodData) ? prodData : (prodData.data || []);
        allCategories = Array.isArray(catData) ? catData : (catData.data || []);

        renderCategoryPills();
        renderProductGrid(allProducts);
    } catch (err) {
        console.error("DATA FETCH ERROR:", err);
        if (grid) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #ef4444;">Failed to load products. Make sure backend is running.</div>`;
        }
    }
}

function renderCategoryPills() {
    const container = document.getElementById("categoryPills");
    if (!container) return;

    let html = `<button class="pill-btn active" onclick="filterByCategory('ALL', this)">All Products</button>`;
    allCategories.forEach(cat => {
        html += `<button class="pill-btn" onclick="filterByCategory(${cat.id}, this)">${escapeHtml(cat.name)}</button>`;
    });

    container.innerHTML = html;
}

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

function getProductImagesList(product) {
    const images = [];
    if (product.image_url && product.image_url.trim() !== "") {
        images.push(product.image_url.trim());
    }

    const nameLower = (product.name || "").toLowerCase();
    if (nameLower.includes("laptop")) {
        images.push("/frontend/images/laptop-1.jpg", "/frontend/images/laptop-2.jpg");
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
        const categoryName = p.category ? (p.category.name || p.category) : "General";
        const inStock = Number(p.quantity) > 0;

        return `
            <div class="product-card" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div>
                    <div class="product-image-container" style="position: relative; width: 100%; height: 200px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
                        ${mainImgUrl ? `
                            <img src="${mainImgUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${escapeHtml(p.name)}">
                        ` : `
                            <div style="color: #94a3b8; font-weight: 600;">No Image</div>
                        `}
                        <span style="position: absolute; top: 8px; left: 8px; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 12px; background: ${inStock ? '#dcfce7' : '#fee2e2'}; color: ${inStock ? '#15803d' : '#dc2626'};">
                            ${inStock ? `In Stock (${p.quantity})` : 'Sold Out'}
                        </span>
                    </div>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">${escapeHtml(categoryName)}</span>
                    <h3 style="font-size: 1.05rem; color: #0f172a; margin: 4px 0 12px 0;">${escapeHtml(p.name)}</h3>
                </div>

                <div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 10px;">₹${Number(p.price).toLocaleString("en-IN")}</div>
                    <button ${!inStock ? 'disabled' : ''} onclick="addToCart(${p.id})" style="width: 100%; background: ${inStock ? '#ffd814' : '#e2e8f0'}; color: #111; border: 1px solid ${inStock ? '#fcd200' : '#cbd5e1'}; padding: 10px; border-radius: 20px; font-weight: 700; cursor: ${inStock ? 'pointer' : 'not-allowed'}; font-size: 0.9rem;">
                        ${inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
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
        drawer.classList.toggle("open");
        overlay.classList.toggle("show");
    }
}

async function checkoutOrder() {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) {
        alert("Please log in to complete your purchase.");
        window.location.href = "/frontend/auth/login.html";
        return;
    }

    if (shoppingCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderPayload = {
        customer_name: customerProfile.name || "Customer",
        customer_email: customerProfile.email || "",
        customer_phone: customerProfile.phone || "",
        shipping_address: customerProfile.address || "",
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
            toggleCart();
            await loadStoreData();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.detail || "Failed to place order.");
        }
    } catch (err) {
        console.error("CHECKOUT ERROR:", err);
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}