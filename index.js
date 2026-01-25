export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /* =========================
       FRONTEND (FULL NATIVE UI)
    ========================== */
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport"
  content="width=device-width, height=device-height,
  initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<title>Sewa Sahayak</title>

<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>

<style>
/* ====== HARD MOBILE RESET ====== */
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{
  width:100%;
  height:100%;
  margin:0;
  padding:0;
  overflow:hidden;
  background:#f6f7fb;
  font-family:system-ui,-apple-system,Roboto,Arial;
}

/* ====== APP LAYOUT ====== */
.app{
  position:fixed;
  inset:0;
  display:flex;
  flex-direction:column;
}

header{
  padding:16px;
  background:#ffffff;
  font-size:18px;
  font-weight:800;
  border-bottom:1px solid #eee;
}

main{
  flex:1;
  padding:20px;
  overflow:auto;
}

input{
  width:100%;
  padding:16px;
  margin-bottom:14px;
  font-size:16px;
  border-radius:12px;
  border:1.5px solid #ddd;
}

button{
  width:100%;
  padding:16px;
  font-size:16px;
  font-weight:700;
  border:none;
  border-radius:14px;
  background:#635bff;
  color:#fff;
}

/* ====== FULLSCREEN PAYMENT LAYER ====== */
#payment-root{
  position:fixed;
  inset:0;
  background:#ffffff;
  display:none;
  z-index:999999;
}

/* Prevent any iframe shift */
#payment-root iframe{
  width:100% !important;
  height:100% !important;
  border:none !important;
}
</style>
</head>

<body>

<div class="app" id="app">
  <header>Sewa Sahayak</header>

  <main>
    <input id="amount" type="number" value="1" placeholder="Amount (₹)" />
    <input id="phone" type="tel" value="9999999999" placeholder="Mobile Number" />
    <button id="payBtn" onclick="startPayment()">Proceed to Pay</button>
  </main>
</div>

<div id="payment-root"></div>

<script>
/* ====== CASHFREE INIT ====== */
let cashfree;
try {
  cashfree = Cashfree({ mode: "production" });
} catch(e) {
  alert("Cashfree SDK failed to load");
}

/* ====== PAYMENT FLOW ====== */
async function startPayment(){
  const amt = Number(amount.value);
  const ph = phone.value.trim();

  if(!amt || amt < 1) return alert("Invalid amount");
  if(ph.length !== 10) return alert("Invalid mobile");

  payBtn.disabled = true;
  payBtn.innerText = "Creating Order...";

  try{
    const r = await fetch("/create-order",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ amount: amt, phone: ph })
    });

    const data = await r.json();

    if(!data.payment_session_id){
      throw new Error(data.message || "Order creation failed");
    }

    /* ====== NATIVE FULLSCREEN SWITCH ====== */
    document.body.style.overflow = "hidden";
    app.style.display = "none";
    paymentRoot.style.display = "block";

    /* Force mobile recalculation */
    setTimeout(() => window.scrollTo(0,1), 50);

    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: document.body
    });

  }catch(err){
    alert(err.message);
    payBtn.disabled = false;
    payBtn.innerText = "Proceed to Pay";
  }
}
</script>

</body>
</html>`, {
        headers: { "content-type": "text/html;charset=utf-8" }
      });
    }

    /* =========================
       BACKEND (ORDER CREATE)
    ========================== */
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const { amount, phone } = await request.json();

        const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": env.CASHFREE_APP_ID,
            "x-client-secret": env.CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
          },
          body: JSON.stringify({
            order_id: "ORD_" + Date.now(),
            order_amount: Number(amount),
            order_currency: "INR",
            customer_details: {
              customer_id: "CUST_" + Date.now(),
              customer_phone: phone
            }
          })
        });

        const data = await cfRes.json();
        return new Response(JSON.stringify(data), {
          headers:{ "content-type":"application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ message: e.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
