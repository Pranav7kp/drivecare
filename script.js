// ===== 1. ADMIN & SYSTEM CONFIG =====
const ADMIN_CREDS = { 
    phone: 'admindrivecare', 
    password: 'drivecare@123' 
};

// ===== 2. DATA UTILITIES (Local Storage Helpers) =====
const DC = {
    // Get all registered users
    getUsers: () => JSON.parse(localStorage.getItem('dc_users') || '[]'),
    
    // Get all service bookings
    getBookings: () => JSON.parse(localStorage.getItem('dc_bookings') || '[]'),
    
    // Handle the current login session
    setSession: (user) => sessionStorage.setItem('dc_session', JSON.stringify(user)),
    getSession: () => JSON.parse(sessionStorage.getItem('dc_session')),
    
    // Clear session and go home
    logout: () => {
        sessionStorage.removeItem('dc_session');
        window.location.href = 'index.html';
    }
};

// ===== 3. LOGIN FUNCTION (For Login.html) =====
function login() {
    const phoneInput = document.getElementById('loginPhone');
    const passInput = document.getElementById('loginPass');

    if (!phoneInput || !passInput) return;

    const phone = phoneInput.value.trim();
    const pass = passInput.value;

    // A. Check for Admin Login
    if (phone === ADMIN_CREDS.phone && pass === ADMIN_CREDS.password) {
        DC.setSession({ name: 'System Admin', role: 'admin', phone: 'admin' });
        window.location.href = 'admin.html';
        return;
    }

    // B. Check for Registered User Login
    const users = DC.getUsers();
    // Use btoa to match the "encryption" used during signup
    const user = users.find(u => u.phone === phone && u.password === btoa(pass));

    if (user) {
        DC.setSession({ ...user, role: 'user' });
        window.location.href = 'dashboard.html';
    } else {
        alert("Invalid credentials. Please try again!");
    }
}

// ===== 4. BOOKING LOGIC (For Index & Dashboard) =====
function openBooking() {
    const session = DC.getSession();
    
    // If NOT logged in, redirect to login page
    if (!session) {
        alert("Authentication required. Please log in to book a service.");
        window.location.href = 'login.html';
        return;
    }

    // If logged in, look for the booking modal on the current page
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'flex'; // Shows the popup
    } else {
        // If they click 'Book' on index.html but are logged in, send to Dashboard
        window.location.href = 'dashboard.html';
    }
}

function submitBooking() {
    const service = document.getElementById('serviceType').value;
    const date = document.getElementById('bookDate').value;
    const session = DC.getSession();

    if (!date) {
        alert("Please select a valid date for your service.");
        return;
    }

    const bookings = DC.getBookings();
    
    // Create new booking object
    const newBooking = {
        id: Date.now(),
        userPhone: session.phone,
        userName: session.name,
        service: service,
        date: date,
        status: 'Pending'
    };

    bookings.push(newBooking);
    localStorage.setItem('dc_bookings', JSON.stringify(bookings));
    
    alert("Success! Your booking has been recorded.");
    location.reload(); // Refresh to show the new booking in the list
}

// ===== 5. SIGNUP LOGIC (For Signup.html) =====
function signup() {
    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pass = document.getElementById('pass').value;

    if (!fname || !phone || !pass) {
        alert("Please fill in all required fields.");
        return;
    }

    const users = DC.getUsers();
    if (users.find(u => u.phone === phone)) {
        alert("This phone number is already registered.");
        return;
    }

    users.push({
        name: `${fname} ${lname}`,
        phone: phone,
        password: btoa(pass) // Simple encoding for storage
    });

    localStorage.setItem('dc_users', JSON.stringify(users));
    alert("Account created successfully! You can now log in.");
    window.location.href = 'login.html';
}