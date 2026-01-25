export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/api/create" && req.method === "POST")
      return createOrder(req, env, url);

    if (url.pathname === "/pay")
      return paymentUI(url);

    if (url.pathname === "/webhook/cashfree")
      return cashfreeWebhook(req, env);

    if (url.pathname === "/api/status")
      return checkStatus(url, env);

    return new Response("Not Found", { status: 404 });
  }
};

/* ---------------- CREATE ORDER ---------------- */
async function createOrder(req, env, url) {
  const { amount, phone, redirect_url } = await req.json();
  const oid = "ORD_" + crypto.randomUUID();

  const payload = {
    order_id: oid,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: phone,
      customer_phone: phone
    },
    order_meta: {
      return_url: `${url.origin}/pay?oid={order_id}`
    }
  };

  const res = await fetch("https://api.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "x-client-id": env.CF_ID,
      "x-client-secret": env.CF_SECRET,
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return Response.json(data);
}

/* ---------------- PAYMENT PAGE ---------------- */
function paymentUI(url) {
  return new Response(`
<html>
<body>
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
<script>
const cf = Cashfree({ mode:"production" });
fetch("/api/status?order_id=${url.searchParams.get("oid")}")
.then(r=>r.json())
.then(d=>{
  cf.create("payment",{
    paymentSessionId:d.payment_session_id
  }).mount("body");
});
</script>
</body>
</html>`, { headers: { "content-type": "text/html" } });
}

/* ---------------- WEBHOOK ---------------- */
async function cashfreeWebhook(req, env) {
  // Verify signature here (HMAC SHA256)
  // Update DB / KV / Durable Object
  return new Response("OK");
}

/* ---------------- STATUS CHECK ---------------- */
async function checkStatus(url, env) {
  const oid = url.searchParams.get("order_id");

  const r = await fetch(`https://api.cashfree.com/pg/orders/${oid}`, {
    headers: {
      "x-client-id": env.CF_ID,
      "x-client-secret": env.CF_SECRET,
      "x-api-version": "2023-08-01"
    }
  });

  return Response.json(await r.json());
}
