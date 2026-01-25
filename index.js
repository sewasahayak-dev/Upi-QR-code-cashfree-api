export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------- ROUTES ----------
    if (url.pathname === "/" && request.method === "GET")
      return homePage();

    if (url.pathname === "/api/create" && request.method === "POST")
      return createOrder(request, env, url);

    if (url.pathname === "/api/status" && request.method === "GET")
      return orderStatus(url, env);

    if (url.pathname === "/webhook/cashfree" && request.method === "POST")
      return cashfreeWebhook(request, env);

    return new Response("Not Found", { status: 404 });
  }
};

/* ===================================================== */
/* =================== HOME PAGE ======================== */
/* ===================================================== */
function homePage() {
  return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sewa Sahayak Payment</title>
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
<style>
body{margin:0;font-family:Arial;background:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh}
.box{background:#fff;padding:20px;border-radius:14px;width:100%;max-width:380px;box-shadow:0 10px 30px rgba(0,0,0,.1)}
h2{text-align:center;margin-bottom:10px}
input,button{width:100%;padding:12px;margin-top:10px;font-size:15px}
button{background:#4f46e5;color:#fff;border:none;border-radius:8px;font-weight:bold}
#paybox{margin-top:10px}
</style>
</head>
<body>
<div class="box">
<h2>UPI Payment</h2>
<input id="amt" type="number" value="1" placeholder="Amount">
<input id="ph" type="tel" placeholder="Mobile Number" maxlength="10">
<button onclick="pay()">Pay Now</button>
<div id="paybox"></div>
</div>

<script>
const cf = Cashfree({ mode:"production" });

async function pay(){
  const amt = document.getElementById("amt").value;
  const ph  = document.getElementById("ph").value;

  if(ph.length!=10) return alert("Invalid mobile");

  const r = await fetch("/api/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({amount:amt,phone:ph})
  });

  const d = await r.json();
  if(!d.payment_session_id) return alert("Payment init failed");

  cf.create("payment",{paymentSessionId:d.payment_session_id})
    .mount("#paybox");
}
</script>
</body>
</html>
`, { headers: { "content-type": "text/html" } });
}

/* ===================================================== */
/* ================= CREATE ORDER ======================= */
/* ===================================================== */
async function createOrder(req, env, url) {
  try {
    const { amount, phone } = await req.json();
    if (!amount || !phone)
      return json({ error: "Invalid data" }, 400);

    const oid = "ORD_" + crypto.randomUUID();

    const payload = {
      order_id: oid,
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: phone,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${url.origin}/?order_id={order_id}`
      }
    };

    const r = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    return json(data);

  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

/* ===================================================== */
/* ================= ORDER STATUS ======================= */
/* ===================================================== */
async function orderStatus(url, env) {
  const oid = url.searchParams.get("order_id");
  if (!oid) return json({ error: "order_id required" }, 400);

  const r = await fetch(
    `https://api.cashfree.com/pg/orders/${oid}`, {
    headers: {
      "x-client-id": env.CASHFREE_APP_ID,
      "x-client-secret": env.CASHFREE_SECRET_KEY,
      "x-api-version": "2023-08-01"
    }
  });

  return json(await r.json());
}

/* ===================================================== */
/* =================== WEBHOOK ========================== */
/* ===================================================== */
async function cashfreeWebhook(req, env) {
  // NOTE: Signature verification recommended (next step)
  const payload = await req.json();

  // Here you can save status to KV / DB
  // payload.data.order.order_id
  // payload.data.payment.payment_status

  return new Response("OK");
}

/* ===================================================== */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
