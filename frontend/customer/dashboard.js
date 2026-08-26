"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let allProducts = [];
let allCategories = [];
let shoppingCart = [];
let currentUserObj = null;
let customerProfile = {
    name: "",
    email: "",
    phone: "",
    address: ""
};

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["CUSTOMER", "ADMIN", "SUPERADMIN", "customer", "admin", "superadmin"]);
        if (!user) return;

        currentUserObj = user;
        initUserProfile(user);
        await loadStoreData();
    } catch (error) {
        console.error("CUSTOMER DASHBOARD ERROR:", error);
    }
});

function initUserProfile(user) {
    const savedProfile = localStorage.getItem("customer_profile_details");
    if (savedProfile) {
        try {
            customerProfile = JSON.parse(savedProfile);
        } catch (e) {
            console.error("Failed to parse local profile data", e);
        }
    }

    if (!customerProfile.name) customerProfile.name = user.full_name || user.username || user.name || "Customer";
    if (!customerProfile.email) customerProfile.email = user.email || "";

    updateNavProfileUI();
}

function updateNavProfileUI() {
    const nameEl = document.getElementById("navUserName");
    const roleEl = document.getElementById("navUserRole");
    const avatarEl = document.getElementById("profileAvatar");

    const displayName = customerProfile.name || "Customer";
    const userRole = (currentUserObj && currentUserObj.role) ? (currentUserObj.role.name || currentUserObj.role) : "CUSTOMER";

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = String(userRole).toUpperCase();
    if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();
}

function openProfileModal() {
    document.getElementById("profName").value = customerProfile.name || "";
    document.getElementById("profEmail").value = customerProfile.email || "";
    document.getElementById("profPhone").value = customerProfile.phone || "";
    document.getElementById("profAddress").value = customerProfile.address || "";

    document.querySelectorAll("#profileModal .error-msg").forEach(el => el.style.display = "none");

    document.getElementById("profileModal")?.classList.add("show");
    document.getElementById("cartOverlay")?.classList.add("show");
}

function closeProfileModal() {
    document.getElementById("profileModal")?.classList.remove("show");
    if (!document.getElementById("cartDrawer")?.classList.contains("open")) {
        document.getElementById("cartOverlay")?.classList.remove("show");
    }
}

function closeAllModals() {
    document.getElementById("cartDrawer")?.classList.remove("open");
    document.getElementById("profileModal")?.classList.remove("show");
    document.getElementById("cartOverlay")?.classList.remove("show");
}

function saveProfileDetails(event) {
    event.preventDefault();

    const name = document.getElementById("profName").value.trim();
    const email = document.getElementById("profEmail").value.trim();
    const phone = document.getElementById("profPhone").value.trim();
    const address = document.getElementById("profAddress").value.trim();

    // STRICT VALIDATION RULES
    let isValid = true;
    
    // String-only regex for Name (letters and spaces only)
    const nameRegex = /^[a-zA-Z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    document.querySelectorAll("#profileModal .error-msg").forEach(el => el.style.display = "none");

    // 1. Name String Validation
    if (name.length < 2 || !nameRegex.test(name)) {
        const nameErrEl = document.getElementById("profNameErr");
        if (nameErrEl) {
            nameErrEl.textContent = "Name must contain letters only (no numbers or special characters).";
            nameErrEl.style.display = "block";
        }
        isValid = false;
    }

    // 2. Email Validation
    if (!emailRegex.test(email)) {
        const emailErrEl = document.getElementById("profEmailErr");
        if (emailErrEl) emailErrEl.style.display = "block";
        isValid = false;
    }

    // 3. Phone Validation
    if (!phoneRegex.test(phone)) {
        const phoneErrEl = document.getElementById("profPhoneErr");
        if (phoneErrEl) phoneErrEl.style.display = "block";
        isValid = false;
    }

    // 4. Address Validation
    if (address.length < 10) {
        const addrErrEl = document.getElementById("profAddressErr");
        if (addrErrEl) addrErrEl.style.display = "block";
        isValid = false;
    }

    if (!isValid) return;

    customerProfile = { name, email, phone, address };
    localStorage.setItem("customer_profile_details", JSON.stringify(customerProfile));

    updateNavProfileUI();
    closeProfileModal();
    alert("Profile details updated successfully!");
}

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
        images.push("/frontend/images/laptop-1.jpg", "/frontend/images/laptop-2.jpg", "/frontend/images/laptop-3.jpg", "/frontend/images/laptop-4.jpg", "/frontend/images/laptop-5.jpg");
    } else if (nameLower.includes("shirt") || nameLower.includes("t-shirt")) {
        images.push("/frontend/images/T-Shirt-1.jpg", "/frontend/images/T-Shirt-3.jpg", "/frontend/images/T-Shirt-4.jpg");
    } else if (nameLower.includes("burger")) {
        images.push("/frontend/images/Burger.jpg");
    }

    return [...new Set(images)];
}

