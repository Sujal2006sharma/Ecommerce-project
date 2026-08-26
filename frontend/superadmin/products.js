// =====================================================
// API URL
// =====================================================

const ADMIN_API_URL = "http://127.0.0.1:8000";


// =====================================================
// DATA
// =====================================================

let products = [];
let categories = [];
let statuses = [];


// =====================================================
// ELEMENTS
// =====================================================

const productTableBody =
    document.getElementById("productTableBody");

const addProductButton =
    document.getElementById("addProductButton");

const productModal =
    document.getElementById("productModal");

const closeProductModalButton =
    document.getElementById("closeProductModal");

const productForm =
    document.getElementById("productForm");

const productId =
    document.getElementById("productId");

const productName =
    document.getElementById("productName");

const productPrice =
    document.getElementById("productPrice");

const productQuantity =
    document.getElementById("productQuantity");

const productCategory =
    document.getElementById("productCategory");

const modalTitle =
    document.getElementById("modalTitle");

const saveProductButton =
    document.getElementById("saveProductButton");


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            // -----------------------------------------
            // Protect Admin page
            // -----------------------------------------

            const user = await protectPage(["SUPERADMIN", "ADMIN"]);

            if (!user) {
                return;
            }


            // -----------------------------------------
            // Show logged-in user
            // -----------------------------------------

            const userInfo =
                document.getElementById("userInfo");

            if (userInfo) {

                userInfo.textContent =
                    `${user.username} (${user.role})`;

            }


            // -----------------------------------------
            // Load categories
            // -----------------------------------------

            await loadCategories();


            // -----------------------------------------
            // Load statuses
            // -----------------------------------------

            await loadStatuses();


            // -----------------------------------------
            // Load products
            // -----------------------------------------

            await loadProducts();

        }
        catch (error) {

            console.error(
                "ADMIN PRODUCTS PAGE ERROR:",
                error
            );

            showMessage(
                error.message ||
                "Failed to load Admin Products page.",
                "error"
            );

        }

    }
);


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    if (!productTableBody) return;

    productTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                Loading products...
            </td>
        </tr>
    `;


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/products`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await response.json()
                .catch(function () {
                    return {};
                });


            throw new Error(
                errorData.detail ||
                "Failed to load products."
            );

        }


        const result =
            await response.json();

        products =
            Array.isArray(result)
                ? result
                : (
                    Array.isArray(result.data)
                        ? result.data
                        : []
                );


        renderProducts();

    }
    catch (error) {

        console.error(
            "LOAD PRODUCTS ERROR:",
            error
        );


        productTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Failed to load products.
                </td>
            </tr>
        `;


        showMessage(
            error.message ||
            "Failed to load products.",
            "error"
        );

    }

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

    if (!productTableBody) return;
    productTableBody.innerHTML = "";


    if (products.length === 0) {

        productTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No products found.
                </td>
            </tr>
        `;

        return;
    }


    products.forEach(
        function (product) {

            const row =
                document.createElement("tr");


            const safeProductName =
                escapeHtml(product.name || "");


            const categoryName =
                product.category_name ||
                "No Category";


            row.innerHTML = `
                <td>
                    ${product.id}
                </td>

                <td>
                    ${safeProductName}
                </td>

                <td>
                    ${escapeHtml(categoryName)}
                </td>

                <td>
                    $${Number(product.price || 0).toFixed(2)}
                </td>

                <td>
                    ${product.quantity ?? 0}
                </td>

                <td>

                    <select
                        class="status-select"
                        data-product-id="${product.id}"
                    >

                        ${createStatusOptions(
                            product.status_id
                        )}

                    </select>

                </td>

                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="openEditProduct(${product.id})"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteProduct(
                            ${product.id},
                            '${escapeForAttribute(
                                product.name || ""
                            )}'
                        )"
                    >
                        Delete
                    </button>

                </td>
            `;


            const statusSelect =
                row.querySelector(
                    ".status-select"
                );


            if (statusSelect) {

                statusSelect.addEventListener(
                    "change",
                    async function () {

                        const selectedStatusId =
                            Number(
                                statusSelect.value
                            );


                        if (!selectedStatusId) {
                            return;
                        }


                        await updateProductStatus(
                            product.id,
                            selectedStatusId,
                            statusSelect
                        );

                    }
                );

            }


            productTableBody.appendChild(row);

        }
    );

}


