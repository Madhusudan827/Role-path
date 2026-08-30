(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    const status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        status.textContent = "Please fill in every field before sending.";
        status.className = "form-status form-status--error";
        return;
      }

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        await RolePathAPI.sendContactMessage({ name, email, message });
        status.textContent = "Message sent — we'll get back to you soon.";
        status.className = "form-status form-status--success";
        form.reset();
      } catch (err) {
        status.textContent = "Something went wrong. Please try again.";
        status.className = "form-status form-status--error";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Message";
      }
    });
  });
})();
