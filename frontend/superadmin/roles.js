"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["SUPERADMIN"]);
        if (!user) return;

        await loadRoles();
    } catch (error) {
        console.error("ROLES LOAD ERROR:", error);
    }
});

async function loadRoles() {
    try {
        const response = await authFetch(`${API_URL}/roles`);
        if (!response || !response.ok) return;

        const roles = await response.json();
        renderRoles(roles);
    } catch (error) {
        console.error("LOAD ROLES ERROR:", error);
    }
}

function renderRoles(roles) {
    const container = document.getElementById("rolesContainer");
    if (!container) return;

    if (roles.length === 0) {
        container.innerHTML = `<p>No roles found.</p>`;
        return;
    }

    container.innerHTML = roles.map(role => `
        <div style="background: #fff; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid #2563eb;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1.2rem; color: #1f2937;">${role.name}</h3>
                <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; color: #4b5563;">ID #${role.id}</span>
            </div>
            <p style="margin-top: 0.75rem; color: #6b7280; font-size: 0.9rem;">
                System access role and permissions level.
            </p>
        </div>
    `).join("");
}