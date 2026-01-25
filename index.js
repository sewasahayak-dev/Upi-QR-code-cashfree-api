export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. HOME PAGE & STATUS PAGE
    if (url.pathname === "/" && request.method === "GET") {
      const status = url.searchParams.get("status");
      
      // Payment Status View
      if (status) {
        const isSuccess = status === "success";
        const color = isSuccess ? "#10b981" : "#ef4444";
        const msg = isSuccess ? "Payment Successful!" : "Payment Failed";
        
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Status</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 16px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 90%; max-width: 400px; }
              .icon { font-size: 50px; color: ${color}; margin-bottom: 20px; }
              button { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px; width: 100%; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">${isSuccess ? "✅" : "❌"}</div>
              <h2>${msg}</h2>
              <p>${isSuccess ? "Thank you for your payment." : "Please try again."}</p>
              <button onclick="window.location.href='/'">Go Back</button>
            </div>
          </body>
          </html>
        `, { headers: { "content-type": "text/html" } });
      }

      // Main Payment Form
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Sewa Sahayak Payment</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            h2 { text-align: center; color: #1f2937; margin-bottom: 20px; }
            .input-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; color: #4b5563; font-weight: 500; }
            input { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px; outline: none; transition: 0.3s; }
            input:focus { border-color: #2563eb; }
            button { width: 100%; padding: 16px; background: #2563eb; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.3s; }
            button:hover { background: #1d4ed8; }
            button:disabled { background: #9ca3af; cursor: not-allowed; }
            .error { color: #ef4444; font-size: 14px; text-align: center; margin-top: 10px; display: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Scan & Pay</h2>
            <div class="input-group">
              <label>Amount (₹)</label>
              <input type="number" id="amount" value="1" min="1">
            </div>
            <div class="input-group">
              <label>Mobile Number</label>
              <input type="tel" id="phone" placeholder="Enter 10-digit number" maxlength="10">
            </div>
            <button id="payBtn" onclick="initiatePayment()">Show QR Code</button>
            <div id="error" class="error"></div>
          </div>

          <script>
            async function initiatePayment() {
              const btn = document.getElementById('payBtn');
              const errorDiv = document.getElementById('error');
              const amount = document.getElementById('amount').value;
              const phone = document.getElementById('phone').value;

              errorDiv.style.display = 'none';

              if (!amount || amount < 1) return showError("Please enter valid amount");
              if (!phone || phone.length !== 10) return showError("Please enter 10-digit mobile number");

              btn.innerText = "Processing...";
              btn.disabled = true;

              try {
                const res = await fetch("/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, phone })
                });
                
                const data = await res.json();
                
                if (!res.ok) throw new Error(data.message || "Failed to create order");
                
                // Redirect to Cashfree Checkout
                window.location.href = data.payment_link;
                
              } catch (err) {
                showError(err.message);
                btn.innerText = "Show QR Code";
                btn.disabled = false;
              }
            }

            function showError(msg) {
              const el = document.getElementById('error');
              el.innerText = msg;
              el.style.display = 'block';
            }
          </script>
        </body>
        </html>
      `, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    // 2. CREATE ORDER API (LIVE MODE)
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        // Credentials check
        if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
          throw new Error("API Keys missing in Cloudflare Settings");
        }

        const orderId = `ORDER_${Date.now()}`;
        
        // Cashfree LIVE API Payload
        const payload = {
          order_id: orderId,
          order_amount: parseFloat(body.amount),
          order_currency: "INR",
          customer_details: {
            customer_id: `CUST_${Date.now()}`,
            customer_phone: body.phone,
            customer_name: "Customer"
          },
          order_meta: {
            return_url: \`https://\${url.hostname}/?order_id={order_id}&status=success\`,
            notify_url: \`https://\${url.hostname}/webhook\`
          }
        };

        // Call Cashfree Production API
        const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
          method: "POST",
          headers: {
            "x-client-id": env.CASHFREE_APP_ID,
            "x-client-secret": env.CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await cfResponse.json();

        if (!cfResponse.ok) {
          console.error("Cashfree Error:", data);
          throw new Error(data.message || "Cashfree API Error");
        }

        return new Response(JSON.stringify({
          success: true,
          payment_link: \`https://payments.cashfree.com/order/#\${data.payment_session_id}\`
        }), { headers: { "content-type": "application/json" } });

      } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), {
          status: 400, headers: { "content-type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
