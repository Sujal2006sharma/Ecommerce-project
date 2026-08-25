"use strict";

// Ensure API URL is set
if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let orderStatusChart = null;
let revenueChart = null;

document.addEventListener("DOMContentLoaded", async function () {
    console.log("--> SUPERADMIN DASHBOARD LOADED");

    try {
        if (typeof protectPage === "function") {
            const user = await protectPage(["SUPERADMIN", "ADMIN"]);
            if (!user) return;
        }

        await loadLiveDashboardData();
    } catch (error) {
        console.error("Dashboard initialization error:", error);
    }
});

async function loadLiveDashboardData() {
    console.log("--> FETCHING LIVE DASHBOARD DATA...");

    let products = [];
    let categories = [];
    let orders = [];

    // Fetch Products
    try {
        const pRes = await authFetch(`${API_URL}/products`);
        if (pRes && pRes.ok) {
            const data = await pRes.json();
            products = Array.isArray(data) ? data : (data.data || []);
        }
    } catch (e) { console.error("Error fetching products:", e); }

    // Fetch Categories
    try {
        const cRes = await authFetch(`${API_URL}/categories`);
        if (cRes && cRes.ok) {
            const data = await cRes.json();
            categories = Array.isArray(data) ? data : (data.data || []);
        }
    } catch (e) { console.error("Error fetching categories:", e); }

    // Fetch Orders
    try {
        const oRes = await authFetch(`${API_URL}/orders`);
        if (oRes && oRes.ok) {
            const data = await oRes.json();
            orders = Array.isArray(data) ? data : (data.data || []);
        }
    } catch (e) { console.error("Error fetching orders:", e); }

    // Compute Counters
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalStock = products.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, item) => acc + (Number(item.total_amount) || 0), 0);

    // Update Counter DOM
    setElementText("totalProducts", totalProducts);
    setElementText("totalCategories", totalCategories);
    setElementText("totalStock", totalStock);
    setElementText("totalOrders", totalOrders);
    setElementText("totalRevenue", "₹" + Number(totalRevenue).toLocaleString("en-IN"));

    // Render Animated Charts & Recent Orders
    renderRevenueChart(orders);
    renderOrderStatusOverview(orders);
    renderRecentOrders(orders);
}

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// =====================================================
// RENDER REVENUE TREND LINE CHART
// =====================================================

function renderRevenueChart(orders) {
    const revenueCanvas = document.getElementById("revenueChart");
    if (!revenueCanvas || typeof Chart === "undefined") return;

    if (revenueChart) revenueChart.destroy();

    const dates = orders.map(o => o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Order');
    const amounts = orders.map(o => Number(o.total_amount) || 0);

    revenueChart = new Chart(revenueCanvas, {
        type: "line",
        data: {
            labels: dates.length ? dates : ["No Sales"],
            datasets: [{
                label: "Revenue (₹)",
                data: amounts.length ? amounts : [0],
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            animation: { duration: 1000, easing: "easeOutQuart" }
        }
    });
}

// =====================================================
// RENDER ORDER STATUS CARDS & ANIMATED DOUGHNUT
// =====================================================

function renderOrderStatusOverview(orders) {
    const statusCounts = { Pending: 0, Accepted: 0, Shipped: 0, Delivered: 0, Rejected: 0 };

    orders.forEach(o => {
        let rawStatus = typeof o.status === "string" 
            ? o.status 
            : (o.status?.name || o.status_name || "Pending");
            
        const lower = rawStatus.toLowerCase();
        if (lower.includes("accept")) {
            statusCounts.Accepted++;
        } else if (lower.includes("ship")) {
            statusCounts.Shipped++;
        } else if (lower.includes("deliver")) {
            statusCounts.Delivered++;
        } else if (lower.includes("reject")) {
            statusCounts.Rejected++;
        } else {
            statusCounts.Pending++;
        }
    });

    // Update real numbers into individual status cards
    setElementText("countPending", statusCounts.Pending);
    setElementText("countAccepted", statusCounts.Accepted);
    setElementText("countShipped", statusCounts.Shipped);
    setElementText("countDelivered", statusCounts.Delivered);
    setElementText("countRejected", statusCounts.Rejected);

    // Render Animated Doughnut Chart
    const statusCanvas = document.getElementById("orderStatusChart");
    if (!statusCanvas || typeof Chart === "undefined") return;

    if (orderStatusChart) orderStatusChart.destroy();

    orderStatusChart = new Chart(statusCanvas, {
        type: "doughnut",
        data: {
            labels: ["Pending", "Accepted", "Shipped", "Delivered", "Rejected"],
            datasets: [{
                data: [
                    statusCounts.Pending,
                    statusCounts.Accepted,
                    statusCounts.Shipped,
                    statusCounts.Delivered,
                    statusCounts.Rejected
                ],
                backgroundColor: ["#f59e0b", "#3b82f6", "#8b5cf6", "#22c55e", "#ef4444"],
                borderWidth: 2,
                borderColor: "#ffffff",
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: "easeOutQuart"
            },
            plugins: {
                legend: { display: false } // Hidden legend since status cards clearly label the values
            }
        }
    });
}

// =====================================================
// RENDER RECENT ORDERS TABLE
// =====================================================

function renderRecentOrders(orders) {
    const tbody = document.getElementById("recentOrdersBody");
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center;">No orders found.</td></tr>`;
        return;
    }

    const recent = orders.slice(-5).reverse();
    tbody.innerHTML = recent.map(o => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px;">#${o.id}</td>
            <td style="padding: 12px;">User #${o.user_id || 'N/A'}</td>
            <td style="padding: 12px;">₹${Number(o.total_amount || 0).toLocaleString("en-IN")}</td>
            <td style="padding: 12px;"><strong>${o.status ? (o.status.name || o.status) : 'Pending'}</strong></td>
            <td style="padding: 12px;">${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</td>
        </tr>
    `).join("");
}