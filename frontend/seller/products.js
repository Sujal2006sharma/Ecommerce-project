// =====================================================
// FastAPI URL
// =====================================================

const API_URL = "http://127.0.0.1:8000";


// =====================================================
// STATUS LIST
// =====================================================

let statusList = [];


// =====================================================
// SELECTED IMAGES
// =====================================================

let selectedImages = [];


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await loadStatuses();

        await loadCategories();

        await getProducts();

    }
);


// =====================================================
// LOAD CATEGORIES
// =====================================================

async function loadCategories() {

    try {

        const response = await fetch(
            `${API_URL}/categories`
        );


        if (!response.ok) {

            throw new Error(
                "Failed to load categories"
            );

        }


        const categories =
            await response.json();


        console.log(
            "GET /categories response:",
            categories
        );


        const categoryDropdown =
            document.getElementById(
                "productCategory"
            );


        if (!categoryDropdown) {

            return;

        }


        // Keep default option

        categoryDropdown.innerHTML = `
            <option value="">
                Select Category
            </option>
        `;


        // Add categories

        categories.forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.id;


                option.textContent =
                    category.name;


                categoryDropdown.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "LOAD CATEGORIES ERROR:",
            error
        );


        showMessage(
            "Unable to load categories",
            "error"
        );

    }

}


// =====================================================
// LOAD STATUSES
// =====================================================

async function loadStatuses() {

    try {

        const response =
            await fetch(
                `${API_URL}/status`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load statuses"
            );

        }


        const result =
            await response.json();


        statusList =
            result.data || [];


        console.log(
            "Statuses:",
            statusList
        );

    }

    catch (error) {

        console.error(
            "LOAD STATUS ERROR:",
            error
        );


        statusList = [];

    }

}


// =====================================================
// GET PRODUCTS
// =====================================================

async function getProducts() {

    try {

        const response =
            await fetch(
                `${API_URL}/products`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load products"
            );

        }


        const result =
            await response.json();


        console.log(
            "GET /products response:",
            result
        );


        displayProducts(
            result.data
        );


    }

    catch (error) {

        console.error(
            "GET PRODUCTS ERROR:",
            error
        );


        showMessage(
            "Unable to load products",
            "error"
        );

    }

}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================

