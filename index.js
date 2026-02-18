export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return handleOptions(req);
    const url = new URL(req.url);

    // 1. Pay Link (Customer opens this -> Clicks Pay -> Goes to Cashfree Page)
    if (url.pathname === "/pay-link" && req.method === "GET") {
      return handleInstantLink(url, env);
    }

    // 2. API to Create Order (For Website Integration)
    if (url.pathname === "/api/create" && req.method === "POST") {
      return createOrderAPI(req, env);
    }

    // 3. Status Check
    if (url.pathname === "/api/status" && req.method === "GET") {
      return checkStatus(url, env);
    }

    // 4. Webhook
    if (url.pathname === "/webhook/cashfree" && req.method === "POST") {
      return cashfreeWebhook(req, env);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders() });
  }
};

/* --- HELPER FUNCTIONS --- */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}
function handleOptions(req) { return new Response(null, { headers: corsHeaders() }); }

/* --- STEP 1: CREATE ORDER --- */
async function generateCashfreeOrder(amount, phone, customReturnUrl, env) {
  const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  
  // जब पेमेंट पूरी हो जाए, तो Cashfree इसी URL पर वापस भेजेगा
  let finalReturnUrl = customReturnUrl || "https://bazaarika.in/payment-success";
  
  // URL validation
  if (finalReturnUrl.includes("?")) {
    finalReturnUrl = finalReturnUrl + "&order_id={order_id}";
  } else {
    finalReturnUrl = finalReturnUrl + "?order_id={order_id}";
  }

  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: { 
        customer_id: phone.replace(/\D/g, ''), 
        customer_phone: phone.replace(/\D/g, '') 
    },
    order_meta: { 
        return_url: finalReturnUrl 
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

  return await res.json();
}

/* --- STEP 2: HANDLE INSTANT LINK & SHOW BUTTON --- */
async function handleInstantLink(url, env) {
  try {
    const amount = Number(url.searchParams.get("amount"));
    const phone = url.searchParams.get("phone");
    const returnUrl = url.searchParams.get("return_url");

    if (!amount || !phone) return new Response("Error: Provide amount & phone", { status: 400 });

    // 1. Order बनाओ
    const data = await generateCashfreeOrder(amount, phone, returnUrl, env);

    if (data.payment_session_id) {
        // 2. HTML पेज भेजो जो सीधा Cashfree Checkout पर ले जाए
        return paymentRedirectUI(data.payment_session_id);
    } else {
        return new Response("Error creating order: " + JSON.stringify(data), { status: 500 });
    }

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}

async function createOrderAPI(req, env) {
  try {
    const body = await req.json();
    const data = await generateCashfreeOrder(Number(body.amount), body.phone, body.return_url, env);
    return new Response(JSON.stringify(data), { headers: corsHeaders() });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
  }
}

/* =========================================================
   PAYMENT UI (STANDARD CHECKOUT - REDIRECT)
   यह कोड सीधा Cashfree के असली पेज (Purple Page) को खोलेगा
========================================================= */
function paymentRedirectUI(sessionId) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Payment</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f7fa; margin: 0; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; max-width: 350px; width: 100%; }
    
    .pay-btn {
        background: #5E32C5; /* Cashfree Purple */
        color: white;
        border: none;
        padding: 15px 30px;
        font-size: 18px;
        font-weight: bold;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        margin-top: 20px;
        transition: background 0.2s;
    }
    .pay-btn:hover { background: #4a26a0; }

    p { color: #666; margin-bottom: 5px; }
    .secure { font-size: 12px; color: green; margin-top: 15px; display: block; }
  </style>
</head>
<body>

  <div class="card">
    <h2>Confirm Payment</h2>
    <p>Click below to pay securely via Cashfree</p>
    
    <button class="pay-btn" onclick="openCheckout()">
       PROCEED TO PAY
    </button>

    <span class="secure">🔒 100% Secure Payment</span>
  </div>

  <script>
    const cashfree = Cashfree({
      mode: "production" // असली पेमेंट के लिए
    });

    const sessionId = "${sessionId}";

    function openCheckout() {
      // यह फंक्शन आपको सीधा Cashfree के Purple Page पर ले जाएगा
      cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_self" // "_self" का मतलब उसी टैब में खुलेगा
      });
    }

    // अगर आप चाहते हैं कि बटन दबाने की जरूरत न पड़े और पेज अपने आप खुल जाए
    // तो नीचे वाली लाइन से कमेंट (//) हटा दें:
    
    // window.onload = openCheckout;

  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

/* --- STATUS & WEBHOOK --- */
async function checkStatus(url, env) {
  try {
    const res = await fetch(`https://api.cashfree.com/pg/orders/${url.searchParams.get("order_id")}`, {
      headers: { "x-client-id": env.CASHFREE_APP_ID, "x-client-secret": env.CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" }
    });
    return new Response(JSON.stringify(await res.json()), { headers: corsHeaders() });
  } catch(e) { return new Response(JSON.stringify({error: "Failed"}), {status: 500}); }
}

async function cashfreeWebhook(req, env) { return new Response("OK", { status: 200 }); }
