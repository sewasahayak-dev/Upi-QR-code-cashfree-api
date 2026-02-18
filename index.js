export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return handleOptions(req);
    const url = new URL(req.url);

    // 1. Pay Link
    if (url.pathname === "/pay-link" && req.method === "GET") return handleInstantLink(url, env);
    // 2. API Create
    if (url.pathname === "/api/create" && req.method === "POST") return createOrderAPI(req, env);
    // 3. Payment UI Page
    if (url.pathname === "/pay" && req.method === "GET") {
      const sessionId = url.searchParams.get("session_id");
      if(sessionId) return paymentUI(sessionId);
      return new Response("Session ID Missing", { status: 400 });
    }
    // 4. Status Check
    if (url.pathname === "/api/status" && req.method === "GET") return checkStatus(url, env);
    // 5. Webhook
    if (url.pathname === "/webhook/cashfree" && req.method === "POST") return cashfreeWebhook(req, env);

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: corsHeaders() });
  }
};

/* --- HELPER FUNCTIONS --- */
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
}
function handleOptions(req) { return new Response(null, { headers: corsHeaders() }); }

/* --- ORDER GENERATION --- */
async function generateCashfreeOrder(amount, phone, customReturnUrl, env) {
  const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  let finalReturnUrl = customReturnUrl || "https://bazaarika.in/payment-success";
  finalReturnUrl = finalReturnUrl.includes("?") ? finalReturnUrl + "&order_id={order_id}" : finalReturnUrl + "?order_id={order_id}";

  const payload = {
    order_id: orderId, order_amount: amount, order_currency: "INR",
    customer_details: { customer_id: phone.replace(/\D/g, ''), customer_phone: phone.replace(/\D/g, '') },
    order_meta: { return_url: finalReturnUrl }
  };

  const res = await fetch("https://api.cashfree.com/pg/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-client-id": env.CASHFREE_APP_ID, "x-client-secret": env.CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function handleInstantLink(url, env) {
  try {
    const amount = Number(url.searchParams.get("amount"));
    const phone = url.searchParams.get("phone");
    const returnUrl = url.searchParams.get("return_url") || url.searchParams.get("redirect_url");
    if (!amount || amount < 1 || !phone) return new Response("Error: Provide amount & phone", { status: 400 });

    const data = await generateCashfreeOrder(amount, phone, returnUrl, env);
    if (data.payment_session_id) return paymentUI(data.payment_session_id);
    else return new Response("Error: " + JSON.stringify(data), { status: 500 });
  } catch (err) { return new Response("Server Error: " + err.message, { status: 500 }); }
}

async function createOrderAPI(req, env) {
  try {
    const body = await req.json();
    const data = await generateCashfreeOrder(Number(body.amount), body.phone, body.return_url, env);
    return new Response(JSON.stringify(data), { headers: corsHeaders() });
  } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders() }); }
}

/* =========================================================
   PAYMENT UI (FLIPKART STYLE - PRODUCTION MODE)
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
    body { font-family: sans-serif; background: #f1f3f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: white; width: 100%; max-width: 380px; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    h2 { color: #2874f0; margin-bottom: 5px; } 
    
    #mobile-view, #desktop-view { width: 100%; display: none; }
    #upi-intent-btn { width: 100%; margin-top: 20px; }
    #qr-container { margin: 0 auto; display: flex; justify-content: center; margin-top: 15px; }
    
    .divider { margin: 25px 0; border-top: 1px solid #eee; }
    .fallback-link { font-size: 13px; color: #2874f0; cursor: pointer; text-decoration: none; }
    #error-box { color: red; font-size: 12px; margin-top: 15px; display: none; background: #ffebee; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Total Payable</h2>
    <p style="color:#666; font-size:14px;">Secure Payment via UPI</p>

    <div id="mobile-view">
      <div id="upi-intent-btn"></div>
      <p style="font-size: 12px; margin-top: 10px; color:#888;">Tap to pay via PhonePe / GPay / Paytm</p>
    </div>

    <div id="desktop-view">
      <div id="qr-container"></div>
      <p style="margin-top: 15px; font-size:12px; color:#666;">Scan QR with any UPI App</p>
    </div>

    <div id="error-box"></div>

    <div class="divider"></div>
    <a onclick="openFullPage()" class="fallback-link">More Payment Options (Card/Netbanking)</a>
  </div>

  <script>
    const sessionId = "${sessionId}";
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    try {
        // ✅ FIXED: Changed to "production" to match your Real Keys
        const cashfree = Cashfree({ mode: "production" });

        if (isMobile) {
            document.getElementById('mobile-view').style.display = 'block';
            const upiComponent = cashfree.create("upiApp", {
                values: { buttonText: "PAY NOW VIA UPI", buttonIcon: true },
                style: { fontSize: "16px", color: "#fff", backgroundColor: "#fb641b", borderRadius: "4px", padding: "14px", fontWeight: "bold", fontFamily: "sans-serif" }
            });
            upiComponent.mount("#upi-intent-btn");
        } else {
            document.getElementById('desktop-view').style.display = 'block';
            const qrComponent = cashfree.create("upiQr", { values: { size: "200px" } });
            qrComponent.mount("#qr-container");
        }
    } catch (err) {
        document.getElementById("error-box").style.display = "block";
        document.getElementById("error-box").innerText = "Error: " + err.message;
    }

    function openFullPage() {
      // Fallback checkout redirect
      const cf = Cashfree({ mode: "production" });
      cf.checkout({ paymentSessionId: sessionId, redirectTarget: "_self" });
    }
  </script>
</body>
</html>
`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
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
