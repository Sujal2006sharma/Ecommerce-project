"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["SUPERADMIN", "ADMIN"]);
        if (!user) return;

        await loadOrders();
    } catch (error) {
        console.error("ORDERS LOAD ERROR:", error);
    }
});

// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center;">Loading orders...</td></tr>`;
    }

    try {
        const response = await authFetch(`${API_URL}/orders`);
        if (!response || !response.ok) return;

        const orders = await response.json();
        const list = Array.isArray(orders) ? orders : (orders.data || []);
        renderOrders(list);
    } catch (error) {
        console.error("LOAD ORDERS ERROR:", error);
    }
}

// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders(orders) {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center;">No orders found.</td></tr>`;
        return;
    }

    // Sort to show newest orders first (matching Dashboard)
    const sortedOrders = [...orders].reverse();

    tbody.innerHTML = sortedOrders.map(order => {
        // Safe status string resolution
        let statusText = "Pending";
        if (typeof order.status === "string") {
            statusText = order.status;
        } else if (order.status && typeof order.status === "object" && order.status.name) {
            statusText = order.status.name;
        } else if (order.status_name) {
            statusText = order.status_name;
        }

        // Format date string
        const formattedDate = order.created_at 
            ? new Date(order.created_at).toLocaleDateString() 
            : new Date().toLocaleDateString();

        return `    
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px;">#${order.id}</td>
                <td style="padding: 12px;">User #${order.user_id || 'N/A'}</td>
                <td style="padding: 12px;">₹${Number(order.total_amount || 0).toLocaleString("en-IN")}</td>
                <td style="padding: 12px;">
                    <strong style="color: #1f2937;">${statusText}</strong>
                </td>
                <td style="padding: 12px;">${formattedDate}</td>
            </tr>
        `;
    }).join("");
}   
