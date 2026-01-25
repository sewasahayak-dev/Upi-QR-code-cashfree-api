export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. FRONTEND: Simplified UI (Amount & Phone only)
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak Payment</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; margin: 0; }
              .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 350px; text-align: center; }
              h2 { margin-bottom: 20px; color: #333; }
              input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
              button { width: 100%; padding: 15px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
              button:hover { background: #4f46e5; }
              button:disabled { background: #ccc; }
              .error { color: red; font-size: 14px; margin-top: 10px; display: none; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Pay via QR</h2>
              <input type="number" id="amount" placeholder="Amount (₹)" value="1" min="1">
              <input type="tel" id="phone" placeholder="Phone Number" maxlength="10">
              <button id="payBtn" onclick="startPayment()">Show QR Code</button>
              <div id="error" class="error"></div>
          </div>

          <script>
              async function startPayment() {
                  const amount = document.getElementById('amount').value;
                  const phone = document.getElementById('phone').value;
                  const btn = document.getElementById('payBtn');
                  const err = document.getElementById('error');
                  
                  if (!amount || !phone || phone.length !== 10) {
                      err.innerText = "Please enter valid Amount and Phone";
                      err.style.display = 'block';
                      return;
                  }

                  btn.disabled = true;
                  btn.innerText = "Processing...";
                  err.style.display = 'none';

                  try {
                      const res = await fetch("/create-order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if (data.payment_session_id) {
                          // Redirect specifically to checkout where QR shows up
                          window.location.href = 'https://payments.cashfree.com/order/#' + data.payment_session_id;
                      } else {
                          throw new Error(data.message || "Session creation failed");
                      }
                  } catch (e) {
                      err.innerText = "Error: " + e.message;
                      err.style.display = 'block';
                      btn.disabled = false;
                      btn.innerText = "Try Again";
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // 2. BACKEND: Create Order (Production API)
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const { amount, phone } = await request.json();
        
        // Credentials validation
        if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
            throw new Error("API Keys missing in Cloudflare Settings");
        }

        const orderId = "ORD_" + Date.now();
        
        // Payload for Cashfree
        const payload = {
          order_id: orderId,
          order_amount: parseFloat(amount),
          order_currency: "INR",
          customer_details: {
            customer_id: "CUST_" + phone,
            customer_phone: phone,
            customer_name: "Customer"
          },
          order_meta: {
            // After payment, user comes back here
            return_url: \`https://\${request.headers.get("host")}/?status=success&order_id=\${orderId}\`
          }
        };

        // PRODUCTION API CALL (api.cashfree.com)
        const response = await fetch("https://api.cashfree.com/pg/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": env.CASHFREE_APP_ID,
            "x-client-secret": env.CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return new Response(JSON.stringify({ message: data.message || "API Error" }), { status: 400 });
        }

        return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
