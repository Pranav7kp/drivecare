// --- CONFIGURATION ---
const ADMIN_ID = "admindrivecare";
const ADMIN_PASS = "drivecare@123";

// --- LOGIN LOGIC ---
function login() {
    const phone = document.getElementById('loginPhone').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (phone === ADMIN_ID && pass === ADMIN_PASS) {
        sessionStorage.setItem('dc_session', JSON.stringify({ name: 'Admin', role: 'admin' }));
        window.location.href = 'admin.html';
        return;
    }

    const users = JSON.parse(localStorage.getItem('dc_users') || '[]');
    const user = users.find(u => u.phone === phone && u.password === btoa(pass));

    if (user) {
        sessionStorage.setItem('dc_session', JSON.stringify({ ...user, role: 'user' }));
        window.location.href = 'dashboard.html';
    } else {
        alert("Invalid credentials! Please try again.");
    }
}

// --- BOOKING LOGIC (GUEST CHECK) ---
function openBooking() {
    const session = JSON.parse(sessionStorage.getItem('dc_session'));

    if (!session) {
        // This runs if a guest clicks "Book Now"
        alert("Authentication Required! Please login to book a service.");
        window.location.href = 'login.html';
    } else {
        // If logged in, take them to the booking dashboard
        window.location.href = 'dashboard.html';
    }
}

// --- LOGOUT ---
function logout() {
    sessionStorage.removeItem('dc_session');
    window.location.href = 'index.html';
}