function switchProductImage(productId, newSrc, thumbEl) {
    const mainImg = document.getElementById(`main-img-${productId}`);
    if (mainImg) mainImg.src = newSrc;

    const card = thumbEl.closest('.product-card');
    if (card) {
        card.querySelectorAll('.thumbnail-img').forEach(t => t.classList.remove('active'));
        thumbEl.classList.add('active');
    }
}

function handleImageError(imgEl, fallbackPath) {
    if (imgEl.getAttribute("data-tried-fallback")) return;
    imgEl.setAttribute("data-tried-fallback", "true");
    imgEl.src = fallbackPath;
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

        const thumbnailsHtml = imagesList.length > 1 ? `
            <div class="product-thumbnails">
                ${imagesList.map((img, idx) => {
                    const relativeFallback = img.startsWith('/frontend/') ? img.replace('/frontend/', '../') : img;
                    return `
                        <img src="${img}" 
                             class="thumbnail-img ${idx === 0 ? 'active' : ''}" 
                             onclick="switchProductImage(${p.id}, '${img}', this)"
                             onerror="handleImageError(this, '${relativeFallback}')">
                    `;
                }).join('')}
            </div>
        ` : '';

        const mainRelativeFallback = mainImgUrl.startsWith('/frontend/') ? mainImgUrl.replace('/frontend/', '../') : mainImgUrl;

        return `
            <div class="product-card">
                <div class="product-image-container">
                    ${mainImgUrl ? `
                        <img id="main-img-${p.id}" 
                             src="${mainImgUrl}" 
                             class="product-image" 
                             alt="${escapeHtml(p.name)}"
                             onerror="handleImageError(this, '${mainRelativeFallback}')">
                    ` : `
                        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-weight:600;">No Image</div>
                    `}
                    <span class="stock-tag ${inStock ? 'in-stock' : 'out-stock'}">
                        ${inStock ? `In Stock (${p.quantity})` : 'Sold Out'}
                    </span>
                </div>
                ${thumbnailsHtml}
                <div class="product-info">
                    <span class="product-category">${escapeHtml(categoryName)}</span>
                    <h3 class="product-title">${escapeHtml(p.name)}</h3>
                    <div class="product-bottom">
                        <span class="product-price">₹${Number(p.price).toLocaleString("en-IN")}</span>
                        <button class="add-cart-btn" ${!inStock ? 'disabled' : ''} onclick="addToCart(${p.id})">
                            ${inStock ? '+ Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
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
            alert("Maximum available stock limit reached!");
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
        cartItems.innerHTML = `<p style="text-align: center; color: #64748b; margin-top: 3rem; font-size: 0.95rem;">Your cart is empty.</p>`;
        return;
    }

    cartItems.innerHTML = shoppingCart.map(item => `
        <div class="cart-item">
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
    if (shoppingCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Force load latest saved profile details from localStorage
    const saved = localStorage.getItem("customer_profile_details");
    if (saved) {
        try { customerProfile = JSON.parse(saved); } catch (e) {}
    }

    if (!customerProfile.name || !customerProfile.phone || !customerProfile.address) {
        alert("Please complete your profile details (Name, Phone & Address) first.");
        openProfileModal();
        return;
    }

    const orderPayload = {
        customer_name: customerProfile.name,
        customer_email: customerProfile.email,
        customer_phone: customerProfile.phone,
        shipping_address: customerProfile.address,
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
            closeAllModals();
            await loadStoreData();
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