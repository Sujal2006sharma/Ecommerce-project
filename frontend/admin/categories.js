"use strict";


// =====================================================
// API URL
// =====================================================

const ADMIN_API_URL =
    "http://127.0.0.1:8000";


// =====================================================
// DATA
// =====================================================

let categories = [];


// =====================================================
// ELEMENTS
// =====================================================

const categoryTableBody =
    document.getElementById(
        "categoryTableBody"
    );


const addCategoryButton =
    document.getElementById(
        "addCategoryButton"
    );


const categoryModal =
    document.getElementById(
        "categoryModal"
    );


const closeCategoryModalButton =
    document.getElementById(
        "closeCategoryModal"
    );


const categoryForm =
    document.getElementById(
        "categoryForm"
    );


const categoryId =
    document.getElementById(
        "categoryId"
    );


const categoryName =
    document.getElementById(
        "categoryName"
    );


const categoryDescription =
    document.getElementById(
        "categoryDescription"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


const saveCategoryButton =
    document.getElementById(
        "saveCategoryButton"
    );


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {// =====================================================
// SAVE CATEGORY
//
// CREATE OR UPDATE
// =====================================================

categoryForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            categoryId.value;


        const name =
            categoryName.value.trim();


        const description =
            categoryDescription.value.trim();


        // =================================================
        // CATEGORY NAME VALIDATION
        // =================================================

        // Empty validation

        if (!name) {

            showMessage(
                "Category name is required.",
                "error"
            );

            return;

        }


        // =================================================
        // DO NOT ALLOW NUMBERS
        //
        // Allows:
        // Electronics
        // Food
        // Home Appliances
        //
        // Does not allow:
        // 123
        // Food123
        // 123Food
        // =================================================

        const namePattern =
            /^[A-Za-z\s]+$/;


        if (
            !namePattern.test(name)
        ) {

            showMessage(
                "Category name must contain only letters.",
                "error"
            );

            return;

        }


        // =================================================
        // DESCRIPTION VALIDATION
        //
        // Description can contain letters, numbers,
        // spaces and normal punctuation.
        // =================================================

        if (!description) {

            showMessage(
                "Category description is required.",
                "error"
            );

            return;

        }


        // =================================================
        // CATEGORY DATA
        // =================================================

        const categoryData = {

            name:
                name,

            description:
                description

        };


        try {

            let response;


            // =================================================
            // UPDATE CATEGORY
            // =================================================

            if (id) {

                response =
                    await authFetch(
                        `${ADMIN_API_URL}/categories/${id}`,
                        {

                            method: "PUT",

                            body:
                                JSON.stringify(
                                    categoryData
                                )

                        }
                    );

            }


            // =================================================
            // CREATE CATEGORY
            // =================================================

            else {

                response =
                    await authFetch(
                        `${ADMIN_API_URL}/categories`,
                        {

                            method: "POST",

                            body:
                                JSON.stringify(
                                    categoryData
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
                        .catch(
                            function () {

                                return {};

                            }
                        );


                throw new Error(
                    errorData.detail ||
                    "Failed to save category"
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            showMessage(
                id
                    ? "Category updated successfully."
                    : "Category created successfully.",
                "success"
            );


            closeCategoryModal();


            await loadCategories();

        }
        catch (error) {

            console.error(
                "SAVE CATEGORY ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Failed to save category.",
                "error"
            );

        }

    }
);

        const user =
            await protectPage([
                "SUPERADMIN",
                "ADMIN"
            ]);


        if (!user) {

            return;

        }


        // Show logged-in user

        document.getElementById(
            "userInfo"
        ).textContent =
            `${user.username} (${user.role})`;


        // Load categories

        await loadCategories();

    }
);


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    categoryTableBody.innerHTML = `

        <tr>

            <td
                colspan="4"
                class="loading-cell"
            >
                Loading categories...
            </td>

        </tr>

    `;


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
                    .catch(
                        function () {
                            return {};
                        }
                    );


            throw new Error(
                errorData.detail ||
                "Failed to load categories"
            );

        }


        const result =
            await response.json();


        categories =
            Array.isArray(result)
                ? result
                : (
                    result.data ||
                    []
                );


        renderCategories();

    }
    catch (error) {

        console.error(
            "LOAD CATEGORIES ERROR:",
            error
        );


        categoryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="loading-cell"
                >
                    Failed to load categories.
                </td>

            </tr>

        `;


        showMessage(
            error.message,
            "error"
        );

    }

}


// =====================================================
// RENDER CATEGORIES
// =====================================================

function renderCategories() {

    categoryTableBody.innerHTML = "";


    if (
        categories.length === 0
    ) {

        categoryTableBody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="loading-cell"
                >
                    No categories found.
                </td>

            </tr>

        `;

        return;

    }


    categories.forEach(
        function (category) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${category.id}
                </td>


                <td>
                    ${escapeHtml(
                        category.name
                    )}
                </td>


                <td>
                    ${escapeHtml(
                        category.description ||
                        ""
                    )}
                </td>


                <td>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="openEditCategory(${category.id})"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteCategory(${category.id})"
                    >
                        Delete
                    </button>

                </td>

            `;


            categoryTableBody.appendChild(
                row
            );

        }
    );

}


// =====================================================
// ADD CATEGORY BUTTON
// =====================================================

addCategoryButton.addEventListener(
    "click",
    function () {

        openAddCategory();

    }
);


// =====================================================
// OPEN ADD CATEGORY
// =====================================================

function openAddCategory() {

    categoryForm.reset();


    categoryId.value =
        "";


    modalTitle.textContent =
        "Add Category";


    saveCategoryButton.textContent =
        "Create Category";


    categoryModal.style.display =
        "flex";

}


// =====================================================
// OPEN EDIT CATEGORY
// =====================================================

function openEditCategory(id) {

    const category =
        categories.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!category) {

        showMessage(
            "Category not found.",
            "error"
        );

        return;

    }


    categoryId.value =
        category.id;


    categoryName.value =
        category.name || "";


    categoryDescription.value =
        category.description || "";


    modalTitle.textContent =
        "Edit Category";


    saveCategoryButton.textContent =
        "Update Category";


    categoryModal.style.display =
        "flex";

}

// =====================================================
// SAVE CATEGORY
//
// CREATE OR UPDATE
// =====================================================

categoryForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const id =
            categoryId.value;


        const name =
            categoryName.value.trim();


        const description =
            categoryDescription.value.trim();


        // =================================================
        // CATEGORY NAME VALIDATION
        // =================================================

        // Empty validation

        if (!name) {

            showMessage(
                "Category name is required.",
                "error"
            );

            return;

        }


        // =================================================
        // DO NOT ALLOW NUMBERS
        //
        // Allows:
        // Electronics
        // Food
        // Home Appliances
        //
        // Does not allow:
        // 123
        // Food123
        // 123Food
        // =================================================

        const namePattern =
            /^[A-Za-z\s]+$/;


        if (
            !namePattern.test(name)
        ) {

            showMessage(
                "Category name must contain only letters.",
                "error"
            );

            return;

        }


        // =================================================
        // DESCRIPTION VALIDATION
        //
        // Description can contain letters, numbers,
        // spaces and normal punctuation.
        // =================================================

        if (!description) {

            showMessage(
                "Category description is required.",
                "error"
            );

            return;

        }


        // =================================================
        // CATEGORY DATA
        // =================================================

        const categoryData = {

            name:
                name,

            description:
                description

        };


        try {

            let response;


            // =================================================
            // UPDATE CATEGORY
            // =================================================

            if (id) {

                response =
                    await authFetch(
                        `${ADMIN_API_URL}/categories/${id}`,
                        {

                            method: "PUT",

                            body:
                                JSON.stringify(
                                    categoryData
                                )

                        }
                    );

            }


            // =================================================
            // CREATE CATEGORY
            // =================================================

            else {

                response =
                    await authFetch(
                        `${ADMIN_API_URL}/categories`,
                        {

                            method: "POST",

                            body:
                                JSON.stringify(
                                    categoryData
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
                        .catch(
                            function () {

                                return {};

                            }
                        );


                throw new Error(
                    errorData.detail ||
                    "Failed to save category"
                );

            }


            // =================================================
            // SUCCESS
            // =================================================

            showMessage(
                id
                    ? "Category updated successfully."
                    : "Category created successfully.",
                "success"
            );


            closeCategoryModal();


            await loadCategories();

        }
        catch (error) {

            console.error(
                "SAVE CATEGORY ERROR:",
                error
            );


            showMessage(
                error.message ||
                "Failed to save category.",
                "error"
            );

        }

    }
);
// =====================================================
// DELETE CATEGORY
// =====================================================

async function deleteCategory(id) {

    const category =
        categories.find(
            function (item) {

                return item.id === id;

            }
        );


    const categoryNameText =
        category
            ? category.name
            : "this category";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${categoryNameText}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await authFetch(
                `${ADMIN_API_URL}/categories/${id}`,
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
                "Unable to delete category"
            );

        }


        showMessage(
            "Category deleted successfully.",
            "success"
        );


        await loadCategories();

    }
    catch (error) {

        console.error(
            "DELETE CATEGORY ERROR:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}


// =====================================================
// CLOSE MODAL
// =====================================================

closeCategoryModalButton.addEventListener(
    "click",
    closeCategoryModal
);


function closeCategoryModal() {

    categoryModal.style.display =
        "none";


    categoryForm.reset();


    categoryId.value =
        "";

}


// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =====================================================

window.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            categoryModal
        ) {

            closeCategoryModal();

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
        document.getElementById(
            "message"
        );


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