/**
 * Commuter Web Account Deletion Controller
 * Dual Mode: Google Sign-In Account (Gmail OTP) + Standard Account (Password + OTP)
 * Connects directly to external tunneling backend
 */

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://larganasaanka.serveousercontent.com/larganasaanka/api/user_security_api.php";

  // Tab Switcher Elements
  const tabBtnGoogle = document.getElementById("tabBtnGoogle");
  const tabBtnStandard = document.getElementById("tabBtnStandard");
  const paneGoogle = document.getElementById("paneGoogle");
  const paneStandard = document.getElementById("paneStandard");

  // Standard Flow Elements
  const step1Form = document.getElementById("step1Form");
  const inputEmail = document.getElementById("inputEmail");
  const inputPassword = document.getElementById("inputPassword");
  const btnTogglePassword = document.getElementById("btnTogglePassword");
  const pwdToggleIcon = document.getElementById("pwdToggleIcon");
  const btnRequestOtp = document.getElementById("btnRequestOtp");

  const step2Form = document.getElementById("step2Form");
  const displayMaskedEmail = document.getElementById("displayMaskedEmail");
  const inputOtpCode = document.getElementById("inputOtpCode");
  const otpTimerText = document.getElementById("otpTimerText");
  const resendCountdownText = document.getElementById("resendCountdownText");
  const btnResendOtp = document.getElementById("btnResendOtp");
  const btnBackToStep1 = document.getElementById("btnBackToStep1");
  const btnConfirmDelete = document.getElementById("btnConfirmDelete");

  // Google Gmail OTP Flow Elements
  const googleOtpRequestForm = document.getElementById("googleOtpRequestForm");
  const inputGoogleEmail = document.getElementById("inputGoogleEmail");
  const btnRequestGoogleOtp = document.getElementById("btnRequestGoogleOtp");

  const googleOtpVerifyForm = document.getElementById("googleOtpVerifyForm");
  const displayGoogleMaskedEmail = document.getElementById("displayGoogleMaskedEmail");
  const inputGoogleOtpCode = document.getElementById("inputGoogleOtpCode");
  const googleOtpTimerText = document.getElementById("googleOtpTimerText");
  const googleResendCountdownText = document.getElementById("googleResendCountdownText");
  const btnResendGoogleOtp = document.getElementById("btnResendGoogleOtp");
  const btnBackToGoogleStep1 = document.getElementById("btnBackToGoogleStep1");
  const btnConfirmDeleteGoogle = document.getElementById("btnConfirmDeleteGoogle");

  // Global Success Elements
  const deletionSuccessCard = document.getElementById("deletionSuccessCard");

  // State Variables
  let currentUserId = null;
  let cachedEmail = "";
  let cachedPassword = "";

  let currentGoogleUserId = null;
  let cachedGoogleEmail = "";

  let resendInterval = null;
  let validityInterval = null;
  let googleResendInterval = null;
  let googleValidityInterval = null;

  // Toast Notification Helper
  const toast = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");
  const toastIcon = document.getElementById("toastIcon");
  let toastTimeout = null;

  function showToast(message, type = "error") {
    clearTimeout(toastTimeout);
    toastMessage.textContent = message;
    toast.className = `toast-notification ${type} show`;
    toastIcon.textContent = type === "success" ? "check_circle" : "error";
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 4000);
  }

  // =========================================================================
  // 1. TAB SWITCHER (GOOGLE ACCOUNT VS STANDARD ACCOUNT)
  // =========================================================================
  tabBtnGoogle.addEventListener("click", () => {
    tabBtnGoogle.classList.add("active");
    tabBtnStandard.classList.remove("active");
    paneGoogle.style.display = "flex";
    paneStandard.style.display = "none";
  });

  tabBtnStandard.addEventListener("click", () => {
    tabBtnStandard.classList.add("active");
    tabBtnGoogle.classList.remove("active");
    paneStandard.style.display = "flex";
    paneGoogle.style.display = "none";
  });

  // Password visibility toggle
  if (btnTogglePassword && inputPassword && pwdToggleIcon) {
    btnTogglePassword.addEventListener("click", () => {
      const isPassword = inputPassword.type === "password";
      inputPassword.type = isPassword ? "text" : "password";
      pwdToggleIcon.textContent = isPassword ? "visibility_off" : "visibility";
    });
  }

  // =========================================================================
  // 2. GOOGLE ACCOUNT: GMAIL OTP WORKFLOW (NO PASSWORD NEEDED)
  // =========================================================================
  googleOtpRequestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = inputGoogleEmail.value.trim();
    if (!email) {
      showToast("Please provide your registered Gmail address.");
      return;
    }

    const originalBtnHtml = btnRequestGoogleOtp.innerHTML;
    btnRequestGoogleOtp.disabled = true;
    btnRequestGoogleOtp.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Sending...`;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "web_delete_google_request_otp",
          email: email,
        }),
      });

      const result = await res.json();

      if (result.success) {
        currentGoogleUserId = result.user_id;
        cachedGoogleEmail = email;
        displayGoogleMaskedEmail.textContent = result.masked_email || email;

        googleOtpRequestForm.style.display = "none";
        googleOtpVerifyForm.style.display = "flex";
        inputGoogleOtpCode.value = "";
        inputGoogleOtpCode.focus();

        const now = Date.now();
        startGoogleResendCooldown(now + 30 * 1000);
        startGoogleValidityCountdown(now + 300 * 1000);

        showToast(result.message || "Code sent to your Gmail inbox.", "success");
      } else {
        showToast(result.message || "Email address not found.", "error");
      }
    } catch (err) {
      console.error("Google OTP error:", err);
      showToast("Unable to reach the security server. Check if your tunnel is running.", "error");
    } finally {
      btnRequestGoogleOtp.disabled = false;
      btnRequestGoogleOtp.innerHTML = originalBtnHtml;
    }
  });

  btnResendGoogleOtp.addEventListener("click", async () => {
    btnResendGoogleOtp.disabled = true;
    googleResendCountdownText.textContent = "Sending new code...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "web_delete_google_request_otp",
          email: cachedGoogleEmail,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast("New code sent to your Gmail.", "success");
        const now = Date.now();
        startGoogleResendCooldown(now + 30 * 1000);
        startGoogleValidityCountdown(now + 300 * 1000);
      } else {
        showToast(result.message || "Failed to resend code.", "error");
        btnResendGoogleOtp.disabled = false;
      }
    } catch (err) {
      showToast("Connection error while resending.", "error");
      btnResendGoogleOtp.disabled = false;
    }
  });

  btnBackToGoogleStep1.addEventListener("click", () => {
    clearInterval(googleResendInterval);
    clearInterval(googleValidityInterval);
    googleOtpVerifyForm.style.display = "none";
    googleOtpRequestForm.style.display = "flex";
    inputGoogleEmail.focus();
  });

  googleOtpVerifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const enteredOtp = inputGoogleOtpCode.value.trim();
    if (!enteredOtp || enteredOtp.length !== 6) {
      showToast("Please enter the complete 6-digit verification code.");
      inputGoogleOtpCode.focus();
      return;
    }

    const userAgreed = confirm(
      "WARNING: You are about to permanently delete your Google-linked commuter account. This cannot be undone. Proceed?",
    );
    if (!userAgreed) return;

    const originalBtnHtml = btnConfirmDeleteGoogle.innerHTML;
    btnConfirmDeleteGoogle.disabled = true;
    btnConfirmDeleteGoogle.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Purging...`;

    try {
      // Step A: Verify OTP
      const verifyRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_security_otp",
          user_id: currentGoogleUserId,
          otp: enteredOtp,
          action_type: "delete",
        }),
      });

      const verifyResult = await verifyRes.json();
      if (!verifyResult.success) {
        showToast(verifyResult.message || "Invalid verification code.", "error");
        btnConfirmDeleteGoogle.disabled = false;
        btnConfirmDeleteGoogle.innerHTML = originalBtnHtml;
        return;
      }

      // Step B: Execute Deletion
      const deleteRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_account",
          user_id: currentGoogleUserId,
          auth_type: "google_otp",
          otp: enteredOtp,
        }),
      });

      const deleteResult = await deleteRes.json();

      if (deleteResult.success) {
        clearInterval(googleResendInterval);
        clearInterval(googleValidityInterval);
        renderDeletionSuccess();
      } else {
        showToast(deleteResult.message || "Failed to purge account.", "error");
        btnConfirmDeleteGoogle.disabled = false;
        btnConfirmDeleteGoogle.innerHTML = originalBtnHtml;
      }
    } catch (err) {
      console.error("Google deletion execution error:", err);
      showToast("Server error during deletion.", "error");
      btnConfirmDeleteGoogle.disabled = false;
      btnConfirmDeleteGoogle.innerHTML = originalBtnHtml;
    }
  });

  function startGoogleResendCooldown(targetTimestamp) {
    clearInterval(googleResendInterval);
    btnResendGoogleOtp.disabled = true;

    function tick() {
      const remainingSec = Math.ceil((targetTimestamp - Date.now()) / 1000);
      if (remainingSec <= 0) {
        clearInterval(googleResendInterval);
        googleResendCountdownText.textContent = "Didn't receive the email?";
        btnResendGoogleOtp.disabled = false;
      } else {
        googleResendCountdownText.textContent = `Resend available in ${remainingSec}s`;
      }
    }
    tick();
    googleResendInterval = setInterval(tick, 1000);
  }

  function startGoogleValidityCountdown(targetTimestamp) {
    clearInterval(googleValidityInterval);

    function tick() {
      const totalSec = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;

      googleOtpTimerText.textContent = `Expires in: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      if (totalSec <= 0) {
        clearInterval(googleValidityInterval);
        googleOtpTimerText.textContent = "Code Expired";
      }
    }
    tick();
    googleValidityInterval = setInterval(tick, 1000);
  }

  // =========================================================================
  // 3. STANDARD ACCOUNT FLOW (EMAIL + PASSWORD + OTP)
  // =========================================================================
  step1Form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    if (!email || !password) {
      showToast("Please provide both email address and account password.");
      return;
    }

    const originalBtnHtml = btnRequestOtp.innerHTML;
    btnRequestOtp.disabled = true;
    btnRequestOtp.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Verifying...`;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "web_delete_account_request_otp",
          email: email,
          password: password,
        }),
      });

      const result = await res.json();

      if (result.success) {
        currentUserId = result.user_id;
        cachedEmail = email;
        cachedPassword = password;

        displayMaskedEmail.textContent = result.masked_email || email;

        step1Form.style.display = "none";
        step2Form.style.display = "flex";
        inputOtpCode.value = "";
        inputOtpCode.focus();

        const now = Date.now();
        startStandardResendCooldown(now + 30 * 1000);
        startStandardValidityCountdown(now + 300 * 1000);

        showToast(result.message || "Verification code dispatched.", "success");
      } else {
        showToast(result.message || "Verification failed. Check your email and password.", "error");
      }
    } catch (err) {
      console.error("Communication error:", err);
      showToast("Unable to reach the security authentication server.", "error");
    } finally {
      btnRequestOtp.disabled = false;
      btnRequestOtp.innerHTML = originalBtnHtml;
    }
  });

  btnResendOtp.addEventListener("click", async () => {
    btnResendOtp.disabled = true;
    resendCountdownText.textContent = "Sending new code...";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "web_delete_account_request_otp",
          email: cachedEmail,
          password: cachedPassword,
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast("A new verification code has been dispatched.", "success");
        const now = Date.now();
        startStandardResendCooldown(now + 30 * 1000);
        startStandardValidityCountdown(now + 300 * 1000);
      } else {
        showToast(result.message || "Failed to resend code.", "error");
        btnResendOtp.disabled = false;
      }
    } catch (err) {
      console.error("Resend error:", err);
      showToast("Server error while resending code.", "error");
      btnResendOtp.disabled = false;
    }
  });

  btnBackToStep1.addEventListener("click", () => {
    clearInterval(resendInterval);
    clearInterval(validityInterval);
    step2Form.style.display = "none";
    step1Form.style.display = "flex";
    inputPassword.focus();
  });

  step2Form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const enteredOtp = inputOtpCode.value.trim();

    if (!enteredOtp || enteredOtp.length !== 6) {
      showToast("Please enter the complete 6-digit verification code.");
      inputOtpCode.focus();
      return;
    }

    const userAgreed = confirm(
      "WARNING: This action is permanent and completely irreversible. All personal information and commuter discount standing will be permanently removed. Proceed?",
    );
    if (!userAgreed) return;

    const originalBtnHtml = btnConfirmDelete.innerHTML;
    btnConfirmDelete.disabled = true;
    btnConfirmDelete.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Purging...`;

    try {
      const verifyRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_security_otp",
          user_id: currentUserId,
          otp: enteredOtp,
          action_type: "delete",
        }),
      });

      const verifyResult = await verifyRes.json();

      if (!verifyResult.success) {
        showToast(verifyResult.message || "Invalid or expired verification code.", "error");
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerHTML = originalBtnHtml;
        return;
      }

      const deleteRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_account",
          user_id: currentUserId,
          auth_type: "password",
          password: cachedPassword,
          otp: enteredOtp,
        }),
      });

      const deleteResult = await deleteRes.json();

      if (deleteResult.success) {
        clearInterval(resendInterval);
        clearInterval(validityInterval);
        renderDeletionSuccess();
      } else {
        showToast(deleteResult.message || "Failed to purge account data.", "error");
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerHTML = originalBtnHtml;
      }
    } catch (err) {
      console.error("Deletion execution error:", err);
      showToast("Server error occurred while deleting account.", "error");
      btnConfirmDelete.disabled = false;
      btnConfirmDelete.innerHTML = originalBtnHtml;
    }
  });

  function startStandardResendCooldown(targetTimestamp) {
    clearInterval(resendInterval);
    btnResendOtp.disabled = true;

    function tick() {
      const remainingSec = Math.ceil((targetTimestamp - Date.now()) / 1000);
      if (remainingSec <= 0) {
        clearInterval(resendInterval);
        resendCountdownText.textContent = "Didn't receive the email?";
        btnResendOtp.disabled = false;
      } else {
        resendCountdownText.textContent = `You can request a new code in ${remainingSec}s`;
      }
    }
    tick();
    resendInterval = setInterval(tick, 1000);
  }

  function startStandardValidityCountdown(targetTimestamp) {
    clearInterval(validityInterval);

    function tick() {
      const totalSec = Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
      const minutes = Math.floor(totalSec / 60);
      const seconds = totalSec % 60;

      otpTimerText.textContent = `Expires in: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      if (totalSec <= 0) {
        clearInterval(validityInterval);
        otpTimerText.textContent = "Code Expired";
      }
    }
    tick();
    validityInterval = setInterval(tick, 1000);
  }

  // =========================================================================
  // 4. SUCCESS TRANSITION
  // =========================================================================
  function renderDeletionSuccess() {
    document.getElementById("authTypeTabs").style.display = "none";
    paneGoogle.style.display = "none";
    paneStandard.style.display = "none";
    document.querySelector(".delete-header").style.display = "none";
    document.querySelector(".scope-disclosure-box").style.display = "none";
    deletionSuccessCard.style.display = "block";
    showToast("Account deleted successfully.", "success");
  }
});
