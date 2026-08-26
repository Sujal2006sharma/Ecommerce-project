"use strict";

const API_URL = "http://127.0.0.1:8000";

// Handle Product Creation Form Submit
async function handleProductSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQty").value);
    const category_id = parseInt(document.getElementById("productCategory").value);
    const imageInput = document.getElementById("productImageFile");

    let imageUrl = "";

    // 1. Upload file if selected by seller
    if (imageInput && imageInput.files.length > 0) {
        const formData = new FormData();
        formData.append("file", imageInput.files[0]);

        try {
            const uploadRes = await authFetch(`${API_URL}/upload-image`, {
                method: "POST",
                body: formData // Note: Do not set Content-Type header when sending FormData
            });

            if (uploadRes && uploadRes.ok) {
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.image_url;
            } else {
                alert("Failed to upload product image.");
                return;
            }
        } catch (err) {
            console.error("IMAGE UPLOAD ERROR:", err);
            alert("Error uploading image file.");
            return;
        }
    }

    // 2. Save product with database record
    const productPayload = {
        name: name,
        price: price,
        quantity: quantity,
        category_id: category_id,
        image_url: imageUrl
    };

    try {
        const response = await authFetch(`${API_URL}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productPayload)
        });

        if (response && response.ok) {
            alert("Product created successfully!");
            location.reload();
        } else {
            const errData = await response.json().catch(() => ({}));
            alert(errData.detail || "Failed to save product.");
        }
    } catch (err) {
        console.error("SAVE PRODUCT ERROR:", err);
    }
}