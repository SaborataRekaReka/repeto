document.addEventListener("DOMContentLoaded", function () {

    // Newsletter Form Submission
    const newsletterForm = document.querySelector(".footer__newsletter-form");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function (e) {
            e.preventDefault(); // Prevent page reload
    
            let form = this;
            let messageBox = document.getElementById("footer__form-message");
            let submitButton = document.querySelector(".footer__submit-btn");
    
            if (!messageBox || !submitButton) {
                console.error('Required elements for the form are missing!');
                return;
            }
    
            submitButton.disabled = true;
            messageBox.textContent = "Submitting...";
    
            // Simulate AJAX request
            setTimeout(() => {
                messageBox.textContent = "Successfully Subscribed!";
                messageBox.classList.add("active");
    
                form.reset();
                submitButton.disabled = false;
    
                setTimeout(() => {
                    messageBox.classList.remove("active");
                }, 5000);
            }, 1500);
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById("contact-form");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
    
            let form = this;
            let submitButton = document.querySelector(".ub-contact__btn");
    
            submitButton.disabled = true;
    
            try {
                setTimeout(() => {
                    let isSuccess = true;
    
                    if (isSuccess) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Thank you for contacting us!',
                            icon: 'success',
                            confirmButtonText: 'Close'
                        });
    
                        form.reset();
                        submitButton.disabled = false;
                    } else {
                        throw new Error('Something went wrong while submitting the form!');
                    }
                }, 1500);
            } catch (error) {
                Swal.fire({
                    title: 'Error!',
                    text: error.message || 'There was an issue with the form submission.',
                    icon: 'error',
                    confirmButtonText: 'Close'
                });
                submitButton.disabled = false;
            }
        });
    }

    // Job Application Form Submission
    const jobApplicationForm = document.getElementById("job-application-form");
    if (jobApplicationForm) {
        jobApplicationForm.addEventListener("submit", function(event) {
            event.preventDefault(); 
    
            try {
                Swal.fire({
                    title: "Application Submitted!",
                    text: "Thank you for applying. We will get back to you soon.",
                    icon: "success",
                    confirmButtonText: "OK"
                });
    
                this.reset();
            } catch (error) {
                console.error("Error during form submission:", error);
    
                Swal.fire({
                    title: "Oops!",
                    text: "Something went wrong. Please try again later.",
                    icon: "error",
                    confirmButtonText: "Close"
                });
            }
        });
    }

    // Signin Form Submission
    const signinForm = document.getElementById('signin');
    if (signinForm) {
        signinForm.addEventListener('submit', function (event) {
            event.preventDefault(); 
    
            Swal.fire({
                title: 'Success!',
                text: 'You have successfully signed in.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Optional redirect after alert
            });
        });
    }

    // Signup Form Submission
    const signupForm = document.getElementById('signup');
    if (signupForm) {
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault(); 
    
            Swal.fire({
                title: 'Success!',
                text: 'You have successfully signed up.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Optional redirect after alert
            });
        });
    }
});
