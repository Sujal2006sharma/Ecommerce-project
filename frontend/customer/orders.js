"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["CUSTOMER", "ADMIN", "SUPERADMIN"]);
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

    const userName = user.full_name || user.username || user.email || "Customer";

    if (nameEl) nameEl.textContent = userName;
    if (roleEl) roleEl.textContent = user.role ? (user.role.name || user.role) : "Customer";
    if (avatarEl) avatarEl.textContent = userName.charAt(0).toUpperCase();
}

async function loadMyOrders(currentUser) {
    const container = document.getElementById("ordersContainer");
    if (!container) return;

    try {
        const response = await authFetch(`${API_URL}/orders`);
        if (!response || !response.ok) {
            container.innerHTML = `<p style="text-align: center; color: #64748b;">Failed to fetch orders.</p>`;
            return;
        }

        const orders = await response.json();
        const orderList = Array.isArray(orders) ? orders : (orders.data || []);

        if (!orderList || orderList.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 3rem; font-weight: 600;">No orders placed yet.</p>`;
            return;
        }

        container.innerHTML = orderList.map(order => {
            const customerName = order.user ? (order.user.full_name || order.user.username || order.user.email) : (currentUser.full_name || currentUser.username || currentUser.email || "Customer");
            const customerEmail = order.user ? order.user.email : currentUser.email;
            const address = order.shipping_address || "Standard Delivery Address";
            const orderDate = order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recently";
            const totalAmount = Number(order.total_price || order.total || 0).toLocaleString("en-IN");

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <h3 style="margin: 0; color: #0f172a; font-size: 1.15rem;">Order #${order.id}</h3>
                            <span style="font-size: 0.8rem; color: #64748b;">Placed on: ${orderDate}</span>
                        </div>
                        <span class="status-badge">
                            ${escapeHtml(order.status ? (order.status.name || order.status) : "PENDING")}
                        </span>
                    </div>

                    <!-- CUSTOMER & DELIVERY DETAILS -->
                    <div class="order-details-grid">
                        <div>
                            <strong style="color: #475569; display: block; font-size: 0.75rem; text-transform: uppercase;">Customer Details</strong>
                            <span style="color: #0f172a; font-weight: 700; display: block;">${escapeHtml(customerName)}</span>
                            <span style="color: #64748b; font-size: 0.8rem;">${escapeHtml(customerEmail)}</span>
                        </div>
                        <div>
                            <strong style="color: #475569; display: block; font-size: 0.75rem; text-transform: uppercase;">Delivery Address</strong>
                            <span style="color: #0f172a; font-weight: 600;">${escapeHtml(address)}</span>
                        </div>
                    </div>

                    <!-- ORDER ITEMS -->
                    <div style="margin-bottom: 1rem;">
                        ${(order.items || []).map(item => `
                            <div class="order-item-row">
                                <span>${escapeHtml(item.product ? item.product.name : (item.name || 'Product'))} × ${item.quantity}</span>
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