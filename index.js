export default {
  async fetch(req, env) {
    // 1. CORS Handle (ताकि आप इसे किसी भी वेबसाइट से कॉल कर सकें)
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }

    const url = new URL(req.url);

    // --- ROUTES ---

    // 1. URL से डायरेक्ट पेमेंट (New Feature with Redirect)
    // Usage: /pay-link?amount=100&phone=9999999999&return_url=https://your-site.com/thank-you
    if (url.pathname === "/pay-link" && req.method === "GET") {
      return handleInstantLink(url, env);
    }

    // 2. Order Create API (JSON वाला - वेबसाइट इंटीग्रेशन के लिए)
    if (url.pathname === "/api/create" && req.method === "POST") {
      return createOrderAPI(req, env);
    }

    // 3. पेमेंट पेज UI (Worker के अंदर रेंडर होने वाला पेज)
    if (url.pathname === "/pay" && req.method === "GET") {
      const sessionId = url.searchParams.get("session_id");
      if(sessionId) return paymentUI(sessionId);
      return new Response("Session ID Missing", { status: 400 });
    }

    // 4. पेमेंट स्टेटस चेक करने के लिए
    if (url.pathname === "/api/status" && req.method === "GET") {
      return checkStatus(url, env);
    }

    // 5. Webhook (Cashfree इसे कॉल करेगा)
    if (url.pathname === "/webhook/cashfree" && req.method === "POST") {
      return cashfreeWebhook(req, env);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: corsHeaders()
    });
  }
};

/* =========================================================
   HELPER: CORS HEADERS
========================================================= */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-version",
    "Content-Type": "application/json"
  };
}

function handleOptions(req) {
  return new Response(null, {
    headers: corsHeaders()
  });
}

/* =========================================================
   CORE FUNCTION: CASHFREE ORDER GENERATOR
========================================================= */
async function generateCashfreeOrder(amount, phone, customReturnUrl, env) {
  const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  // डिफ़ॉल्ट URL अगर यूजर ने कुछ नहीं दिया
  let finalReturnUrl = customReturnUrl || "https://bazaarika.in/payment-success";

  // URL में ?order_id={order_id} जोड़ना जरुरी है ताकि Cashfree आर्डर ID वापस भेज सके
  // हम चेक करेंगे कि URL में पहले से '?' है या नहीं
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
      customer_id: phone.replace(/\D/g, ''), // केवल नंबर
      customer_phone: phone.replace(/\D/g, '')
    },
    order_meta: {
      return_url: finalReturnUrl // यहाँ यूजर का कस्टम URL सेट हो रहा है
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

/* =========================================================
   1. NEW: INSTANT URL LINK HANDLER (WITH REDIRECT SUPPORT)
========================================================= */
async function handleInstantLink(url, env) {
  try {
    const amount = Number(url.searchParams.get("amount"));
    const phone = url.searchParams.get("phone");
    
    // यहाँ हम URL से 'return_url' या 'redirect_url' उठा रहे हैं
    const returnUrl = url.searchParams.get("return_url") || url.searchParams.get("redirect_url");

    if (!amount || amount < 1 || !phone) {
      return new Response("Error: Please provide 'amount' and 'phone' in URL. Example: /pay-link?amount=100&phone=9999999999", { status: 400 });
    }

    // Order Create करें और Return URL पास करें
    const data = await generateCashfreeOrder(amount, phone, returnUrl, env);

    if (data.payment_session_id) {
      // सीधा HTML पेज return करें जो पेमेंट शुरू कर दे
      return paymentUI(data.payment_session_id);
    } else {
      return new Response("Error creating order: " + JSON.stringify(data), { status: 500 });
    }

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}

/* =========================================================
   2. OLD API: CREATE ORDER (JSON Response)
========================================================= */
async function createOrderAPI(req, env) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const phone = body.phone;
    const returnUrl = body.return_url; // JSON body से return_url पढ़ें

    if (!amount || !phone) {
      return new Response(JSON.stringify({ error: "Invalid amount or phone" }), { status: 400, headers: corsHeaders() });
    }

    const data = await generateCashfreeOrder(amount, phone, returnUrl, env);

    return new Response(JSON.stringify(data), { headers: corsHeaders() });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() });
  }
}

/* =========================================================
   3. PAYMENT UI (HTML Page Generation)
========================================================= */
function paymentUI(sessionId) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f6f8; }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h3 { color: #333; margin-top: 20px; }
    .container { text-align: center; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <h3>Secure Payment</h3>
    <p>Please wait, redirecting...</p>
  </div>

  <script>
    const cashfree = Cashfree({
      mode: "production" 
    });

    cashfree.checkout({
      paymentSessionId: "${sessionId}",
      redirectTarget: "_self" 
    });
  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

/* =========================================================
   4. CHECK STATUS API
========================================================= */
async function checkStatus(url, env) {
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: corsHeaders() });
  }

  try {
    const res = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      }
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: corsHeaders() });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch status" }), { status: 500, headers: corsHeaders() });
  }
}

/* =========================================================
   5. WEBHOOK
========================================================= */
async function cashfreeWebhook(req, env) {
  try {
    let data;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = Object.fromEntries(formData);
    }
    
    const orderId = data?.data?.order?.order_id || data?.order_id;

    if (!orderId) {
        return new Response("No Order ID found", { status: 400 });
    }

    const statusRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
        headers: {
          "x-client-id": env.CASHFREE_APP_ID,
          "x-client-secret": env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01"
        }
    });

    const statusData = await statusRes.json();

    if (statusData.order_status === "PAID") {
      console.log(`Payment Verified for Order: ${orderId}`);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Webhook Error", { status: 500 });
  }
}


