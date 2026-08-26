"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["SUPERADMIN", "superadmin"]);
        if (!user) return;

        await loadSuperadminOrders();
    } catch (err) {
        console.error("SUPERADMIN ORDERS LOAD ERROR:", err);
    }
});

async function loadSuperadminOrders() {
    const tbody = document.getElementById("ordersTableBody") || document.getElementById("ordersList") || document.querySelector("tbody");
    if (!tbody) return;

    try {
        let response = await authFetch(`${API_URL}/orders/admin/all`).catch(() => null);
        if (!response || !response.ok) {
            response = await authFetch(`${API_URL}/orders`).catch(() => null);
        }

        if (!response || !response.ok) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 2rem;">Failed to load order history.</td></tr>`;
            return;
        }

        const orders = await response.json();
        const orderList = Array.isArray(orders) ? orders : (orders.data || []);

        if (orderList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">No orders found.</td></tr>`;
            return;
        }

        const totalOrdersCount = orderList.length;

        tbody.innerHTML = orderList.map((order, index) => {
            // Calculate sequential order number (e.g., #3 instead of skipped DB ID #4)
            const sequentialId = totalOrdersCount - index;

            const name = order.customer_name || (order.user ? (order.user.full_name || order.user.username) : "Customer");
            const email = order.customer_email || (order.user ? order.user.email : "");
            const phone = order.customer_phone ? ` | 📞 ${order.customer_phone}` : "";
            const address = order.shipping_address ? `<br><small style="color: #64748b;">📍 ${escapeHtml(order.shipping_address)}</small>` : "";

            const dateStr = order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recent";
            const total = Number(order.total_amount || order.total_price || order.total || 0).toLocaleString("en-IN");
            const statusName = order.status ? (order.status.name || order.status) : "PENDING";

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px; font-weight: 700; color: #0f172a;">#${sequentialId}</td>
                    <td style="padding: 12px;">
                        <strong style="color: #0f172a; display: block;">${escapeHtml(name)}</strong>
                        <span style="font-size: 0.8rem; color: #64748b;">${escapeHtml(email)}${escapeHtml(phone)}</span>
                        ${address}
                    </td>
                    <td style="padding: 12px; font-weight: 700; color: #2563eb;">₹${total}</td>
                    <td style="padding: 12px;">
                        <span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">
                            ${escapeHtml(statusName)}
                        </span>
                    </td>
                    <td style="padding: 12px; font-size: 0.85rem; color: #64748b;">${dateStr}</td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("SUPERADMIN LOAD ORDERS ERROR:", err);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 2rem;">Error populating orders list.</td></tr>`;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}