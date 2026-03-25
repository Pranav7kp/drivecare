// 1. ADMIN CONFIG
const ADMIN_ID = "admindrivecare";
const ADMIN_PASS = "drivecare@123";

// 2. LOGIN FUNCTION (For login.html)
function login() {
    const phone = document.getElementById('loginPhone').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (phone === ADMIN_ID && pass === ADMIN_PASS) {
        sessionStorage.setItem('dc_session', JSON.stringify({ name: 'Admin', role: 'admin' }));
        window.location.href = 'admin.html';
        return;
    }

    const users = JSON.parse(localStorage.getItem('dc_users') || '[]');
    // We use btoa for simple password matching if you used it in signup
    const user = users.find(u => u.phone === phone && u.password === btoa(pass));

    if (user) {
        sessionStorage.setItem('dc_session', JSON.stringify({ ...user, role: 'user' }));
        window.location.href = 'dashboard.html';
    } else {
        alert("Invalid credentials!");
    }
}

// 3. THE GUEST CHECK (For index.html)
function openBooking() {
    const session = JSON.parse(sessionStorage.getItem('dc_session'));

    if (!session) {
        // GUEST: Show alert and send to login
        alert("Login Required! Please sign in to book a service.");
        window.location.href = 'login.html';
    } else {
        // LOGGED IN: Go to dashboard to select date
        window.location.href = 'dashboard.html';
    }
}

function logout() {
    sessionStorage.removeItem('dc_session');
    window.location.href = 'index.html';
}