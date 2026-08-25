"use strict";

if (typeof API_URL === "undefined") {
    var API_URL = "http://127.0.0.1:8000";
}

let categories = [];

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const user = await protectPage(["SUPERADMIN", "ADMIN"]);
        if (!user) return;

        await loadCategories();
        setupCategoryModal();
    } catch (error) {
        console.error("CATEGORIES LOAD ERROR:", error);
    }
});

// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {
    const tbody = document.getElementById("categoryTableBody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 12px; text-align: center;">Loading categories...</td></tr>`;
    }

    try {
        const response = await authFetch(`${API_URL}/categories`);
        if (!response || !response.ok) return;

        const result = await response.json();
        categories = Array.isArray(result) ? result : (result.data || []);
        renderCategories();
    } catch (error) {
        console.error("LOAD CATEGORIES ERROR:", error);
    }
}

// =====================================================
// RENDER CATEGORIES
// =====================================================

function renderCategories() {
    const tbody = document.getElementById("categoryTableBody");
    if (!tbody) return;

    if (categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 12px; text-align: center;">No categories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = categories.map(cat => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px;">#${cat.id}</td>
            <td style="padding: 12px;">${cat.name}</td>
            <td style="padding: 12px;">${cat.description || ''}</td>
            <td style="padding: 12px;">
                <button onclick="openEditCategory(${cat.id})" style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 4px;">Edit</button>
                <button onclick="deleteCategory(${cat.id})" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
            </td>
        </tr>
    `).join("");
}

// =====================================================
// SETUP CATEGORY MODAL WITH STRING VALIDATION
// =====================================================

function setupCategoryModal() {
    const addBtn = document.getElementById("addCategoryButton");
    const modal = document.getElementById("categoryModal");
    const closeBtn = document.getElementById("closeCategoryModal");
    const form = document.getElementById("categoryForm");

    if (addBtn) addBtn.onclick = () => {
        form.reset();
        document.getElementById("categoryId").value = "";
        modal.style.display = "flex";
    };

    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const id = document.getElementById("categoryId").value;
            const name = document.getElementById("categoryName").value.trim();
            const description = document.getElementById("categoryDescription").value.trim();

            // -------------------------------------------------
            // VALIDATION: Category name must contain letters only
            // -------------------------------------------------
            const letterOnlyPattern = /^[A-Za-z\s]+$/;

            if (!name) {
                alert("Category name is required.");
                return;
            }

            if (!letterOnlyPattern.test(name)) {
                alert("Category name must contain only letters (e.g., Electronics, Footwear). Numbers are not allowed.");
                return;
            }

            const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;
            const method = id ? "PUT" : "POST";

            try {
                const response = await authFetch(url, {
                    method: method,
                    body: JSON.stringify({ name, description })
                });

                if (response && response.ok) {
                    alert(id ? "Category updated successfully!" : "Category created successfully!");
                    modal.style.display = "none";
                    form.reset();
                    await loadCategories();
                } else {
                    const err = await response.json().catch(() => ({}));
                    
                    let errorMsg = "Failed to save category.";
                    if (typeof err.detail === "string") {
                        errorMsg = err.detail;
                    } else if (Array.isArray(err.detail)) {
                        errorMsg = err.detail[0]?.msg || "Invalid input data.";
                    }

                    alert(errorMsg);
                }
            } catch (err) {
                console.error("SAVE CATEGORY ERROR:", err);
                alert("Network error. Could not save category.");
            }
        };
    }
}

function openEditCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById("categoryId").value = cat.id;
    document.getElementById("categoryName").value = cat.name || "";
    document.getElementById("categoryDescription").value = cat.description || "";
    document.getElementById("categoryModal").style.display = "flex";
}

async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
        const response = await authFetch(`${API_URL}/categories/${id}`, { method: "DELETE" });
        if (response && response.ok) {
            await loadCategories();
        } else {
            const err = await response.json().catch(() => ({}));
            let errorMsg = "Failed to delete category.";
            if (typeof err.detail === "string") {
                errorMsg = err.detail;
            } else if (Array.isArray(err.detail)) {
                errorMsg = err.detail[0]?.msg || "Category in use.";
            }
            alert(errorMsg);
        }
    } catch (err) {
        console.error("DELETE CATEGORY ERROR:", err);
    }
}