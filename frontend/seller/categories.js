const API_URL =
    "http://127.0.0.1:8000/categories";


// ================================
// LOAD CATEGORIES
// ================================

async function loadCategories() {

    const response =
        await fetch(API_URL);

    const categories =
        await response.json();


    const tableBody =
        document.getElementById(
            "categoryTableBody"
        );


    tableBody.innerHTML = "";


    if (categories.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-category"
                >
                    No categories found.
                </td>
            </tr>
        `;

        return;
    }


    categories.forEach(category => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${category.id}
            </td>

            <td>
                ${category.name}
            </td>

            <td>
                ${category.description || ""}
            </td>

            <td>

                <div class="actions">

                    <button
                        class="action-btn edit-btn"
                        onclick="editCategory(
                            ${category.id},
                            '${category.name}',
                            '${category.description || ""}'
                        )"
                    >
                        Edit
                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="deleteCategory(
                            ${category.id}
                        )"
                    >
                        Delete
                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });
}


// ================================
// OPEN FORM
// ================================

function openCategoryForm() {

    document.getElementById(
        "categoryForm"
    ).style.display = "block";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Add Category";


    document.getElementById(
        "categoryId"
    ).value = "";


    document.getElementById(
        "categoryName"
    ).value = "";


    document.getElementById(
        "categoryDescription"
    ).value = "";
}


// ================================
// CLOSE FORM
// ================================

function closeCategoryForm() {

    document.getElementById(
        "categoryForm"
    ).style.display = "none";
}


// ================================
// SAVE CATEGORY
// ================================

async function saveCategory() {

    const id =
        document.getElementById(
            "categoryId"
        ).value;


    const name =
        document.getElementById(
            "categoryName"
        ).value;


    const description =
        document.getElementById(
            "categoryDescription"
        ).value;


    if (!name) {

        alert(
            "Category name is required"
        );

        return;
    }


    const method =
        id
            ? "PUT"
            : "POST";


    const url =
        id
            ? `${API_URL}/${id}`
            : API_URL;


    const response =
        await fetch(
            url,
            {

                method: method,

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    description:
                        description

                })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        alert(
            data.detail ||
            "Something went wrong"
        );

        return;
    }


    alert(
        id
            ? "Category updated"
            : "Category created"
    );


    closeCategoryForm();

    loadCategories();
}


// ================================
// EDIT CATEGORY
// ================================

function editCategory(
    id,
    name,
    description
) {

    document.getElementById(
        "categoryForm"
    ).style.display = "block";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Edit Category";


    document.getElementById(
        "categoryId"
    ).value =
        id;


    document.getElementById(
        "categoryName"
    ).value =
        name;


    document.getElementById(
        "categoryDescription"
    ).value =
        description;
}


// ================================
// DELETE CATEGORY
// ================================

async function deleteCategory(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this category?"
        );


    if (!confirmDelete) {

        return;
    }


    const response =
        await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        alert(
            data.detail ||
            "Unable to delete category"
        );

        return;
    }


    alert(
        "Category deleted successfully"
    );


    loadCategories();
}


// ================================
// LOAD CATEGORIES ON PAGE LOAD
// ================================

loadCategories();