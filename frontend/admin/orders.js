"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["ADMIN", "SUPERADMIN", "admin", "superadmin"]);
        if (!user) return;

        await loadAdminOrders();
    } catch (err) {
        console.error("ADMIN ORDERS LOAD ERROR:", err);
    }
});

async function loadAdminOrders() {
    const tbody = document.getElementById("ordersTableBody") || document.getElementById("ordersList") || document.querySelector("tbody");
    if (!tbody) return;

    try {
        let response = await authFetch(`${API_URL}/orders/admin/all`).catch(() => null);
        if (!response || !response.ok) {
            response = await authFetch(`${API_URL}/orders`).catch(() => null);
        }

        if (!response || !response.ok) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">Failed to fetch orders from server.</td></tr>`;
            return;
        }

        const orders = await response.json();
        const orderList = Array.isArray(orders) ? orders : (orders.data || []);

        if (orderList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">No customer orders placed yet.</td></tr>`;
            return;
        }

        let savedProfile = {};
        try {
            savedProfile = JSON.parse(localStorage.getItem("customer_profile_details") || "{}");
        } catch (e) {}

        const totalOrdersCount = orderList.length;

        tbody.innerHTML = orderList.map((order, index) => {
            const sequentialId = totalOrdersCount - index;

            // Resolve real customer profile details
            const name = order.customer_name || savedProfile.name || (order.user ? (order.user.full_name || order.user.username) : "Customer");
            const email = order.customer_email || savedProfile.email || (order.user ? order.user.email : "");
            const phone = order.customer_phone || savedProfile.phone || "";
            const address = order.shipping_address || savedProfile.address || "";

            const dateStr = order.created_at ? new Date(order.created_at).toLocaleString("en-IN") : "Recent";
            const total = Number(order.total_amount || order.total_price || order.total || 0).toLocaleString("en-IN");
            const currentStatus = order.status ? (order.status.name || order.status) : "PENDING";
            const currentStatusId = order.status_id || 1;

            const itemsSummary = (order.items || []).map(i => `${escapeHtml(i.product_name || (i.product ? i.product.name : 'Item'))} (x${i.quantity})`).join(", ") || "No Items";

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px; font-weight: 700; color: #0f172a;">#${sequentialId}</td>
                    <td style="padding: 12px;">
                        <strong style="color: #0f172a; display: block;">${escapeHtml(name)}</strong>
                        <span style="font-size: 0.8rem; color: #64748b;">${escapeHtml(email)}${phone ? ' | 📞 ' + escapeHtml(phone) : ''}</span>
                        ${address ? `<br><small style="color: #64748b;">📍 ${escapeHtml(address)}</small>` : ''}
                    </td>
                    <td style="padding: 12px; font-weight: 700; color: #2563eb;">₹${total}</td>
                    <td style="padding: 12px; font-size: 0.85rem; color: #334155;">${itemsSummary}</td>
                    <td style="padding: 12px;">
                        <span style="background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;">
                            ${escapeHtml(currentStatus)}
                        </span>
                    </td>
                    <td style="padding: 12px; font-size: 0.85rem; color: #64748b;">${dateStr}</td>
                    <td style="padding: 12px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select onchange="changeOrderStatus(${order.id}, this.value)" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.82rem; font-weight: 600; color: #334155; cursor: pointer;">
                                <option value="" disabled selected>Status</option>
                                <option value="1" ${currentStatusId == 1 ? 'selected' : ''}>Order accepted</option>
                                <option value="2" ${currentStatusId == 2 ? 'selected' : ''}>Out for delivery</option>
                                <option value="3" ${currentStatusId == 3 ? 'selected' : ''}>Delivered</option>
                                <option value="4" ${currentStatusId == 4 ? 'selected' : ''}>Cancelled</option>
                            </select>
                            <button onclick="deleteAdminOrder(${order.id})" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: background 0.2s;" title="Delete Order">
                                🗑️ Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        console.error("ADMIN LOAD ORDERS ERROR:", err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">Error rendering orders table.</td></tr>`;
    }
}

async function changeOrderStatus(orderId, newStatusId) {
    try {
        const response = await authFetch(`${API_URL}/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status_id: Number(newStatusId) })
        });

        if (response && response.ok) {
            alert("Order status updated successfully!");
            await loadAdminOrders();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.detail || "Failed to update order status.");
        }
    } catch (err) {
        console.error("UPDATE STATUS ERROR:", err);
        alert("Network error updating order status.");
    }
}

async function deleteAdminOrder(orderId) {
    if (!confirm(`Are you sure you want to delete order #${orderId}?`)) return;

    try {
        const response = await authFetch(`${API_URL}/orders/${orderId}`, {
            method: "DELETE"
        });

        if (response && response.ok) {
            alert("Order deleted successfully!");
            await loadAdminOrders();
        } else {
            const err = await response.json().catch(() => ({}));
            alert(err.detail || "Failed to delete order.");
        }
    } catch (err) {
        console.error("DELETE ORDER ERROR:", err);
        alert("Network error deleting order.");
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}