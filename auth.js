// ===========================================================
// Authentication Logic - login, register, logout, Google sign-in
// ===========================================================

// Helper: show inline error message in a Bootstrap alert box
function showAuthError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("d-none");
}

function hideAuthError(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.add("d-none");
}

// ---------------- LOGIN ----------------
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Password show/hide toggle
  const togglePwd = document.getElementById("togglePassword");
  const pwdField = document.getElementById("loginPassword");
  if (togglePwd) {
    togglePwd.addEventListener("click", () => {
      const type = pwdField.getAttribute("type") === "password" ? "text" : "password";
      pwdField.setAttribute("type", type);
      togglePwd.classList.toggle("fa-eye");
      togglePwd.classList.toggle("fa-eye-slash");
    });
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideAuthError("loginError");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const remember = document.getElementById("rememberMe").checked;

    if (!email || !password) {
      showAuthError("loginError", "Please fill in all fields.");
      return;
    }

    // Set persistence based on "Remember Me"
    const persistence = remember
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    const btn = document.getElementById("loginBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing In...';

    auth.setPersistence(persistence)
      .then(() => auth.signInWithEmailAndPassword(email, password))
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        showAuthError("loginError", friendlyAuthError(err));
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i>Sign In';
      });
  });

  // Google Sign-In
  const googleBtn = document.getElementById("googleSignIn");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      auth.signInWithPopup(googleProvider)
        .then((result) => {
          // Save basic profile to /users
          const user = result.user;
          refUsers.child(user.uid).set({
            name: user.displayName || "Unknown",
            email: user.email,
            provider: "google",
            lastLogin: new Date().toISOString()
          });
          window.location.href = "index.html";
        })
        .catch((err) => showAuthError("loginError", friendlyAuthError(err)));
    });
  }

  // Forgot password
  const forgotLink = document.getElementById("forgotPassword");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      if (!email) {
        showAuthError("loginError", "Enter your email above first, then click 'Forgot Password'.");
        return;
      }
      auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent to " + email))
        .catch((err) => showAuthError("loginError", friendlyAuthError(err)));
    });
  }
}

// ---------------- REGISTER ----------------
function initRegisterPage() {
  const registerForm = document.getElementById("registerForm");
  if (!registerForm) return;

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideAuthError("registerError");

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirmPassword").value;

    if (!name || !email || !password || !confirm) {
      showAuthError("registerError", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      showAuthError("registerError", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      showAuthError("registerError", "Passwords do not match.");
      return;
    }

    const btn = document.getElementById("registerBtn");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

    auth.createUserWithEmailAndPassword(email, password)
      .then((cred) => {
        return cred.user.updateProfile({ displayName: name }).then(() => {
          return refUsers.child(cred.user.uid).set({
            name: name,
            email: email,
            provider: "password",
            createdAt: new Date().toISOString()
          });
        });
      })
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        showAuthError("registerError", friendlyAuthError(err));
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-user-plus me-2"></i>Create Account';
      });
  });
}

// ---------------- LOGOUT ----------------
function initLogout() {
  document.querySelectorAll(".logoutBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      auth.signOut().then(() => {
        window.location.href = "login.html";
      });
    });
  });
}

// ---------------- ROUTE GUARD ----------------
// Protects internal pages: redirects to login.html if not authenticated
function protectPage() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      // Populate user info in navbar if present
      document.querySelectorAll(".userDisplayName").forEach(el => {
        el.textContent = user.displayName || user.email;
      });
      document.querySelectorAll(".userDisplayEmail").forEach(el => {
        el.textContent = user.email;
      });
    }
  });
}

// ---------------- ERROR MESSAGE HELPER ----------------
function friendlyAuthError(err) {
  switch (err.code) {
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak (minimum 6 characters).";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing.";
    default:
      return err.message || "Something went wrong. Please try again.";
  }
}

// Initialize everything on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  initRegisterPage();
  initLogout();
});