function displayProducts(products) {

    const tableBody =
        document.getElementById(
            "productTableBody"
        );


    const emptyMessage =
        document.getElementById(
            "emptyMessage"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (
        !products ||
        products.length === 0
    ) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";

        }

        return;

    }


    if (emptyMessage) {

        emptyMessage.style.display =
            "none";

    }


    products.forEach(
        function (product) {

            const row =
                document.createElement("tr");


            // =================================================
            // STOCK
            // =================================================

            const stockAvailable =
                product.quantity > 0;


            // =================================================
            // PRODUCT IMAGES FROM DATABASE
            // =================================================

            const images =
                product.images || [];


            // First image only

            const firstImage =
                images.length > 0 &&
                images[0].url
                    ? `${API_URL}${images[0].url}`
                    : null;


            // =================================================
            // CURRENT STATUS
            // =================================================

            const currentStatusId =
                product.status_id || "";


            const currentStatusName =
                product.status_name ||
                product.status?.name ||
                "Select Status";


            // =================================================
            // PRODUCT ROW
            // =================================================
row.innerHTML = `

    <!-- Checkbox -->

    <td>

        <input
            type="checkbox"
            class="product-checkbox"
            value="${product.id}"
        >

    </td>


    <!-- Product -->

    <td>

        <div class="product-info product-clickable">

            <div class="product-image">

                ${
                    firstImage
                    ? `
                        <img
                            src="${firstImage}"
                            alt="${product.name}"
                        >
                      `
                    : "📦"
                }

            </div>


            <div>

                <div class="product-name">

                    ${product.name}

                </div>


                <div class="product-description">

                    Product ID: ${product.id}

                </div>

            </div>

        </div>

    </td>


    <!-- Category -->

    <td>

        <div class="category">

            <div class="category-icon">
                📦
            </div>

            <span>

                ${product.category_name || "Product"}

            </span>

        </div>

    </td>


    <!-- Stock -->

    <td>

        <label class="switch">

            <input
                type="checkbox"
                ${stockAvailable ? "checked" : ""}
                onchange="
                    changeStock(
                        ${product.id},
                        this.checked
                    )
                "
            >

            <span class="slider"></span>

        </label>

    </td>


    <!-- SKU -->

    <td>

        ${product.id}

    </td>


    <!-- Price -->

    <td class="price">

        $${Number(product.price).toFixed(2)}

    </td>


    <!-- Quantity -->

    <td class="quantity">

        ${product.quantity}

    </td>


    <!-- STATUS -->

    <td>

        <select
            class="status-select"
            onchange="
                updateProductStatus(
                    ${product.id},
                    this.value
                )
            "
        >

            <option
                value=""
                ${!product.status_id ? "selected" : ""}
            >

                Select Status

            </option>


            ${statusList.map(function(status) {

                return `

                    <option
                        value="${status.id}"
                        ${
                            Number(product.status_id) ===
                            Number(status.id)
                                ? "selected"
                                : ""
                        }
                    >

                        ${status.name}

                    </option>

                `;

            }).join("")}

        </select>

    </td>


    <!-- Actions -->

    <td>

        <div class="actions">

            <button
                class="action-btn"
                onclick='editProduct(${JSON.stringify(product)})'
                title="Edit"
            >

                ✏️

            </button>


            <button
                class="action-btn delete-btn"
                onclick="deleteProduct(${product.id})"
                title="Delete"
            >

                ⋮

            </button>

        </div>

    </td>

`;


tableBody.appendChild(row);

            // =================================================
            // PRODUCT CLICK → IMAGE GALLERY
            // =================================================

            const productClickable =
                row.querySelector(
                    ".product-clickable"
                );


            if (productClickable) {

                productClickable.addEventListener(
                    "click",
                    function () {

                        openImageGallery(
                            product.id,
                            product.name,
                            product.images || []
                        );

                    }
                );

            }

        }
    );

}


// =====================================================
// OPEN ADD MODAL
// =====================================================

function openAddModal() {

    document.getElementById(
        "modalTitle"
    ).innerText =
        "Add Product";


    document.getElementById(
        "productIdGroup"
    ).style.display =
        "none";


    document.getElementById(
        "productId"
    ).value =
        "";


    document.getElementById(
        "productName"
    ).value =
        "";


    document.getElementById(
        "productPrice"
    ).value =
        "";


    document.getElementById(
        "productQuantity"
    ).value =
        "";


    document.getElementById(
        "productCategory"
    ).value =
        "";


    document.getElementById(
        "productId"
    ).disabled =
        true;


    // Reset selected images

    selectedImages = [];


    const imageInput =
        document.getElementById(
            "productImageUpload"
        );


    if (imageInput) {

        imageInput.value = "";

    }


    document.getElementById(
        "productModal"
    ).style.display =
        "flex";

}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeModal() {

    document.getElementById(
        "productModal"
    ).style.display =
        "none";

}


// =====================================================
// EDIT PRODUCT
// =====================================================

function editProduct(product) {

    document.getElementById(
        "modalTitle"
    ).innerText =
        "Edit Product";


    document.getElementById(
        "productIdGroup"
    ).style.display =
        "block";


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name;


    document.getElementById(
        "productPrice"
    ).value =
        product.price;


    document.getElementById(
        "productQuantity"
    ).value =
        product.quantity;


    document.getElementById(
        "productCategory"
    ).value =
        product.category_id || "";


    document.getElementById(
        "productId"
    ).disabled =
        true;


    // Reset selected images

    selectedImages = [];


    const imageInput =
        document.getElementById(
            "productImageUpload"
        );


    if (imageInput) {

        imageInput.value = "";

    }


    document.getElementById(
        "productModal"
    ).style.display =
        "flex";

}


