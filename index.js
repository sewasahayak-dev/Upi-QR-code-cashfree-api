export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // 1. CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-version",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API: Order Create Karen
      if (url.pathname === "/api/create" && req.method === "POST") {
        return await createOrder(req, env, url, corsHeaders);
      }

      // UI: Payment Page Dikhayein
      if (url.pathname === "/pay") {
        return paymentUI(url);
      }

      // API: Payment Status Check
      if (url.pathname === "/api/status") {
        return await checkStatus(url, env, corsHeaders);
      }

      // WEBHOOK: Cashfree Server se update receive karein
      if (url.pathname === "/webhook/cashfree" && req.method === "POST") {
        return await handleWebhook(req, env);
      }

      return new Response("Not Found", { status: 404 });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};

/* ============================================================
   1. CREATE ORDER
   ============================================================ */
async function createOrder(req, env, url, corsHeaders) {
  const { amount, phone, name } = await req.json();

  if (!amount || !phone) {
    throw new Error("Amount and Phone are required");
  }

  const orderId = "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  const payload = {
    order_id: orderId,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: phone.replace(/[^a-zA-Z0-9]/g, "_"),
      customer_phone: phone,
      customer_name: name || "Customer"
    },
    order_meta: {
      return_url: `${url.origin}/pay?oid={order_id}`
    }
  };

  const response = await fetch("https://api.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "x-client-id": env.CASHFREE_APP_ID,      // <--- UPDATED
      "x-client-secret": env.CASHFREE_SECRET_KEY, // <--- UPDATED
      "x-api-version": "2023-08-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/* ============================================================
   2. PAYMENT UI
   ============================================================ */
function paymentUI(url) {
  const oid = url.searchParams.get("oid");
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Payment</title>
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 450px; text-align: center; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #msg { color: #e74c3c; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="card">
        <h2 id="status-title">Processing Payment...</h2>
        <p>Order ID: <strong>${oid || 'Unknown'}</strong></p>
        <div id="payment-box">
            <div class="loader"></div>
        </div>
        <p id="msg"></p>
    </div>

    <script>
        const cf = Cashfree({ mode: "production" });
        const orderId = "${oid}";

        async function start() {
            try {
                if(!orderId) throw new Error("Invalid Order ID");

                const res = await fetch("/api/status?order_id=" + orderId);
                const data = await res.json();

                if (data.payment_session_id) {
                    document.getElementById("status-title").innerText = "Complete Payment";
                    document.getElementById("payment-box").innerHTML = ""; 
                    
                    const dropin = cf.create("dropin", {
                        paymentSessionId: data.payment_session_id,
                        redirectTarget: "_self",
                        appearance: { width: "100%", height: "600px" }
                    });
                    dropin.mount("#payment-box");
                } else {
                    if(data.order_status === "PAID") {
                         document.getElementById("status-title").innerText = "Payment Successful ✅";
                         document.getElementById("payment-box").innerHTML = "<p>Thank you for your order.</p>";
                    } else {
                        throw new Error(data.message || "Session creation failed");
                    }
                }
            } catch (err) {
                console.error(err);
                document.getElementById("payment-box").innerHTML = "";
                document.getElementById("msg").innerText = err.message;
            }
        }
        start();
    </script>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

/* ============================================================
   3. STATUS CHECK HELPER
   ============================================================ */
async function checkStatus(url, env, corsHeaders) {
  const oid = url.searchParams.get("order_id");
  
  const r = await fetch(`https://api.cashfree.com/pg/orders/${oid}`, {
    headers: {
      "x-client-id": env.CASHFREE_APP_ID,      // <--- UPDATED
      "x-client-secret": env.CASHFREE_SECRET_KEY, // <--- UPDATED
      "x-api-version": "2023-08-01"
    }
  });

  const data = await r.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/* ============================================================
   4. WEBHOOK HANDLER
   ============================================================ */
async function handleWebhook(req, env) {
  try {
    const ts = req.headers.get("x-webhook-timestamp");
    const signature = req.headers.get("x-webhook-signature");
    const rawBody = await req.text();

    if (!ts || !signature) return new Response("Missing Headers", { status: 400 });

    // Verify using new secret variable name
    const isValid = await verifySignature(ts, rawBody, signature, env.CASHFREE_SECRET_KEY); // <--- UPDATED

    if (!isValid) {
      console.error("Webhook Signature Mismatch!");
      return new Response("Invalid Signature", { status: 403 });
    }

    const data = JSON.parse(rawBody);

    if (data.type === "PAYMENT_SUCCESS_WEBHOOK") {
        const orderId = data.data.order.order_id;
        console.log(`Payment Success for: ${orderId}`);
        // Database update logic here
    }

    return new Response("OK", { status: 200 });

  } catch (e) {
    console.error("Webhook Error:", e);
    return new Response("Error", { status: 500 });
  }
}

async function verifySignature(ts, rawBody, receivedSignature, secret) {
  const encoder = new TextEncoder();
  const dataToSign = ts + rawBody;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const signatureBin = Uint8Array.from(atob(receivedSignature), c => c.charCodeAt(0));
  return await crypto.subtle.verify("HMAC", key, signatureBin, encoder.encode(dataToSign));
}
