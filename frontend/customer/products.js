"use strict";


// =====================================================
// API
// =====================================================

const API_URL =
    "http://127.0.0.1:8000";


// =====================================================
// PRODUCTS
// =====================================================

let products = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            // =========================================
            // CUSTOMER ONLY
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
            // LOAD PRODUCTS
            // =========================================

            await loadProducts();

            renderProducts();

        }
        catch (error) {

            console.error(
                "CUSTOMER PRODUCTS ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Failed to load products.",
                true
            );

        }

    }
);


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

        let errorMessage =
            "Failed to load products.";


        try {

            const data =
                await response.json();


            errorMessage =
                data.detail ||
                errorMessage;

        }
        catch (error) {

            console.error(error);

        }


        throw new Error(
            errorMessage
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
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );


    tableBody.innerHTML = "";


    if (products.length === 0) {

        tableBody.innerHTML = `

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
                document.createElement(
                    "tr"
                );


            // =========================================
            // FIRST IMAGE
            // =========================================

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


            // =========================================
            // STOCK
            // =========================================

            const quantity =
                Number(
                    product.quantity || 0
                );


            // =========================================
            // ROW
            // =========================================

            row.innerHTML = `

                <td>

                    ${product.id}

                </td>


                <td>

                    ${
                        imageUrl
                            ? `
                                <img
                                    src="${imageUrl}"
                                    alt="${escapeHtml(product.name || "")}"
                                    class="product-table-image"
                                >
                            `
                            : `
                                <div class="no-table-image">
                                    📦
                                </div>
                            `
                    }

                </td>


                <td>

                    <strong>

                        ${escapeHtml(
                            product.name || ""
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeHtml(
                        product.category_name ||
                        "No Category"
                    )}

                </td>


                <td>

                    ₹${Number(
                        product.price || 0
                    ).toFixed(2)}

                </td>


                <td>

                    <span
                        class="${
                            quantity > 0
                                ? "stock-available"
                                : "stock-empty"
                        }"
                    >

                        ${
                            quantity > 0
                                ? quantity
                                : "Out of stock"
                        }

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="buy-button"
                        onclick="buyProduct(${product.id})"
                        ${
                            quantity <= 0
                                ? "disabled"
                                : ""
                        }
                    >

                        ${
                            quantity > 0
                                ? "Buy Now"
                                : "Unavailable"
                        }

                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// BUY PRODUCT
// =====================================================

async function buyProduct(
    productId
) {

    const product =
        products.find(
            function (item) {

                return Number(
                    item.id
                ) === Number(
                    productId
                );

            }
        );


    if (!product) {

        return;

    }


    if (
        Number(product.quantity || 0) <= 0
    ) {

        showMessage(
            "Product is out of stock.",
            true
        );

        return;

    }


    // =========================================
    // CREATE ORDER
    // =========================================

    const confirmed =
        confirm(
            `Do you want to order "${product.name}" for ₹${Number(product.price).toFixed(2)}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await authFetch(
                `${API_URL}/orders`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            {
                                items: [
                                    {
                                        product_id:
                                            product.id,

                                        quantity:
                                            1
                                    }
                                ]
                            }
                        )
                }
            );


        if (!response) {

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to create order."
            );

        }


        showMessage(
            `Order #${data.id} created successfully!`,
            false
        );


        // =========================================
        // RELOAD PRODUCTS
        // =========================================

        await loadProducts();

        renderProducts();

    }
    catch (error) {

        console.error(
            "BUY PRODUCT ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to create order.",
            true
        );

    }

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "message"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.color =
        error
            ? "#dc2626"
            : "#16a34a";

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