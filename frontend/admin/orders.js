"use strict";


// =====================================================
// API URL
// =====================================================

const ADMIN_API_URL =
    "http://127.0.0.1:8000";


// =====================================================
// DATA
// =====================================================

let orders = [];

let statuses = [];

let currentUser = null;


// =====================================================
// ELEMENTS
// =====================================================

const orderTableBody =
    document.getElementById(
        "orderTableBody"
    );


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            // =================================================
            // PROTECT PAGE
            // =================================================

            currentUser =
                await protectPage([
                    "ADMIN",
                    "SUPERADMIN"
                ]);


            if (!currentUser) {

                return;

            }


            // =================================================
            // SHOW USER
            // =================================================

            const userInfo =
                document.getElementById(
                    "userInfo"
                );


            if (userInfo) {

                userInfo.textContent =
                    `${currentUser.username} (${currentUser.role})`;

            }


            // =================================================
            // LOAD STATUS
            // =================================================

            await loadStatuses();


            // =================================================
            // LOAD ORDERS
            // =================================================

            await loadOrders();

        }
        catch (error) {

            console.error(
                "ORDERS PAGE ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Failed to load orders.",
                "error"
            );

        }

    }
);


// =====================================================
// LOAD STATUSES
// =====================================================

async function loadStatuses() {

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
                .catch(
                    function () {
                        return {};
                    }
                );


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


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    orderTableBody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="loading-cell"
            >
                Loading orders...
            </td>

        </tr>

    `;


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/orders`
            );


        if (!response) {

            return;

        }


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            throw new Error(
                errorData.detail ||
                "Failed to load orders."
            );

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


        renderOrders();

    }
    catch (error) {

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );


        orderTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading-cell"
                >
                    Failed to load orders.
                </td>

            </tr>

        `;


        showMessage(
            error.message ||
            "Failed to load orders.",
            "error"
        );

    }

}


// =====================================================
// GET STATUS NAME
// =====================================================

function getStatusName(
    statusId
) {

    const foundStatus =
        statuses.find(
            function (item) {

                return Number(
                    item.id
                ) === Number(
                    statusId
                );

            }
        );


    if (!foundStatus) {

        return "Unknown";

    }


    return foundStatus.name;

}


// =====================================================
// RENDER ORDERS
// =====================================================

function renderOrders() {

    orderTableBody.innerHTML = "";


    if (orders.length === 0) {

        orderTableBody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading-cell"
                >
                    No orders found.
                </td>

            </tr>

        `;

        return;

    }


    orders.forEach(
        function (order) {

            const row =
                document.createElement(
                    "tr"
                );


            // =================================================
            // STATUS
            // =================================================

            const statusName =
                getStatusName(
                    order.status_id
                );


            // =================================================
            // ITEMS
            // =================================================

            const itemCount =
                Array.isArray(
                    order.items
                )
                    ? order.items.reduce(
                        function (
                            total,
                            item
                        ) {

                            return (
                                total +
                                Number(
                                    item.quantity || 0
                                )
                            );

                        },
                        0
                    )
                    : 0;


            // =================================================
            // CREATED DATE
            // =================================================

            let createdDate =
                "-";


            if (order.created_at) {

                createdDate =
                    new Date(
                        order.created_at
                    ).toLocaleString();

            }


            // =================================================
            // STATUS DROPDOWN
            // =================================================

            let statusOptions = "";


            statuses.forEach(
                function (status) {

                    const selected =
                        Number(
                            status.id
                        ) ===
                        Number(
                            order.status_id
                        )
                            ? "selected"
                            : "";


                    statusOptions += `

                        <option
                            value="${status.id}"
                            ${selected}
                        >
                            ${escapeHtml(
                                status.name
                            )}
                        </option>

                    `;

                }
            );


            // =================================================
            // ROW
            // =================================================

            row.innerHTML = `

                <td>
                    #${order.id}
                </td>


                <td>
                    User #${order.user_id}
                </td>


                <td>
                    ₹${Number(
                        order.total_amount || 0
                    ).toFixed(2)}
                </td>


                <td>
                    ${itemCount}
                </td>


                <td>

                    <select
                        class="status-select"
                        onchange="
                            updateOrderStatus(
                                ${order.id},
                                this.value
                            )
                        "
                    >

                        ${statusOptions}

                    </select>

                </td>


                <td>
                    ${escapeHtml(
                        createdDate
                    )}
                </td>


                <td>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="
                            deleteOrder(
                                ${order.id}
                            )
                        "
                    >
                        Delete
                    </button>

                </td>

            `;


            orderTableBody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

async function updateOrderStatus(
    orderId,
    statusId
) {

    const selectedStatus =
        statuses.find(
            function (item) {

                return Number(
                    item.id
                ) === Number(
                    statusId
                );

            }
        );


    const statusName =
        selectedStatus
            ? selectedStatus.name
            : "this status";


    const confirmed =
        confirm(
            `Change order #${orderId} status to "${statusName}"?`
        );


    if (!confirmed) {

        await loadOrders();

        return;

    }


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/orders/${orderId}/status`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status_id:
                                Number(statusId)
                        })

                }
            );


        if (!response) {

            return;

        }


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        function () {
                            return {};
                        }
                    );


            throw new Error(
                errorData.detail ||
                "Failed to update order status."
            );

        }


        showMessage(
            `Order #${orderId} status updated to "${statusName}".`,
            "success"
        );


        await loadOrders();

    }
    catch (error) {

        console.error(
            "UPDATE ORDER STATUS ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to update order status.",
            "error"
        );


        await loadOrders();

    }

}


// =====================================================
// DELETE ORDER
// =====================================================

async function deleteOrder(
    orderId
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete order #${orderId}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/orders/${orderId}`,
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
                    .catch(
                        function () {
                            return {};
                        }
                    );


            throw new Error(
                errorData.detail ||
                "Failed to delete order."
            );

        }


        showMessage(
            `Order #${orderId} deleted successfully.`,
            "success"
        );


        await loadOrders();

    }
    catch (error) {

        console.error(
            "DELETE ORDER ERROR:",
            error
        );


        showMessage(
            error.message ||
            "Failed to delete order.",
            "error"
        );

    }

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type = "success"
) {

    const message =
        document.getElementById(
            "message"
        );


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
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}