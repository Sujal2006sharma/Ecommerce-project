"use strict";


// =====================================================
// GET ELEMENTS
// =====================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


const message =
    document.getElementById(
        "message"
    );


// =====================================================
// LOGIN FORM SUBMIT
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // =========================================
            // GET VALUES
            // =========================================

            const username =
                document.getElementById(
                    "username"
                ).value.trim();


            const password =
                document.getElementById(
                    "password"
                ).value;


            // =========================================
            // VALIDATION
            // =========================================

            if (
                !username ||
                !password
            ) {

                showMessage(
                    "Please enter username and password.",
                    "error"
                );

                return;

            }


            // =========================================
            // LOGIN BUTTON
            // =========================================

            const loginButton =
                loginForm.querySelector(
                    "button[type='submit']"
                );


            loginButton.disabled =
                true;


            loginButton.textContent =
                "Logging in...";


            try {

                // =====================================
                // LOGIN
                // =====================================

                const data =
                    await loginUser(
                        username,
                        password
                    );


                // =====================================
                // SUCCESS MESSAGE
                // =====================================

                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                // =====================================
                // REDIRECT USER BY ROLE
                // =====================================

                setTimeout(
                    function () {

                        redirectByRole(
                            data.role
                        );

                    },
                    500
                );

            }

            catch (error) {

                console.error(
                    "LOGIN PAGE ERROR:",
                    error
                );


                showMessage(
                    error.message ||
                    "Login failed.",
                    "error"
                );


                loginButton.disabled =
                    false;


                loginButton.textContent =
                    "Login";

            }

        }
    );

}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type
) {

    if (!message) {

        alert(text);

        return;

    }


    message.textContent =
        text;


    message.className =
        `message ${type}`;

}