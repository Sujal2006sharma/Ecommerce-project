"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Safe case-insensitive role check to prevent "Unauthorized access!" popups
        const user = await protectPage([
            "CUSTOMER", "ADMIN", "SUPERADMIN", 
            "customer", "admin", "superadmin"
        ]);
        if (!user) return;

        displayUserProfile(user);
        await loadMyOrders(user);
    } catch (err) {
        console.error("ORDERS PAGE INITIALIZATION ERROR:", err);
    }
});

function displayUserProfile(user) {
    const nameEl = document.getElementById("navUserName");
    const roleEl = document.getElementById("navUserRole");
    const avatarEl = document.getElementById("profileAvatar");

    // Check local profile storage first, fallback to logged in user object
    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem("customer_profile_details") || "{}");
    } catch (e) {}

    const userName = savedProfile.name || user.full_name || user.username || user.name || user.email || "Customer";
    const userRole = (user && user.role) ? (user.role.name || user.role) : "CUSTOMER";

    if (nameEl) nameEl.textContent = userName;
    if (roleEl) roleEl.textContent = String(userRole).toUpperCase();
    if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
}

async function loadMyOrders(currentUser) {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    try {
        // Primary fetch attempt for customer orders
        let response = await authFetch(`${API_URL}/orders/user/my-orders`).catch(() => null);
        
        // Fallback endpoint if direct alias returns 404
        if (!response || !response.ok) {
            response = await authFetch(`${API_URL}/orders`).catch(() => null);
        }

        if (!response || !response.ok) {
            container.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 3rem;">Failed to load order history from server.</p>`;
            return;
        }

        const orders = await response.json();
        const orderList = Array.isArray(orders) ? orders : (orders.data || []);

        if (!orderList || orderList.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 3rem; font-weight: 600;">No orders placed yet.</p>`;
            return;
        }

        let savedProfile = {};
        try {
            savedProfile = JSON.parse(localStorage.getItem("customer_profile_details") || "{}");
        } catch (e) {}

        container.innerHTML = orderList.map(order => {
            const name = order.customer_name || savedProfile.name || (order.user ? (order.user.full_name || order.user.username) : currentUser.username || "Customer");
            const email = order.customer_email || savedProfile.email || (order.user ? order.user.email : currentUser.email || "");
            const phone = order.customer_phone || savedProfile.phone || "";
            const address = order.shipping_address || savedProfile.address || "Standard Delivery Address";
            
            const orderDate = order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recently";
            const totalAmount = Number(order.total_amount || order.total_price || order.total || 0).toLocaleString("en-IN");
            const statusName = order.status ? (order.status.name || order.status) : "PENDING";

            return `
                <div class="order-card" style="background: #ffffff; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem;">Order #${order.id}</h3>
                            <span style="font-size: 0.8rem; color: #64748b;">Placed on: ${orderDate}</span>
                        </div>
                        <span class="status-badge" style="background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">
                            ${escapeHtml(statusName)}
                        </span>
                    </div>

                    <!-- CUSTOMER & DELIVERY DETAILS -->
                    <div style="background: #f8fafc; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem; border: 1px solid #e2e8f0;">
                        <div>
                            <strong style="color: #475569; display: block; font-size: 0.75rem; text-transform: uppercase;">Customer Profile</strong>
                            <span style="color: #0f172a; font-weight: 700; display: block;">👤 ${escapeHtml(name)}</span>
                            <span style="color: #64748b; font-size: 0.8rem; display: block;">✉️ ${escapeHtml(email)}</span>
                            ${phone ? `<span style="color: #64748b; font-size: 0.8rem;">📞 ${escapeHtml(phone)}</span>` : ''}
                        </div>
                        <div>
                            <strong style="color: #475569; display: block; font-size: 0.75rem; text-transform: uppercase;">Delivery Address</strong>
                            <span style="color: #0f172a; font-weight: 600;">📍 ${escapeHtml(address)}</span>
                        </div>
                    </div>

                    <!-- ORDER ITEMS -->
                    <div style="margin-bottom: 1rem;">
                        ${(order.items || []).map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.95rem;">
                                <span>${escapeHtml(item.product_name || (item.product ? item.product.name : 'Product'))} × ${item.quantity}</span>
                                <strong style="color: #0f172a;">₹${Number((item.price || 0) * item.quantity).toLocaleString("en-IN")}</strong>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                        <span style="font-weight: 600; color: #475569;">Total Paid:</span>
                        <span style="font-size: 1.2rem; font-weight: 800; color: #2563eb;">₹${totalAmount}</span>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error("LOAD ORDERS ERROR:", err);
        container.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 3rem;">Error loading orders.</p>`;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}