"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

// Global safe fetch wrapper
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    options.headers = options.headers || {};
    
    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        // Clear tokens on unauthorized API calls
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
    }

    return response;
}

// Get dashboard URL based on user role
function getDashboardUrl(role) {
    const normalizedRole = String(role || "").toUpperCase();
    if (normalizedRole === "SUPERADMIN") {
        return "/frontend/superadmin/dashboard.html";
    } else if (normalizedRole === "ADMIN") {
        return "/frontend/admin/dashboard.html";
    } else if (normalizedRole === "SELLER") {
        return "/frontend/seller/dashboard.html";
    } else {
        return "/frontend/customer/dashboard.html";
    }
}

// Redirect user to their corresponding dashboard
function redirectToDashboard(role) {
    let targetRole = role;
    if (!targetRole) {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                targetRole = (user.role && user.role.name) ? user.role.name : (user.role || "");
            }
        } catch (e) {}
    }
    window.location.href = getDashboardUrl(targetRole);
}

// Verify logged-in user helper
async function verifyUser() {
    return await protectPage();
}

// Global logout function
function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("customer_profile_details");
    window.location.href = "/frontend/auth/login.html";
}

// Alias for logout
function logout() {
    logoutUser();
}

// Page protection with role verification
async function protectPage(allowedRoles = []) {
    const currentPath = window.location.pathname.toLowerCase();
    
    // ALLOW GUEST ACCESS FOR PUBLIC CATALOG PAGES
    if (currentPath.includes("index.html") || currentPath.endsWith("/customer/dashboard.html") || currentPath === "/" || currentPath.endsWith("/frontend/")) {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) return null; // Guest user
    }

    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");

    if (!token) {
        // Only redirect to login if accessing protected pages like orders.html
        if (!currentPath.includes("index.html") && !currentPath.endsWith("/customer/dashboard.html")) {
            window.location.href = "/frontend/auth/login.html";
        }
        return null;
    }

    let user = null;
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            user = null;
        }
    }

    // If user object or user role is missing from localStorage, fetch /auth/me
    let userRole = (user && user.role && user.role.name) ? user.role.name : (user && user.role ? user.role : "");
    if (!user || !userRole) {
        try {
            const res = await authFetch(`${API_URL}/auth/me`);
            if (res && res.ok) {
                const meData = await res.json();
                user = { ...(user || {}), ...meData };
                localStorage.setItem("user", JSON.stringify(user));
                userRole = (user.role && user.role.name) ? user.role.name : (user.role || "");
            }
        } catch (err) {
            console.error("Error fetching user profile in protectPage:", err);
        }
    }

    if (!user) {
        if (!currentPath.includes("index.html") && !currentPath.endsWith("/customer/dashboard.html")) {
            window.location.href = "/frontend/auth/login.html";
        }
        return null;
    }

    if (allowedRoles.length > 0) {
        const normalizedRoles = allowedRoles.map(r => String(r).toUpperCase());
        const currentUserRole = String(userRole || "").toUpperCase();

        if (!normalizedRoles.includes(currentUserRole)) {
            console.warn("Role mismatch for page access. User role:", currentUserRole, "Allowed:", allowedRoles);
            if (!currentPath.includes("index.html") && !currentPath.endsWith("/customer/dashboard.html")) {
                redirectToDashboard(currentUserRole);
                return null;
            }
        }
    }

    return user;
}