// =====================================================
// PRODUCT IMAGE INPUT
// =====================================================

function handleProductImageSelection(
    event
) {

    selectedImages =
        Array.from(
            event.target.files
        );


    console.log(
        "Selected images:",
        selectedImages
    );

}


// =====================================================
// SAVE PRODUCT
// ADD OR EDIT
// =====================================================

async function saveProduct() {

    const productId =
        document.getElementById(
            "productId"
        ).value;


    const name =
        document.getElementById(
            "productName"
        ).value.trim();


    const price =
        document.getElementById(
            "productPrice"
        ).value;


    const quantity =
        document.getElementById(
            "productQuantity"
        ).value;


    const categoryId =
        document.getElementById(
            "productCategory"
        ).value;


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !name ||
        !price ||
        !quantity ||
        !categoryId
    ) {

        alert(
            "Please fill all fields"
        );

        return;

    }


    // =================================================
    // PRODUCT DATA
    // =================================================

    const productData = {

        name: name,

        price: Number(price),

        quantity: Number(quantity),

        category_id: Number(categoryId)

    };


    try {

        let response;


        // =================================================
        // EDIT PRODUCT
        // =================================================

        if (productId) {

            response =
                await fetch(
                    `${API_URL}/products/${productId}`,
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


        // =================================================
        // ADD PRODUCT
        // =================================================

        else {

            response =
                await fetch(
                    `${API_URL}/products`,
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


        // =================================================
        // RESPONSE
        // =================================================

        const data =
            await response.json();


        console.log(
            "SAVE PRODUCT RESPONSE:",
            data
        );


        // =================================================
        // CHECK PRODUCT SAVE
        // =================================================

        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to save product"
            );

            return;

        }


        // =================================================
        // GET PRODUCT ID
        // =================================================

        const uploadedProductId =
            productId ||
            data.data?.id;


        // =================================================
        // UPLOAD PRODUCT IMAGES
        // =================================================

        if (
            selectedImages.length > 0 &&
            uploadedProductId
        ) {

            console.log(
                "Product ID for image upload:",
                uploadedProductId
            );


            for (
                const file of selectedImages
            ) {

                const formData =
                    new FormData();


                formData.append(
                    "file",
                    file
                );


                console.log(
                    "Uploading image:",
                    file.name
                );


                const imageResponse =
                    await fetch(
                        `${API_URL}/products/${uploadedProductId}/images`,
                        {

                            method: "POST",

                            body: formData

                        }
                    );


                const imageData =
                    await imageResponse.json();


                console.log(
                    "IMAGE UPLOAD RESPONSE:",
                    imageData
                );


                if (!imageResponse.ok) {

                    alert(
                        imageData.detail ||
                        `Failed to upload image: ${file.name}`
                    );

                    return;

                }

            }


            console.log(
                "All images uploaded successfully"
            );

        }


        // =================================================
        // SUCCESS
        // =================================================

        if (productId) {

            alert(
                "Product updated successfully"
            );

        }

        else {

            alert(
                "Product created successfully"
            );

        }


        // Clear selected images

        selectedImages = [];


        // Close modal

        closeModal();


        // Reload products

        await getProducts();

    }

    catch (error) {

        console.error(
            "SAVE PRODUCT ERROR:",
            error
        );


        alert(
            "Unable to connect to FastAPI"
        );

    }

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this product?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/products/${id}`,
                {

                    method: "DELETE"

                }
            );


        if (!response.ok) {

            throw new Error(
                "Delete failed"
            );

        }


        showMessage(
            "Product deleted successfully",
            "success"
        );


        getProducts();

    }

    catch (error) {

        console.error(
            error
        );


        showMessage(
            "Unable to delete product",
            "error"
        );

    }

}


// =====================================================
// STOCK TOGGLE
// =====================================================

async function changeStock(
    id,
    isAvailable
) {

    try {

        const response =
            await fetch(
                `${API_URL}/products/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to get product"
            );

        }


        const product =
            await response.json();


        let quantity;


        if (isAvailable) {

            quantity =
                product.quantity > 0
                    ? product.quantity
                    : 1;

        }

        else {

            quantity = 0;

        }


        const updateResponse =
            await fetch(
                `${API_URL}/products/${id}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name:
                                product.name,

                            price:
                                product.price,

                            quantity:
                                quantity,

                            category_id:
                                product.category_id

                        })

                }
            );


        if (!updateResponse.ok) {

            throw new Error(
                "Stock update failed"
            );

        }


        getProducts();

    }

    catch (error) {

        console.error(
            error
        );


        showMessage(
            "Unable to update stock",
            "error"
        );

    }

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "message"
        );


    if (!messageElement) {

        return;

    }


    messageElement.innerText =
        message;


    messageElement.className =
        type;


    setTimeout(
        function () {

            messageElement.innerText =
                "";

        },
        3000
    );

}


// =====================================================
// SELECT ALL
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const selectAll =
            document.getElementById(
                "selectAll"
            );


        if (selectAll) {

            selectAll.addEventListener(
                "change",
                function () {

                    const checkboxes =
                        document.querySelectorAll(
                            ".product-checkbox"
                        );


                    checkboxes.forEach(
                        function (checkbox) {

                            checkbox.checked =
                                selectAll.checked;

                        }
                    );

                }
            );

        }

    }
);


// =====================================================
// CLOSE PRODUCT MODAL WHEN CLICKING OUTSIDE
// =====================================================

window.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "productModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeModal();

        }

    }
);


// =====================================================
// DELETE ALL PRODUCTS
// =====================================================

async function deleteAllProducts() {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete ALL products?\n\n" +
            "This will also reset the Product ID back to 1."
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/products`,
                {

                    method: "DELETE"

                }
            );


        if (!response.ok) {

            const errorData =
                await response.json();


            console.error(
                "Delete All Error:",
                errorData
            );


            alert(
                "Unable to delete all products"
            );


            return;

        }


        const result =
            await response.json();


        console.log(
            "Delete All Response:",
            result
        );


        showMessage(
            "All products deleted. ID will start from 1.",
            "success"
        );


        getProducts();

    }

    catch (error) {

        console.error(
            "Connection Error:",
            error
        );


        alert(
            "Unable to connect to FastAPI"
        );

    }

}


