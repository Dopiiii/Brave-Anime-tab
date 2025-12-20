document.addEventListener("DOMContentLoaded", () => {
    const titleElement = document.querySelector('title');
    const text = "ATS-Hub";
    let index = 0;
    let isDeleting = false;

    function typeAnimation() {
        if (!isDeleting) {
            // Typing phase
            if (index < text.length) {
                titleElement.textContent = text.substring(0, index + 1);
                index++;
                setTimeout(typeAnimation, 200); // Slower typing speed
            } else {
                // Wait before deleting
                setTimeout(() => {
                    isDeleting = true;
                    typeAnimation();
                }, 2500); // Wait 2.5 seconds before deleting
            }
        } else {
            // Deleting phase - stop at "A"
            if (titleElement.textContent.length > 1) {
                titleElement.textContent = titleElement.textContent.slice(0, -1);
                setTimeout(typeAnimation, 350); // Much slower deleting speed
            } else {
                // Reset for next cycle
                isDeleting = false;
                index = 0;
                setTimeout(typeAnimation, 500); // Wait 0.5s before retyping
            }
        }
    }

    // Start the animation
    typeAnimation();
});
