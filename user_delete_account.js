/**
 * Commuter Web Account Deletion Request Controller
 * Generates an authenticated mailto verification dispatch and copyable payload
 * Operates purely on client-side GitHub Pages without exposing database credentials
 */

document.addEventListener("DOMContentLoaded", () => {
    // Form Elements
    const deletionRequestForm = document.getElementById("deletionRequestForm");
    const inputEmail = document.getElementById("inputEmail");
    const inputFullName = document.getElementById("inputFullName");
    const inputPrivilege = document.getElementById("inputPrivilege");
    const inputReason = document.getElementById("inputReason");
    const checkConsent = document.getElementById("checkConsent");

    // Acknowledgment Screen Elements
    const acknowledgmentCard = document.getElementById("acknowledgmentCard");
    const displayTicketId = document.getElementById("displayTicketId");
    const displayTargetEmail = document.getElementById("displayTargetEmail");
    const btnOpenMailClient = document.getElementById("btnOpenMailClient");
    const btnCopyPayload = document.getElementById("btnCopyPayload");
    const btnCreateNewRequest = document.getElementById("btnCreateNewRequest");

    // Toast Notification Helper
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");
    let toastTimeout = null;

    function showToast(message, type = "success") {
        if (!toast) return;
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.className = `toast-notification ${type} show`;
        toastIcon.textContent = type === "success" ? "check_circle" : "error";
        toastTimeout = setTimeout(() => toast.classList.remove("show"), 4000);
    }

    let generatedPayloadText = "";

    // Handle Form Submission
    deletionRequestForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = inputEmail.value.trim();
        const fullName = inputFullName.value.trim();
        const privilege = inputPrivilege.value;
        const reason = inputReason.value.trim() || "No specific reason provided.";

        if (!email || !fullName || !privilege) {
            showToast("Please fill in all required verification fields.", "error");
            return;
        }

        if (!checkConsent.checked) {
            showToast("Please acknowledge and check the deletion confirmation box.", "error");
            return;
        }

        // Generate deterministic reference ticket (e.g., LNS-DEL-20261001-4921)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const randomSequence = Math.floor(1000 + Math.random() * 9000);
        const ticketId = `LNS-DEL-${dateStr}-${randomSequence}`;

        displayTicketId.textContent = ticketId;
        displayTargetEmail.textContent = email;

        // Structured email body
        const subject = encodeURIComponent(`[Account Deletion Request] ${ticketId} - ${fullName}`);
        const rawBody = `To: Larga Na Saan Ka Transit Administration
Official Account Deletion Request
Reference Code: ${ticketId}

I am officially requesting the permanent deletion of my commuter account and all associated personal data from the Larga Na Saan Ka transit portal, in accordance with the Philippine Data Privacy Act of 2012 (RA 10173).

CORROBORATING ACCOUNT DETAILS:
- Registered Account Email: ${email}
- Full Name: ${fullName}
- Commuter Classification: ${privilege}
- Reason for Deletion: ${reason}

OWNERSHIP ATTESTATION:
I confirm that I am sending this email from the exact mailbox registered with this account. I understand that upon execution of this request, my passenger fare discounts, profile details, and account credentials will be permanently erased.

Timestamp: ${new Date().toUTCString()}
Ref: ${ticketId}`;

        generatedPayloadText = rawBody;

        // Prepare mailto link
        const mailtoUrl = `mailto:larganasaanka@gmail.com?subject=${subject}&body=${encodeURIComponent(rawBody)}`;
        btnOpenMailClient.href = mailtoUrl;

        // Switch to Acknowledgment Screen
        deletionRequestForm.style.display = "none";
        document.querySelector(".delete-header").style.display = "none";
        document.querySelector(".scope-disclosure-box").style.display = "none";
        acknowledgmentCard.style.display = "block";

        showToast("Request generated! Please send the confirmation email to verify ownership.", "success");
    });

    // Copy Raw Payload (for webmail users who do not have a default desktop mail app)
    btnCopyPayload.addEventListener("click", async () => {
        if (!generatedPayloadText) return;

        try {
            await navigator.clipboard.writeText(generatedPayloadText);
            showToast("Verification text copied to clipboard! You can paste it into Gmail/Yahoo.", "success");
        } catch (err) {
            showToast("Failed to copy. Please manually select the text.", "error");
        }
    });

    // Reset Form
    btnCreateNewRequest.addEventListener("click", () => {
        deletionRequestForm.reset();
        acknowledgmentCard.style.display = "none";
        document.querySelector(".delete-header").style.display = "block";
        document.querySelector(".scope-disclosure-box").style.display = "block";
        deletionRequestForm.style.display = "flex";
        inputEmail.focus();
    });
});