// =====================================================
// PRODUCT IMAGE GALLERY
// =====================================================

let currentGalleryImages = [];

let currentImageIndex = 0;

let currentGalleryProductId = null;


// =====================================================
// OPEN IMAGE GALLERY
// =====================================================

function openImageGallery(
    productId,
    productName,
    images
) {

    currentGalleryProductId =
        productId;


    if (
        !images ||
        images.length === 0
    ) {

        alert(
            "No images available for this product."
        );

        return;

    }


    // =================================================
    // CONVERT DATABASE IMAGE URLS
    // =================================================

    currentGalleryImages =
        images
            .filter(
                function (image) {

                    return (
                        image &&
                        image.url &&
                        image.id
                    );

                }
            )
            .map(
                function (image) {

                    return {

                        id:
                            image.id,

                        url:
                            `${API_URL}${image.url}`

                    };

                }
            );


    if (
        currentGalleryImages.length === 0
    ) {

        alert(
            "No valid images available for this product."
        );

        return;

    }


    currentImageIndex = 0;


    // =================================================
    // PRODUCT NAME
    // =================================================

    const galleryProductName =
        document.getElementById(
            "galleryProductName"
        );


    if (galleryProductName) {

        galleryProductName.innerText =
            productName;

    }


    // =================================================
    // PRODUCT INFO
    // =================================================

    const galleryProductInfo =
        document.getElementById(
            "galleryProductInfo"
        );


    if (galleryProductInfo) {

        galleryProductInfo.innerText =
            `Product ID: ${productId}`;

    }


    // =================================================
    // SHOW FIRST IMAGE
    // =================================================

    updateGallery();


    // =================================================
    // SHOW GALLERY MODAL
    // =================================================

    const galleryModal =
        document.getElementById(
            "imageGalleryModal"
        );


    if (galleryModal) {

        galleryModal.style.display =
            "flex";

    }

}


