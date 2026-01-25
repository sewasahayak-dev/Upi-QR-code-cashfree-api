<script>
const app = document.getElementById("app");
const paymentRoot = document.getElementById("payment-root");
const payBtn = document.getElementById("payBtn");
const amount = document.getElementById("amount");
const phone = document.getElementById("phone");

let cashfree;
try {
  cashfree = Cashfree({ mode: "production" });
} catch (e) {
  alert("Cashfree SDK load failed");
}

payBtn.onclick = async () => {
  const amt = Number(amount.value);
  const ph = phone.value.trim();

  if (!amt || amt < 1) return alert("Invalid amount");
  if (ph.length !== 10) return alert("Invalid mobile");

  payBtn.disabled = true;
  payBtn.innerText = "Creating Order...";

  try {
    const res = await fetch("/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, phone: ph })
    });

    const data = await res.json();

    if (!data.payment_session_id) {
      throw new Error(data.message || "Order failed");
    }

    /* ===== FULLSCREEN SWITCH ===== */
    document.body.style.overflow = "hidden";
    app.style.display = "none";
    paymentRoot.style.display = "block";

    /* IMPORTANT: use paymentRoot, NOT document.body */
    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: paymentRoot
    });

  } catch (err) {
    alert(err.message);
    payBtn.disabled = false;
    payBtn.innerText = "Proceed to Pay";
    app.style.display = "flex";
    paymentRoot.style.display = "none";
  }
};
</script>
