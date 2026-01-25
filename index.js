export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/api/create" && req.method === "POST") {
      return createOrder(req, env, url);
    }

    if (url.pathname === "/pay" && req.method === "GET") {
      return paymentUI(url);
    }

    if (url.pathname === "/api/status" && req.method === "GET") {
      return checkStatus(url, env);
    }

    if (url.pathname === "/webhook/cashfree" && req.method === "POST") {
      return cashfreeWebhook(req, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};

/* =========================================================
   CREATE ORDER (SERVER SIDE – SAFE)
========================================================= */
async function createOrder(req, env, url) {
  const body = await req.json();
  const amount = Number(body.amount);
  const phone = body.phone;

  if (!amount || amount < 1 || !phone) {
    return Response.json(
      { error: "Invalid amount or phone" },
      { status: 400 }
    );
  }

  const orderId = "ORD_" + crypto.randomUUID();

  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: phone,
      customer_phone: phone
    },
    order_meta: {
      return_url: `${url.origin}/pay?oid=${orderId}`
    }
  };

  const res = await fetch("https://api.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": env.CASHFREE_APP_ID,
      "x-client-secret": env.CASHFREE_SECRET_KEY,
      "x-api-version": "2023-08-01"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return Response.json(data);
}

/* =========================================================
   PAYMENT PAGE (LIVE MODE)
========================================================= */
function paymentUI(url) {
  const orderId = url.searchParams.get("oid");

  return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Secure Payment</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</head>
<body>
  <h3>Redirecting to Secure Payment...</h3>

  <script>
    const cf = Cashfree({ mode: "production" });

    fetch("/api/status?order_id=${orderId}")
      .then(res => res.json())
      .then(data => {
        if (!data.payment_session_id) {
          alert("Payment session not found");
          return;
        }

        cf.create("payment", {
          paymentSessionId: data.payment_session_id
        }).mount("body");
      })
      .catch(() => {
        alert("Something went wrong");
      });
  </script>
</body>
</html>
`, {
    headers: { "content-type": "text/html" }
  });
}

/* =========================================================
   CHECK ORDER STATUS (SERVER SIDE)
========================================================= */
async function checkStatus(url, env) {
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return Response.json(
      { error: "Missing order_id" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.cashfree.com/pg/orders/${orderId}`,
    {
      headers: {
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      }
    }
  );

  const data = await res.json();
  return Response.json(data);
}

/* =========================================================
   WEBHOOK (SOURCE OF TRUTH – MUST USE)
========================================================= */
async function cashfreeWebhook(req, env) {
  const rawBody = await req.text();

  // 🔐 TODO: HMAC signature verification here (recommended)
  // const signature = req.headers.get("x-webhook-signature");

  // Payment success example:
  // payment_status === "SUCCESS"

  return new Response("OK");
}
