"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

async function loginUser(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMsg = document.getElementById("errorMessage");

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (errorMsg) errorMsg.style.display = "none";

    try {
        // Sending application/json instead of form-urlencoded
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Save Tokens
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("access_token", data.access_token);
            
            // Build initial user object
            let userObj = {
                username: username,
                role: data.role ? String(data.role).toUpperCase() : "CUSTOMER"
            };

            // Fetch complete profile from /auth/me
            try {
                const meRes = await fetch(`${API_URL}/auth/me`, {
                    headers: { "Authorization": `Bearer ${data.access_token}` }
                });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    userObj = { ...userObj, ...meData };
                }
            } catch (meErr) {
                console.warn("Failed to fetch full user profile:", meErr);
            }

            localStorage.setItem("user", JSON.stringify(userObj));

            // Determine role and redirect to appropriate dashboard
            const userRole = (userObj.role && userObj.role.name)
                ? String(userObj.role.name).toUpperCase()
                : String(userObj.role || "CUSTOMER").toUpperCase();

            if (typeof redirectToDashboard === "function") {
                redirectToDashboard(userRole);
            } else if (userRole === "SUPERADMIN") {
                window.location.href = "/frontend/superadmin/dashboard.html";
            } else if (userRole === "ADMIN") {
                window.location.href = "/frontend/admin/dashboard.html";
            } else if (userRole === "SELLER") {
                window.location.href = "/frontend/seller/dashboard.html";
            } else {
                window.location.href = "/frontend/customer/dashboard.html";
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            let parsedError = "Invalid username or password";

            if (typeof errorData.detail === "string") {
                parsedError = errorData.detail;
            } else if (Array.isArray(errorData.detail)) {
                parsedError = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(", ");
            } else if (typeof errorData.detail === "object" && errorData.detail !== null) {
                parsedError = errorData.detail.msg || errorData.detail.message || JSON.stringify(errorData.detail);
            }

            if (errorMsg) {
                errorMsg.textContent = parsedError;
                errorMsg.style.display = "block";
            }
        }
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        if (errorMsg) {
            errorMsg.textContent = "Unable to connect to backend server";
            errorMsg.style.display = "block";
        }
    }
}