// =====================================================
// UPDATE GALLERY
// =====================================================

function updateGallery() {

    if (
        !currentGalleryImages ||
        currentGalleryImages.length === 0
    ) {

        return;

    }


    // =================================================
    // MAIN IMAGE
    // =================================================

    const mainImage =
        document.getElementById(
            "galleryMainImage"
        );


    if (mainImage) {

        mainImage.src =
            currentGalleryImages[
                currentImageIndex
            ].url;

    }


    // =================================================
    // COUNTER
    // =================================================

    const galleryCounter =
        document.getElementById(
            "galleryCounter"
        );


    if (galleryCounter) {

        galleryCounter.innerText =
            `${currentImageIndex + 1} / ${currentGalleryImages.length}`;

    }


    // =================================================
    // THUMBNAILS
    // =================================================

    const thumbnails =
        document.getElementById(
            "galleryThumbnails"
        );


    if (!thumbnails) {

        return;

    }


    thumbnails.innerHTML = "";


    currentGalleryImages.forEach(
        function (image, index) {

            const thumbnailContainer =
                document.createElement(
                    "div"
                );


            thumbnailContainer.className =
                "thumbnail-container";


            const thumbnail =
                document.createElement(
                    "img"
                );


            thumbnail.src =
                image.url;


            thumbnail.alt =
                `Product Image ${index + 1}`;


            thumbnail.className =
                "gallery-thumbnail";


            if (
                index === currentImageIndex
            ) {

                thumbnail.classList.add(
                    "active"
                );

            }


            thumbnail.onclick =
                function () {

                    currentImageIndex =
                        index;


                    updateGallery();

                };


            // =================================================
            // DELETE IMAGE BUTTON
            // =================================================

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.innerText =
                "🗑 Delete";


            deleteButton.className =
                "delete-image-btn";


            deleteButton.onclick =
                function (event) {

                    event.stopPropagation();


                    deleteProductImage(
                        image.id,
                        index
                    );

                };


            thumbnailContainer.appendChild(
                thumbnail
            );


            thumbnailContainer.appendChild(
                deleteButton
            );


            thumbnails.appendChild(
                thumbnailContainer
            );

        }
    );

}


// =====================================================
// NEXT IMAGE
// =====================================================

function nextImage() {

    if (
        currentGalleryImages.length === 0
    ) {

        return;

    }


    currentImageIndex++;


    if (
        currentImageIndex >=
        currentGalleryImages.length
    ) {

        currentImageIndex = 0;

    }


    updateGallery();

}


// =====================================================
// PREVIOUS IMAGE
// =====================================================

function previousImage() {

    if (
        currentGalleryImages.length === 0
    ) {

        return;

    }


    currentImageIndex--;


    if (
        currentImageIndex < 0
    ) {

        currentImageIndex =
            currentGalleryImages.length - 1;

    }


    updateGallery();

}


// =====================================================
// CLOSE GALLERY
// =====================================================

function closeImageGallery() {

    const galleryModal =
        document.getElementById(
            "imageGalleryModal"
        );


    if (galleryModal) {

        galleryModal.style.display =
            "none";

    }

}


// =====================================================
// CLOSE GALLERY WHEN CLICKING OUTSIDE
// =====================================================

window.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "imageGalleryModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeImageGallery();

        }

    }
);


// =====================================================
// KEYBOARD CONTROLS
// =====================================================

