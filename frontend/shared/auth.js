"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

function getAccessToken() {
    return localStorage.getItem("access_token") || localStorage.getItem("token");
}

async function authFetch(url, options = {}) {
    const token = getAccessToken();

    if (!options.headers) {
        options.headers = {};
    }

    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
        options.headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401 || response.status === 403) {
            console.warn("Unauthorized access.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("token");
            window.location.href = "/frontend/auth/login.html";
            return null;
        }

        return response;
    } catch (err) {
        console.error("AUTHFETCH NETWORK ERROR:", err);
        throw err;
    }
}

async function protectPage(allowedRoles = []) {
    const token = getAccessToken();

    if (!token) {
        window.location.href = "/frontend/auth/login.html";
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            window.location.href = "/frontend/auth/login.html";
            return null;
        }

        const user = await response.json();

        if (allowedRoles.length > 0) {
            const userRole = user.role ? (user.role.name || user.role) : "";
            if (!allowedRoles.includes(String(userRole).toUpperCase())) {
                alert("Unauthorized access!");
                window.location.href = "/frontend/auth/login.html";
                return null;
            }
        }

        return user;
    } catch (err) {
        console.error("AUTH CHECK FAILED:", err);
        window.location.href = "/frontend/auth/login.html";
        return null;
    }
}

function logoutUser() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/frontend/auth/login.html";
}

function redirectByRole(role) {
    // Extract role string if passed as an object (e.g., { name: 'CUSTOMER' })
    let roleStr = role;
    if (role && typeof role === "object") {
        roleStr = role.name || role.role || "";
    }

    const userRole = String(roleStr || "").toUpperCase();

    switch (userRole) {
        case "SUPERADMIN":
            window.location.href = "/frontend/superadmin/dashboard.html";
            break;
        case "ADMIN":
            window.location.href = "/frontend/admin/dashboard.html";
            break;
        case "SELLER":
            window.location.href = "/frontend/seller/dashboard.html";
            break;
        case "CUSTOMER":
        default:
            window.location.href = "/frontend/index.html"; // <-- Updated path
            break;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const message = document.getElementById("message");

    if (!loginForm) return;

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !password) {
            if (message) {
                message.textContent = "Please enter username and password.";
                message.className = "message error";
            }
            return;
        }

        const loginButton = loginForm.querySelector("button[type='submit']");
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = "Logging in...";
        }

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const response = await fetch(`${API_URL}/auth/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData.toString()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Invalid credentials.");
            }

            const data = await response.json();

            const token = data.access_token || data.token;
            if (token) {
                localStorage.setItem("access_token", token);
            }

            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            if (message) {
                message.textContent = "Login successful. Redirecting...";
                message.className = "message success";
            }

            setTimeout(function () {
                // Safely resolve user role from token payload or user object
                const userRole = data.role || (data.user ? (data.user.role?.name || data.user.role) : "CUSTOMER");
                redirectByRole(userRole);
            }, 500);

        } catch (error) {
            console.error("LOGIN ERROR:", error);
            if (message) {
                message.textContent = error.message || "Login failed.";
                message.className = "message error";
            }

            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = "Login";
            }
        }
    });
});