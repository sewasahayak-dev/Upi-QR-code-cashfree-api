export default {
  async fetch(req, env) {
    // 1. CORS Handle (ताकि आप इसे किसी भी वेबसाइट से कॉल कर सकें)
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }

    const url = new URL(req.url);

    // --- ROUTES ---

    // 1. Order Create करने के लिए (दूसरी वेबसाइट से कॉल करें)
    if (url.pathname === "/api/create" && req.method === "POST") {
      return createOrder(req, env);
    }

    // 2. पेमेंट पेज (iframe या Redirect के लिए)
    if (url.pathname === "/pay" && req.method === "GET") {
      return paymentUI(url);
    }

    // 3. पेमेंट स्टेटस चेक करने के लिए
    if (url.pathname === "/api/status" && req.method === "GET") {
      return checkStatus(url, env);
    }

    // 4. Webhook (Cashfree इसे कॉल करेगा)
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
   HELPER: CORS HEADERS (महत्वपूर्ण)
========================================================= */
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // या अपनी वेबसाइट का नाम लिखें
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
   1. CREATE ORDER (SECURE & EMBEDDABLE)
========================================================= */
async function createOrder(req, env) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const phone = body.phone;
    // अगर return_url नहीं दिया, तो डिफ़ॉल्ट worker का /pay पेज रहेगा
    const returnUrl = body.return_url || "https://bazaarika.in/payment-success"; 

    if (!amount || amount < 1 || !phone) {
      return new Response(JSON.stringify({ error: "Invalid amount or phone" }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: phone.replace(/\D/g, ''), // केवल नंबर रखें
        customer_phone: phone.replace(/\D/g, '')
      },
      order_meta: {
        return_url: returnUrl + "?order_id={order_id}"
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
    
    // Response में payment_session_id भेजें ताकि Frontend उसे इस्तेमाल कर सके
    return new Response(JSON.stringify(data), {
      headers: corsHeaders()
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

/* =========================================================
   2. CHECK STATUS (FROM ANY WEBSITE)
========================================================= */
async function checkStatus(url, env) {
  const orderId = url.searchParams.get("order_id");

  if (!orderId) {
    return new Response(JSON.stringify({ error: "Missing order_id" }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  try {
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
    return new Response(JSON.stringify(data), {
      headers: corsHeaders()
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch status" }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

/* =========================================================
   3. PAYMENT UI (HOSTED CHECKOUT PAGE)
========================================================= */
function paymentUI(url) {
  // हम सीधे payment_session_id लेंगे जो ज्यादा सुरक्षित है
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing Session ID", { status: 400 });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Payment</title>
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
    <h3>Initializing Payment...</h3>
    <p>Please wait, do not close this window.</p>
  </div>

  <script>
    const cashfree = Cashfree({
      mode: "production" // हमेशा production रखें
    });

    // Payment Session ID से चेकआउट शुरू करें
    cashfree.checkout({
      paymentSessionId: "${sessionId}",
      redirectTarget: "_self" // या "_self" अगर redirect चाहिए, "_blank" नहीं
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
   4. WEBHOOK (DOUBLE CHECK SECURITY)
========================================================= */
async function cashfreeWebhook(req, env) {
  try {
    // 1. Webhook का data पढ़ें
    // नोट: Cashfree URLEncoded भेज सकता है या JSON, दोनों को हैंडल करें
    let data;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = Object.fromEntries(formData);
    }

    // data.data.order.order_id Cashfree के नए webhook format में होता है
    // या पुराने में सीधे data.orderId हो सकता है। 
    // सबसे सुरक्षित तरीका: सीधे Cashfree API से Status पूछें (Trust but Verify)
    
    const orderId = data?.data?.order?.order_id || data?.order_id;

    if (!orderId) {
        return new Response("No Order ID found", { status: 400 });
    }

    // 2. DOUBLE CHECK: सीधे Cashfree Server से पूछें कि क्या पेमेंट सच में हुआ है?
    // यह हैकर्स से बचने का सबसे अच्छा तरीका है (Signature verify न भी हो तो यह काम करेगा)
    const statusRes = await fetch(
      `https://api.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          "x-client-id": env.CASHFREE_APP_ID,
          "x-client-secret": env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01"
        }
      }
    );

    const statusData = await statusRes.json();

    if (statusData.order_status === "PAID") {
      // ✅ SUCCESS: यहाँ अपना Database update करें या Email भेजें
      console.log(`Payment Verified for Order: ${orderId}`);
    } else {
      console.log(`Payment Failed or Pending for Order: ${orderId}`);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    return new Response("Webhook Error", { status: 500 });
  }
}