document.addEventListener(
    "keydown",
    function (event) {

        const modal =
            document.getElementById(
                "imageGalleryModal"
            );


        if (
            !modal ||
            modal.style.display !== "flex"
        ) {

            return;

        }


        if (
            event.key === "ArrowRight"
        ) {

            nextImage();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            previousImage();

        }


        if (
            event.key === "Escape"
        ) {

            closeImageGallery();

        }

    }
);


// =====================================================
// DELETE PRODUCT IMAGE
// =====================================================

async function deleteProductImage(
    imageId,
    imageIndex
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this image?"
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/images/${imageId}`,
                {

                    method: "DELETE"

                }
            );


        const data =
            await response.json();


        console.log(
            "DELETE IMAGE RESPONSE:",
            data
        );


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to delete image"
            );

            return;

        }


        currentGalleryImages.splice(
            imageIndex,
            1
        );


        if (
            currentGalleryImages.length === 0
        ) {

            closeImageGallery();


            alert(
                "Image deleted successfully"
            );


            getProducts();


            return;

        }


        if (
            currentImageIndex >=
            currentGalleryImages.length
        ) {

            currentImageIndex =
                currentGalleryImages.length - 1;

        }


        updateGallery();


        getProducts();


        alert(
            "Image deleted successfully"
        );

    }

    catch (error) {

        console.error(
            "DELETE IMAGE ERROR:",
            error
        );


        alert(
            "Unable to connect to FastAPI"
        );

    }

}


// =====================================================
// UPLOAD IMAGES FROM GALLERY
// =====================================================

async function uploadGalleryImages() {

    const imageInput =
        document.getElementById(
            "galleryImageUpload"
        );


    const selectedGalleryImages =
        imageInput.files;


    if (!currentGalleryProductId) {

        alert(
            "Product ID not found."
        );

        return;

    }


    if (
        !selectedGalleryImages ||
        selectedGalleryImages.length === 0
    ) {

        alert(
            "Please select one or more images."
        );

        return;

    }


    try {

        for (
            const file of selectedGalleryImages
        ) {

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            const response =
                await fetch(
                    `${API_URL}/products/${currentGalleryProductId}/images`,
                    {

                        method: "POST",

                        body: formData

                    }
                );


            const data =
                await response.json();


            console.log(
                "IMAGE UPLOAD RESPONSE:",
                data
            );


            if (!response.ok) {

                alert(
                    data.detail ||
                    `Failed to upload ${file.name}`
                );

                return;

            }

        }


        alert(
            "Images uploaded successfully!"
        );


        imageInput.value = "";


        await getProducts();


        // =================================================
        // RELOAD CURRENT GALLERY
        // =================================================

        const productResponse =
            await fetch(
                `${API_URL}/products`
            );


        const productResult =
            await productResponse.json();


        const updatedProduct =
            productResult.data.find(
                function (product) {

                    return (
                        product.id ===
                        currentGalleryProductId
                    );

                }
            );


        if (updatedProduct) {

            openImageGallery(
                updatedProduct.id,
                updatedProduct.name,
                updatedProduct.images
            );

        }

    }

    catch (error) {

        console.error(
            "GALLERY IMAGE UPLOAD ERROR:",
            error
        );


        alert(
            "Unable to connect to FastAPI"
        );

    }

}


// =====================================================
// UPDATE PRODUCT STATUS
// =====================================================

async function updateProductStatus(
    productId,
    statusId
) {

    if (!statusId) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/products/${productId}/status?status_id=${statusId}`,
                {

                    method: "PUT"

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to update status"
            );

            return;

        }


        console.log(
            "STATUS UPDATED:",
            data
        );


        showMessage(
            "Order status updated successfully",
            "success"
        );


        await getProducts();

    }

    catch (error) {

        console.error(
            "UPDATE STATUS ERROR:",
            error
        );


        alert(
            "Unable to connect to FastAPI"
        );

    }

}