// =====================================================
// CREATE STATUS OPTIONS
// =====================================================

function createStatusOptions(
    currentStatusId
) {

    let html = "";


    if (statuses.length === 0) {

        return `
            <option value="">
                No Status
            </option>
        `;

    }


    statuses.forEach(
        function (status) {

            const selected =
                Number(status.id) ===
                Number(currentStatusId)
                    ? "selected"
                    : "";


            html += `
                <option
                    value="${status.id}"
                    ${selected}
                >
                    ${escapeHtml(status.name)}
                </option>
            `;

        }
    );


    return html;

}


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/categories`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await response.json()
                .catch(function () {
                    return {};
                });


            throw new Error(
                errorData.detail ||
                "Failed to load categories."
            );

        }


        const result =
            await response.json();


        categories =
            Array.isArray(result)
                ? result
                : (
                    Array.isArray(result.data)
                        ? result.data
                        : []
                );


        populateCategories();

    }
    catch (error) {

        console.error(
            "LOAD CATEGORIES ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to load categories.",
            "error"
        );

    }

}


// =====================================================
// POPULATE CATEGORY DROPDOWN
// =====================================================

function populateCategories() {

    if (!productCategory) return;

    productCategory.innerHTML = `
        <option value="">
            Select Category
        </option>
    `;


    categories.forEach(
        function (category) {

            const option =
                document.createElement("option");


            option.value =
                category.id;


            option.textContent =
                category.name;


            productCategory.appendChild(
                option
            );

        }
    );

}


// =====================================================
// LOAD STATUSES
// =====================================================

async function loadStatuses() {

    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/status`
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await response.json()
                .catch(function () {
                    return {};
                });


            throw new Error(
                errorData.detail ||
                "Failed to load statuses."
            );

        }


        const result =
            await response.json();


        statuses =
            Array.isArray(result)
                ? result
                : (
                    Array.isArray(result.data)
                        ? result.data
                        : []
                );


    }
    catch (error) {

        console.error(
            "LOAD STATUS ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to load statuses.",
            "error"
        );

    }

}


// =====================================================
// ADD PRODUCT BUTTON
// =====================================================

if (addProductButton) {

    addProductButton.addEventListener(
        "click",
        function () {

            if (productForm) productForm.reset();

            if (productId) productId.value = "";

            if (modalTitle) {
                modalTitle.textContent = "Add Product";
            }

            if (saveProductButton) {
                saveProductButton.textContent = "Create Product";
            }

            if (productModal) {
                productModal.style.display = "flex";
            }

        }
    );

}


// =====================================================
// OPEN EDIT PRODUCT
// =====================================================

function openEditProduct(id) {

    const product =
        products.find(
            function (item) {

                return Number(item.id) ===
                    Number(id);

            }
        );


    if (!product) {

        showMessage(
            "Product not found.",
            "error"
        );

        return;
    }


    if (productId) productId.value = product.id;

    if (productName) productName.value = product.name || "";

    if (productPrice) productPrice.value = product.price ?? "";

    if (productQuantity) productQuantity.value = product.quantity ?? "";

    if (productCategory) productCategory.value = product.category_id ?? "";

    if (modalTitle) modalTitle.textContent = "Edit Product";

    if (saveProductButton) saveProductButton.textContent = "Update Product";

    if (productModal) productModal.style.display = "flex";

}


