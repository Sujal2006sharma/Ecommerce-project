"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["SUPERADMIN"]);
        if (!user) return;

        await loadUsers();
        setupUserModal();
    } catch (error) {
        console.error("USERS LOAD ERROR:", error);
    }
});

// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {
    try {
        const response = await authFetch(`${API_URL}/users`);
        if (!response || !response.ok) throw new Error("Failed to load users");

        const users = await response.json();

        const totalUserCount = document.getElementById("totalUserCount");
        if (totalUserCount) totalUserCount.textContent = users.length;

        renderUsers(users);
    } catch (error) {
        console.error("LOAD USERS ERROR:", error);
    }
}

// =====================================================
// RENDER USERS
// =====================================================

function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 12px; text-align: center;">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        const roleMap = { 1: "SUPERADMIN", 2: "ADMIN", 3: "SELLER", 4: "CUSTOMER" };
        const roleName = roleMap[u.role_id] || `Role #${u.role_id}`;

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 12px;">#${u.id}</td>
                <td style="padding: 12px;">${escapeHtml(String(u.username || "N/A"))}</td>
                <td style="padding: 12px;">${escapeHtml(u.email)}</td>
                <td style="padding: 12px;">
                    <span style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">
                        ${roleName}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <span style="color: ${u.is_active ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                        ${u.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <button onclick="toggleUserStatus(${u.id}, ${u.is_active})" style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                        ${u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// =====================================================
// TOGGLE USER STATUS
// =====================================================

async function toggleUserStatus(userId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const response = await authFetch(`${API_URL}/users/${userId}/active?is_active=${newStatus}`, {
            method: "PUT"
        });

        if (response && response.ok) {
            await loadUsers();
        } else {
            const err = await response.json().catch(() => ({}));
            let errorMsg = "Failed to update status.";
            if (typeof err.detail === "string") {
                errorMsg = err.detail;
            } else if (Array.isArray(err.detail)) {
                errorMsg = err.detail[0]?.msg || "Validation error.";
            }
            alert(errorMsg);
        }
    } catch (err) {
        console.error("TOGGLE STATUS ERROR:", err);
    }
}

// =====================================================
// SETUP USER MODAL WITH STRING USERNAME VALIDATION
// =====================================================

function setupUserModal() {
    const modal = document.getElementById("userModal");
    const openBtn = document.getElementById("openAddUserModal");
    const closeBtn = document.getElementById("closeUserModal");
    const form = document.getElementById("createUserForm");

    if (openBtn) openBtn.onclick = () => modal.style.display = "flex";
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const username = document.getElementById("newUsername").value.trim();
            const email = document.getElementById("newUserEmail").value.trim();
            const password = document.getElementById("newUserPassword").value.trim();
            const roleId = parseInt(document.getElementById("newUserRole").value, 10);

            // -------------------------------------------------
            // VALIDATION: Username must contain letters and spaces only
            // -------------------------------------------------
            const stringOnlyPattern = /^[A-Za-z\s]+$/;

            if (!username) {
                alert("Username is required.");
                return;
            }

            if (!stringOnlyPattern.test(username)) {
                alert("Username must contain only alphabetic letters (e.g., John Doe). Numbers and special characters are not allowed.");
                return;
            }

            const payload = {
                username: username,
                email: email,
                password: password,
                role_id: roleId
            };

            try {
                const response = await authFetch(`${API_URL}/users`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (response && response.ok) {
                    alert("User created successfully!");
                    modal.style.display = "none";
                    form.reset();
                    await loadUsers();
                } else {
                    const err = await response.json().catch(() => ({}));

                    let errorMsg = "Failed to create user.";
                    if (typeof err.detail === "string") {
                        errorMsg = err.detail;
                    } else if (Array.isArray(err.detail)) {
                        errorMsg = err.detail[0]?.msg || "Invalid input data.";
                    }

                    alert(errorMsg);
                }
            } catch (err) {
                console.error("CREATE USER ERROR:", err);
                alert("Network error. Could not create user.");
            }
        };
    }
}

// Helper to escape HTML characters
function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}