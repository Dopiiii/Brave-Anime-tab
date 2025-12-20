document.addEventListener("DOMContentLoaded", () => {
    const clockElement = document.getElementById('clock');
    const searchBar = document.getElementById('search-bar');

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}`;
    }

    // Update the clock every second
    setInterval(updateClock, 1000);
    updateClock(); // Initial call to display time immediately

    // Search functionality
    if (searchBar) {
        searchBar.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const query = searchBar.value.trim();
                if (query) {
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                }
            }
        });

        // Focus search bar on page load
        searchBar.focus();
    }
});
