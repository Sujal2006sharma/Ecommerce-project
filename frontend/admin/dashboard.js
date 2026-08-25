"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let categoryChart = null;
let stockChart = null;
let orderStatusChart = null;

document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Protect page for both ADMIN and SUPERADMIN roles
        const user = await protectPage(["ADMIN", "SUPERADMIN"]);
        if (!user) return;

        // Populate user details in the sidebar footer if available
        populateSidebarUser(user);

        // Fetch and populate live database metrics
        await loadAdminDashboardData();
    } catch (error) {
        console.error("ADMIN DASHBOARD LOAD ERROR:", error);
    }
});

// =====================================================
// POPULATE SIDEBAR USER INFORMATION
// =====================================================

function populateSidebarUser(user) {
    const userEl = document.getElementById("sidebarUser") || document.getElementById("userInfo");
    if (userEl && user) {
        const username = user.username || user.email || "Admin User";
        const role = user.role ? (user.role.name || user.role) : "ADMIN";
        userEl.innerHTML = `👤 <strong>${username}</strong> <br><small style="color: #94a3b8;">(${String(role).toUpperCase()})</small>`;
    }
}

// =====================================================
// LOAD ALL DASHBOARD DATA FROM API
// =====================================================

async function loadAdminDashboardData() {
    try {
        const [pRes, cRes, oRes, uRes] = await Promise.all([
            authFetch(`${API_URL}/products`).catch(() => null),
            authFetch(`${API_URL}/categories`).catch(() => null),
            authFetch(`${API_URL}/orders`).catch(() => null),
            authFetch(`${API_URL}/users`).catch(() => null)
        ]);

        const products = pRes && pRes.ok ? await pRes.json() : [];
        const categories = cRes && cRes.ok ? await cRes.json() : [];
        const orders = oRes && oRes.ok ? await oRes.json() : [];
        const users = uRes && uRes.ok ? await uRes.json() : [];

        const prodList = Array.isArray(products) ? products : (products.data || []);
        const catList = Array.isArray(categories) ? categories : (categories.data || []);
        const ordList = Array.isArray(orders) ? orders : (orders.data || []);
        const userList = Array.isArray(users) ? users : (users.data || []);

        const totalStock = prodList.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);

        setVal("totalProducts", prodList.length);
        setVal("totalCategories", catList.length);
        setVal("totalStock", totalStock);
        setVal("totalOrders", ordList.length);
        setVal("totalUsers", userList.length);

        renderCategoryChart(catList, prodList);
        renderStockChart(prodList);
        renderOrderStatusChart(ordList);

    } catch (err) {
        console.error("ADMIN DATA FETCH ERROR:", err);
    }
}

function setVal(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// =====================================================
// RENDER PRODUCTS BY CATEGORY BAR CHART
// =====================================================

function renderCategoryChart(categories, products) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (categoryChart) categoryChart.destroy();

    const counts = {};
    categories.forEach(c => { counts[c.name] = 0; });

    products.forEach(p => {
        const catName = p.category ? (p.category.name || p.category) : 'Uncategorized';
        counts[catName] = (counts[catName] || 0) + 1;
    });

    categoryChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(counts).length ? Object.keys(counts) : ["No Categories"],
            datasets: [{
                label: "Product Count",
                data: Object.values(counts).length ? Object.values(counts) : [0],
                backgroundColor: "#2563eb",
                borderRadius: 6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: "easeOutQuart"
            }
        }
    });
}

// =====================================================
// RENDER STOCK OVERVIEW BAR CHART
// =====================================================

function renderStockChart(products) {
    const canvas = document.getElementById("stockChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (stockChart) stockChart.destroy();

    const topProd = products.slice(0, 5);
    const labels = topProd.map(p => p.name || `Prod #${p.id}`);
    const stocks = topProd.map(p => Number(p.quantity) || 0);

    stockChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels.length ? labels : ["No Products"],
            datasets: [{
                label: "Stock Quantity",
                data: stocks.length ? stocks : [0],
                backgroundColor: "#10b981",
                borderRadius: 6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: "easeOutQuart"
            }
        }
    });
}

// =====================================================
// RENDER ORDER STATUS OVERVIEW (ANIMATED DOUGHNUT)
// =====================================================

function renderOrderStatusChart(orders) {
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

    // Update real numbers in the UI cards
    setVal("countPending", statusCounts.Pending);
    setVal("countAccepted", statusCounts.Accepted);
    setVal("countShipped", statusCounts.Shipped);
    setVal("countDelivered", statusCounts.Delivered);
    setVal("countRejected", statusCounts.Rejected);

    // Render Doughnut Chart with smooth entry animations
    const canvas = document.getElementById("orderStatusChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (orderStatusChart) orderStatusChart.destroy();

    orderStatusChart = new Chart(canvas, {
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
                animateRotate: true,   // Rotates chart from 0 to 360 degrees
                animateScale: true,    // Scales chart outwards from center
                duration: 1200,        // Smooth 1.2-second entry duration
                easing: "easeOutQuart" // Smooth deceleration effect
            },
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 12, weight: "600" }
                    }
                }
            }
        }
    });
}