/**
 * DriveCare — Core Application Logic
 * Full Version: Includes Admin admindrivecare & Password Recovery
 */

// ===== 1. CONFIGURATION & DATABASE =====
const ADMIN_CREDS = { 
    phone: 'admindrivecare', 
    password: 'drivecare@123' 
};

const DC = {
    // ---- USER STORAGE ----
    getUsers() {
        return JSON.parse(localStorage.getItem('dc_users') || '[]');
    },
    saveUser(user) {
        const users = this.getUsers();
        // Encrypt password using btoa for consistency with existing logic
        const newUser = { 
            ...user, 
            id: Date.now(), 
            password: btoa(user.password), 
            createdAt: new Date().toISOString() 
        };
        users.push(newUser);
        localStorage.setItem('dc_users', JSON.stringify(users));
    },
    findUser(phone, password) {
        return this.getUsers().find(u => u.phone === phone && u.password === btoa(password));
    },

    // ---- SESSION MANAGEMENT ----
    setSession(user) {
        sessionStorage.setItem('dc_session', JSON.stringify({ ...user, loginAt: Date.now() }));
    },
    getSession() {
        const s = sessionStorage.getItem('dc_session');
        return s ? JSON.parse(s) : null;
    },
    clearSession() {
        sessionStorage.removeItem('dc_session');
    },

    // ---- UI NOTIFICATIONS ----
    toast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; padding: 16px 28px; 
            background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white;
            border-radius: 12px; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
            z-index: 10000; transition: 0.3s; font-family: sans-serif;
        `;
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    }
};

// ===== 2. LOGIN & AUTHENTICATION =====
function login() {
    const phoneInput = document.getElementById('loginPhone');
    const passInput = document.getElementById('loginPass');
    const btn = document.getElementById('loginBtn');
    const errBox = document.getElementById('loginError');
    const errMsg = document.getElementById('loginErrMsg');

    if (!phoneInput || !passInput) return;

    const phone = phoneInput.value.trim();
    const pass = passInput.value;

    // Reset UI
    if (errBox) errBox.style.display = 'none';
    
    if (!phone || !pass) {
        DC.toast("Please fill in all fields", "error");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Authenticating...";

    setTimeout(() => {
        // A. ADMIN CHECK
        if (phone === ADMIN_CREDS.phone && pass === ADMIN_CREDS.password) {
            DC.setSession({ name: 'System Admin', role: 'admin', phone: 'admindrivecare' });
            DC.toast("Admin access granted");
            window.location.href = 'admin.html';
            return;
        }

        // B. USER CHECK
        const user = DC.findUser(phone, pass);
        if (user) {
            DC.setSession({ ...user, role: 'user' });
            DC.toast(`Welcome back, ${user.name.split(' ')[0]}!`);
            window.location.href = 'dashboard.html';
        } else {
            btn.disabled = false;
            btn.innerText = "Sign In";
            if (errBox) {
                errBox.style.display = 'flex';
                errMsg.innerText = "Invalid ID or Password";
            }
        }
    }, 600);
}

// ===== 3. FORGOT PASSWORD LOGIC =====
function handleForgot() {
    const id = prompt("Enter your Phone Number or Admin ID:");
    if (!id) return;

    // Admin Recovery
    if (id === ADMIN_CREDS.phone) {
        alert("For security, Admin password resets must be done via the configuration file.");
        return;
    }

    // User Recovery
    const users = DC.getUsers();
    const userIndex = users.findIndex(u => u.phone === id);

    if (userIndex !== -1) {
        const newPass = prompt("Enter new password (min 6 chars):");
        if (newPass && newPass.length >= 6) {
            users[userIndex].password = btoa(newPass);
            localStorage.setItem('dc_users', JSON.stringify(users));
            DC.toast("Password updated successfully!");
        } else {
            DC.toast("Invalid password", "error");
        }
    } else {
        DC.toast("Account not found", "error");
    }
}

// ===== 4. SIGNUP LOGIC =====
function signup() {
    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const pass = document.getElementById('pass').value;

    if (!fname || !phone || !pass) {
        DC.toast("Missing required fields", "error");
        return;
    }

    if (DC.getUsers().find(u => u.phone === phone)) {
        DC.toast("Phone already registered", "error");
        return;
    }

    DC.saveUser({
        name: `${fname} ${lname}`,
        phone: phone,
        password: pass
    });

    DC.toast("Account created! Redirecting...");
    setTimeout(() => window.location.href = 'login.html', 1200);
}

// ===== 5. GLOBAL HELPERS =====
function logout() {
    DC.clearSession();
    window.location.href = 'index.html';
}

function openBooking() {
    const session = DC.getSession();
    if (!session) {
        DC.toast("Login required to book", "error");
        setTimeout(() => window.location.href = 'login.html', 1000);
    } else {
        const overlay = document.getElementById('bookingOverlay');
        if (overlay) overlay.classList.add('active');
    }
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    // This handles any initial UI state needed
    console.log("DriveCare Engine Ready.");
});