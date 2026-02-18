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
   3. PAYMENT UI (FINAL FIXED - COMPONENTS MODE)
========================================================= */
function paymentUI(sessionId) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay Securely</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f1f3f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; width: 100%; max-width: 380px; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    h2 { margin-bottom: 5px; color: #2874f0; } /* Flipkart Blue */
    p { color: #878787; font-size: 14px; margin-bottom: 30px; }
    
    /* UPI Button Containers */
    #mobile-view, #desktop-view { width: 100%; }
    #upi-intent-btn { width: 100%; margin-top: 20px; }
    #qr-container { margin: 0 auto; display: flex; justify-content: center; }
    
    .divider { margin: 20px 0; border-top: 1px solid #eee; }
    .fallback-link { font-size: 12px; color: #2874f0; text-decoration: none; cursor: pointer; }
    
    /* Error Message */
    #error-box { color: red; font-size: 12px; margin-top: 10px; display: none; }
  </style>
</head>
<body>

  <div class="card">
    <h2>Total Payable</h2>
    <p>Secure Payment via UPI</p>

    <div id="mobile-view" style="display:none;">
      <div id="upi-intent-btn"></div>
      <p style="font-size: 12px; margin-top: 10px; color:#666;">Tap above to pay with PhonePe / GPay</p>
    </div>

    <div id="desktop-view" style="display:none;">
      <div id="qr-container"></div>
      <p style="margin-top: 15px; font-size:12px;">Scan with any UPI App to Pay</p>
    </div>

    <p id="error-box"></p>

    <div class="divider"></div>
    <a onclick="openFullPage()" class="fallback-link">More Payment Options (Card/Netbanking)</a>
  </div>

  <script>
    const sessionId = "${sessionId}";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    try {
        // 👇 NOTE: अगर अभी भी Error आए, तो "sandbox" को "production" कर दें
        const cashfree = Cashfree({
            mode: "sandbox" 
        });

        if (isMobile) {
            // --- MOBILE: SHOW BUTTON ---
            document.getElementById('mobile-view').style.display = 'block';
            
            // यह बटन Flipkart जैसा दिखेगा
            const upiComponent = cashfree.create("upiApp", {
                values: {
                    buttonText: "PAY NOW VIA UPI",
                    buttonIcon: true
                },
                style: {
                    fontSize: "16px",
                    fontFamily: "sans-serif",
                    color: "#ffffff",
                    backgroundColor: "#fb641b", // Flipkart Orange
                    borderRadius: "4px",
                    padding: "12px",
                    fontWeight: "bold"
                }
            });
            upiComponent.mount("#upi-intent-btn");

        } else {
            // --- DESKTOP: SHOW QR CODE ---
            document.getElementById('desktop-view').style.display = 'block';

            const qrComponent = cashfree.create("upiQr", {
                values: { size: "200px" }
            });
            qrComponent.mount("#qr-container");
        }

    } catch (err) {
        document.getElementById("error-box").style.display = "block";
        document.getElementById("error-box").innerText = "Error: " + err.message;
    }

    // Fallback Function
    function openFullPage() {
      const cfFallback = Cashfree({ mode: "sandbox" });
      cfFallback.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_self"
      });
    }
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