// =====================================================
// SAVE PRODUCT (WITH ENFORCED VALIDATION RULES)
// =====================================================

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const id =
                productId.value.trim();


            const name =
                productName.value.trim();


            const priceInput =
                productPrice.value.trim();


            const quantityInput =
                productQuantity.value.trim();


            const price =
                parseFloat(priceInput);


            const quantity =
                Number(quantityInput);


            const categoryId =
                Number(productCategory.value);


            // -----------------------------------------
            // 1. Product Name Validation (No numbers only)
            // -----------------------------------------

            const numericOnlyPattern = /^\d+$/;

            if (!name) {

                showMessage(
                    "Please enter product name.",
                    "error"
                );

                return;
            }


            if (numericOnlyPattern.test(name)) {

                showMessage(
                    "Product name cannot contain numbers only.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // 2. Price Validation (Must be > 0)
            // -----------------------------------------

            if (
                priceInput === "" ||
                Number.isNaN(price) ||
                price <= 0
            ) {

                showMessage(
                    "Price must be strictly greater than 0.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // 3. Quantity Validation (Positive Integer > 0, No Floats)
            // -----------------------------------------

            if (
                quantityInput === "" ||
                Number.isNaN(quantity) ||
                quantity <= 0
            ) {

                showMessage(
                    "Quantity must be strictly greater than 0.",
                    "error"
                );

                return;
            }


            if (
                !Number.isInteger(quantity) ||
                quantityInput.includes(".")
            ) {

                showMessage(
                    "Quantity must be a whole integer (decimals not allowed).",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // 4. Category Validation
            // -----------------------------------------

            if (!categoryId) {

                showMessage(
                    "Please select a category.",
                    "error"
                );

                return;
            }


            // -----------------------------------------
            // Payload Data
            // -----------------------------------------

            const productData = {

                name: name,

                price: price,

                quantity: parseInt(quantityInput, 10),

                category_id: categoryId

            };


            try {

                let response;


                if (id) {

                    response =
                        await authFetch(
                            `${ADMIN_API_URL}/products/${id}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        productData
                                    )
                            }
                        );

                }
                else {

                    response =
                        await authFetch(
                            `${ADMIN_API_URL}/products`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        productData
                                    )
                            }
                        );

                }


                if (!response) {
                    return;
                }


                if (!response.ok) {

                    const errorData =
                        await response.json()
                        .catch(function () {
                            return {};
                        });


                    throw new Error(
                        errorData.detail ||
                        "Failed to save product."
                    );

                }


                showMessage(
                    id
                        ? "Product updated successfully."
                        : "Product created successfully.",
                    "success"
                );


                closeProductModal();


                await loadProducts();

            }
            catch (error) {

                console.error(
                    "SAVE PRODUCT ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Failed to save product.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================

async function updateProductStatus(
    productIdValue,
    statusIdValue,
    statusSelect
) {

    const oldStatusId =
        products.find(
            function (product) {

                return Number(product.id) ===
                    Number(productIdValue);

            }
        )?.status_id;


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/products/${productIdValue}/status?status_id=${statusIdValue}`,
                {
                    method: "PUT"
                }
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await response.json()
                .catch(function () {
                    return {};
                });


            throw new Error(
                errorData.detail ||
                "Failed to update product status."
            );

        }


        showMessage(
            "Product status updated successfully.",
            "success"
        );


        const product =
            products.find(
                function (item) {

                    return Number(item.id) ===
                        Number(productIdValue);

                }
            );


        if (product) {

            product.status_id =
                Number(statusIdValue);


            const selectedStatus =
                statuses.find(
                    function (status) {

                        return Number(status.id) ===
                            Number(statusIdValue);

                    }
                );


            if (selectedStatus) {

                product.status =
                    selectedStatus.name;

            }

        }

    }
    catch (error) {

        console.error(
            "UPDATE STATUS ERROR:",
            error
        );


        if (oldStatusId) {

            statusSelect.value =
                oldStatusId;

        }


        showMessage(
            error.message ||
            "Failed to update product status.",
            "error"
        );

    }

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(
    id,
    name
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete "${name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/products/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response) {
            return;
        }


        if (!response.ok) {

            const errorData =
                await response.json()
                .catch(function () {
                    return {};
                });


            throw new Error(
                errorData.detail ||
                "Failed to delete product."
            );

        }


        showMessage(
            "Product deleted successfully.",
            "success"
        );


        await loadProducts();

    }
    catch (error) {

        console.error(
            "DELETE PRODUCT ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to delete product.",
            "error"
        );

    }

}


// =====================================================
// CLOSE MODAL
// =====================================================

if (closeProductModalButton) {

    closeProductModalButton.addEventListener(
        "click",
        closeProductModal
    );

}


function closeProductModal() {

    if (productModal) {
        productModal.style.display = "none";
    }


    if (productForm) {
        productForm.reset();
    }


    if (productId) {
        productId.value = "";
    }


    if (modalTitle) {
        modalTitle.textContent = "Add Product";
    }


    if (saveProductButton) {
        saveProductButton.textContent = "Create Product";
    }

}


// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =====================================================

window.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();

        }

    }
);


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type = "success"
) {

    const message =
        document.getElementById("message");


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        `message ${type}`;


    setTimeout(
        function () {

            message.textContent =
                "";

            message.className =
                "message";

        },
        4000
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeForAttribute(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");

}