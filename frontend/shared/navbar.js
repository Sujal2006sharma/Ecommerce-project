"use strict";

document.addEventListener("DOMContentLoaded", function () {
    renderSharedNavbar();
});

function renderSharedNavbar() {
    const navContainer = document.getElementById("navbarContainer") || document.getElementById("sharedNavbar");
    if (!navContainer) return;

    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch (e) {}

    let savedProfile = {};
    try {
        savedProfile = JSON.parse(localStorage.getItem("customer_profile_details") || "{}");
    } catch (e) {}

    const isLoggedIn = Boolean(token);
    const displayName = savedProfile.name || user.full_name || user.username || user.name || "Customer";

    navContainer.innerHTML = `
        <header style="background: #131921; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <a href="/frontend/index.html" style="font-size: 1.4rem; font-weight: 800; color: #ffffff; text-decoration: none;">
                    🛒 <span style="color: #febd69;">store</span>
                </a>
            </div>

            <div style="display: flex; align-items: center; gap: 20px;">
                ${isLoggedIn ? `
                    <div onclick="openProfileModal()" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
                        <div style="width: 34px; height: 34px; border-radius: 50%; background: #febd69; color: #131921; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                            ${displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: #ccc; display: block;">Hello, ${escapeHtml(displayName)}</span>
                            <span style="font-size: 0.85rem; font-weight: bold; color: #fff;">Account & Details</span>
                        </div>
                    </div>
                    <button onclick="logoutUser()" style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">Logout</button>
                ` : `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="line-height: 1.2;">
                            <span style="font-size: 0.75rem; color: #ccc; display: block;">Hello, sign in</span>
                            <span style="font-size: 0.85rem; font-weight: bold; color: #fff;">Account & Lists</span>
                        </div>
                        <a href="/frontend/auth/login.html" style="background: #febd69; color: #111; padding: 7px 16px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 0.85rem;">Sign In</a>
                    </div>
                `}

                <div onclick="toggleCart()" style="cursor: pointer; position: relative; display: flex; align-items: center; gap: 6px; background: #232f3e; padding: 6px 14px; border-radius: 20px;">
                    <span style="font-size: 1.2rem;">🛒</span>
                    <span id="cartCount" style="background: #febd69; color: #111; font-weight: bold; border-radius: 50%; padding: 2px 7px; font-size: 0.8rem;">0</span>
                    <span style="font-weight: bold; font-size: 0.85rem; color: #fff;">Cart</span>
                </div>
            </div>
        </header>
    `;
}

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/frontend/auth/login.html";
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}