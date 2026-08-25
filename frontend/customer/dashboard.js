"use strict";


// =====================================================
// API
// =====================================================

const API_URL =
    "http://127.0.0.1:8000";


// =====================================================
// DATA
// =====================================================

let products = [];

let categories = [];

let orders = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            // =========================================
            // PROTECT CUSTOMER PAGE
            // =========================================

            const user =
                await protectPage([
                    "CUSTOMER"
                ]);


            if (!user) {

                return;

            }


            // =========================================
            // USER INFO
            // =========================================

            const userInfo =
                document.getElementById(
                    "userInfo"
                );


            if (userInfo) {

                userInfo.textContent =
                    `${user.username} (${user.role})`;

            }


            // =========================================
            // LOAD DATA
            // =========================================

            await loadDashboard();

        }
        catch (error) {

            console.error(
                "CUSTOMER DASHBOARD ERROR:",
                error
            );

        }

    }
);


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    await Promise.all([

        loadProducts(),

        loadCategories(),

        loadOrders()

    ]);


    calculateStatistics();

    renderFeaturedProducts();

}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    const response =
        await authFetch(
            `${API_URL}/products`
        );


    if (!response) {

        return;

    }


    if (!response.ok) {

        throw new Error(
            "Failed to load products"
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

}


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    const response =
        await authFetch(
            `${API_URL}/categories`
        );


    if (!response) {

        return;

    }


    if (!response.ok) {

        return;

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

}


// =====================================================
// LOAD MY ORDERS
// =====================================================

async function loadOrders() {

    const response =
        await authFetch(
            `${API_URL}/orders/user/my-orders`
        );


    if (!response) {

        return;

    }


    if (!response.ok) {

        console.error(
            "Failed to load orders"
        );

        return;

    }


    const result =
        await response.json();


    orders =
        Array.isArray(result)
            ? result
            : (
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

}


// =====================================================
// STATISTICS
// =====================================================

function calculateStatistics() {

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    const totalCategories =
        document.getElementById(
            "totalCategories"
        );


    if (totalCategories) {

        totalCategories.textContent =
            categories.length;

    }


    let totalStock = 0;


    products.forEach(
        function (product) {

            totalStock +=
                Number(
                    product.quantity || 0
                );

        }
    );


    const stockElement =
        document.getElementById(
            "totalStock"
        );


    if (stockElement) {

        stockElement.textContent =
            totalStock;

    }


    const totalOrders =
        document.getElementById(
            "totalOrders"
        );


    if (totalOrders) {

        totalOrders.textContent =
            orders.length;

    }

}


// =====================================================
// FEATURED PRODUCTS
// =====================================================

function renderFeaturedProducts() {

    const container =
        document.getElementById(
            "featuredProducts"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML = `

            <div class="loading-card">

                No products available.

            </div>

        `;

        return;

    }


    const featured =
        products.slice(
            0,
            3
        );


    featured.forEach(
        function (product) {

            const firstImage =
                product.images &&
                product.images.length > 0
                    ? product.images[0]
                    : null;


            const imageUrl =
                firstImage &&
                firstImage.url
                    ? `${API_URL}${firstImage.url}`
                    : null;


            const stock =
                Number(
                    product.quantity || 0
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product-card";


            card.innerHTML = `

                <div class="product-card-image">

                    ${
                        imageUrl
                            ? `
                                <img
                                    src="${imageUrl}"
                                    alt="${escapeHtml(product.name || "")}"
                                >
                            `
                            : `
                                <div class="product-no-image">
                                    📦
                                </div>
                            `
                    }

                </div>


                <div class="product-card-content">

                    <h3>

                        ${escapeHtml(
                            product.name || ""
                        )}

                    </h3>


                    <div class="product-category">

                        ${escapeHtml(
                            product.category_name ||
                            "No Category"
                        )}

                    </div>


                    <div class="product-price">

                        ₹${Number(
                            product.price || 0
                        ).toFixed(2)}

                    </div>


                    <div
                        class="${
                            stock > 0
                                ? "product-stock"
                                : "product-stock product-out"
                        }"
                    >

                        ${
                            stock > 0
                                ? `${stock} available`
                                : "Out of stock"
                        }

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}