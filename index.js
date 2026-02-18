export default {
  async fetch(req, env) {
    // 1. CORS Handle (ताकि आप इसे किसी भी वेबसाइट से कॉल कर सकें)
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }

    const url = new URL(req.url);

    // --- ROUTES ---

    // 1. URL से डायरेक्ट पेमेंट (Instant Link)
    // Usage: /pay-link?amount=100&phone=9999999999&return_url=https://your-site.com/thank-you
    if (url.pathname === "/pay-link" && req.method === "GET") {
      return handleInstantLink(url, env);
    }

    // 2. Order Create API (JSON वाला - वेबसाइट इंटीग्रेशन के लिए)
    if (url.pathname === "/api/create" && req.method === "POST") {
      return createOrderAPI(req, env);
    }

    // 3. पेमेंट पेज UI (Flipkart Style - Worker के अंदर रेंडर होने वाला पेज)
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

  // URL में ?order_id={order_id} जोड़ना जरुरी है
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

/* =========================================================
   1. INSTANT URL LINK HANDLER
========================================================= */
async function handleInstantLink(url, env) {
  try {
    const amount = Number(url.searchParams.get("amount"));
    const phone = url.searchParams.get("phone");
    const returnUrl = url.searchParams.get("return_url") || url.searchParams.get("redirect_url");

    if (!amount || amount < 1 || !phone) {
      return new Response("Error: Please provide 'amount' and 'phone' in URL.", { status: 400 });
    }

    const data = await generateCashfreeOrder(amount, phone, returnUrl, env);

    if (data.payment_session_id) {
      // सीधा HTML पेज return करें जो Flipkart Style Payment दिखाएगा
      return paymentUI(data.payment_session_id);
    } else {
      return new Response("Error creating order: " + JSON.stringify(data), { status: 500 });
    }

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}

/* =========================================================
   2. API: CREATE ORDER (JSON Response)
========================================================= */
async function createOrderAPI(req, env) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const phone = body.phone;
    const returnUrl = body.return_url;

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
   3. PAYMENT UI (UPDATED: FLIPKART STYLE SEAMLESS)
========================================================= */
function paymentUI(sessionId) {
  // यह HTML Flipkart/Meesho जैसा अनुभव देने के लिए डिजाईन किया गया है
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Payment</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f3f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; width: 100%; max-width: 400px; padding: 25px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
    h2 { margin: 10px 0 5px; color: #2874f0; font-size: 20px; }
    .subtitle { color: #878787; font-size: 13px; margin-bottom: 25px; }
    
    /* Loading Spinner */
    .loader { border: 3px solid #f3f3f3; border-top: 3px solid #2874f0; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Dropin Container Style */
    #dropin-container { min-height: 300px; margin-top: 20px; text-align: left; }
    
    .secure-icon { color: green; font-size: 12px; margin-top: 15px; display: block; }
  </style>
</head>
<body>

  <div class="card">
    <h2>Complete Payment</h2>
    <p class="subtitle">Select your preferred payment method</p>
    
    <div id="dropin-container">
        <div class="loader"></div>
        <p style="text-align:center; font-size:12px; color:#666;">Loading Payment Options...</p>
    </div>

    <span class="secure-icon">🔒 100% Secure via Cashfree Payments</span>
  </div>

  <script>
    const cashfree = Cashfree({
      mode: "production" 
    });

    const sessionId = "${sessionId}";

    // Drop-in Component Initialization
    // यह अपने आप मोबाइल पर UPI Apps और डेस्कटॉप पर QR Code/Cards दिखाएगा
    cashfree.initialiseDropin(document.getElementById("dropin-container"), {
      paymentSessionId: sessionId,
      components: [
        "order-details",
        "card",
        "upi",
        "app",
        "netbanking"
      ],
      style: {
        backgroundColor: "#ffffff",
        color: "#111111",
        fontFamily: "sans-serif",
        fontSize: "14px",
        errorColor: "#ff0000",
        theme: "light", 
      }
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
