export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // 1. FRONTEND: Payment Form & Status Page
    // ==========================================
    if (url.pathname === "/" && request.method === "GET") {
      const status = url.searchParams.get("status");
      const orderId = url.searchParams.get("order_id");

      // --- Payment Success/Failure Screen ---
      if (status) {
        const isSuccess = status === "success";
        const color = isSuccess ? "#10b981" : "#ef4444";
        const msg = isSuccess ? "Payment Successful!" : "Payment Failed";
        const icon = isSuccess 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' 
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />';

        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Payment Status</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 90%; max-width: 400px; }
              .icon-box { width: 80px; height: 80px; background: ${isSuccess ? '#dcfce7' : '#fee2e2'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
              svg { width: 40px; height: 40px; color: ${color}; }
              h2 { margin: 10px 0; color: #1e293b; }
              p { color: #64748b; margin-bottom: 30px; font-size: 14px; }
              .order-id { background: #f1f5f9; padding: 8px; border-radius: 6px; font-family: monospace; margin-bottom: 20px; display: inline-block; }
              button { background: #2563eb; color: white; border: none; padding: 15px 30px; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon-box">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  ${icon}
                </svg>
              </div>
              <h2>${msg}</h2>
              <div class="order-id">Order: ${orderId || 'N/A'}</div>
              <button onclick="window.location.href='/'">Make Another Payment</button>
            </div>
          </body>
          </html>
        `, { headers: { "content-type": "text/html; charset=utf-8" } });
      }

      // --- Main Payment Form (Clean & Simple) ---
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Sewa Sahayak Pay</title>
          <style>
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .container { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); width: 100%; max-width: 420px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; color: #0f172a; margin: 0 0 8px 0; }
            .header p { color: #64748b; font-size: 14px; margin: 0; }
            .input-group { margin-bottom: 24px; }
            label { display: block; margin-bottom: 8px; color: #334155; font-size: 14px; font-weight: 600; }
            input { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 18px; outline: none; transition: all 0.3s; background: #f8fafc; }
            input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
            button { width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 16px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); display: flex; justify-content: center; align-items: center; gap: 10px; }
            button:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); }
            button:active { transform: translateY(0); }
            button:disabled { opacity: 0.7; cursor: wait; }
            .error { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 12px; font-size: 14px; margin-top: 20px; display: none; text-align: center; border: 1px solid #fecaca; }
            .badge { display: inline-flex; align-items: center; background: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">SECURE PAYMENT</div>
              <h1>Sewa Sahayak</h1>
              <p>Enter details to generate QR Code</p>
            </div>
            
            <div class="input-group">
              <label>Amount (₹)</label>
              <input type="number" id="amount" value="1" min="1" placeholder="0.00">
            </div>
            
            <div class="input-group">
              <label>Phone Number</label>
              <input type="tel" id="phone" maxlength="10" placeholder="10-digit mobile number">
            </div>

            <button id="payBtn" onclick="processPayment()">
              Generate QR Code
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
            </button>
            
            <div id="error" class="error"></div>
          </div>

          <script>
            async function processPayment() {
              const btn = document.getElementById('payBtn');
              const errorDiv = document.getElementById('error');
              const amount = document.getElementById('amount').value;
              const phone = document.getElementById('phone').value;

              errorDiv.style.display = 'none';
              
              if (!amount || amount < 1) {
                showError("Please enter a valid amount (Min ₹1)");
                return;
              }
              if (!phone || phone.length !== 10) {
                showError("Please enter a valid 10-digit phone number");
                return;
              }

              // Loading Animation
              const originalContent = btn.innerHTML;
              btn.innerHTML = "Generating Link...";
              btn.disabled = true;

              try {
                const res = await fetch("/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, phone })
                });
                
                const data = await res.json();
                
                if (!data.success) {
                  throw new Error(data.message || "Connection failed");
                }
                
                // --- DIRECT REDIRECT TO CASHFREE (QR CODE PAGE) ---
                window.location.href = data.payment_link;
                
              } catch (err) {
                showError(err.message);
                btn.innerHTML = originalContent;
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

    // ==========================================
    // 2. BACKEND: Create Order API (Smart Auto-Detect)
    // ==========================================
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        // Get keys from Cloudflare Settings
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;

        if (!APP_ID || !SECRET_KEY) {
          throw new Error("API Keys missing in Cloudflare settings");
        }

        // --- MAGIC FIX: Check if using TEST keys or LIVE keys ---
        const isTestKey = APP_ID.startsWith("TEST");
        const baseUrl = isTestKey ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";
        
        const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Prepare Cashfree Data
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
            return_url: `https://${url.hostname}/?order_id=${orderId}&status=success`,
            notify_url: `https://${url.hostname}/webhook`
          }
        };

        // Call Cashfree API
        const cfResponse = await fetch(`${baseUrl}/orders`, {
          method: "POST",
          headers: {
            "x-client-id": APP_ID,
            "x-client-secret": SECRET_KEY,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await cfResponse.json();

        if (!cfResponse.ok) {
          throw new Error(data.message || "Failed to create order");
        }

        // --- SMART LINK GENERATION ---
        // Test Keys -> Sandbox Link
        // Live Keys -> Real Payment Link
        let paymentLink = data.payment_link; 
        
        // Fallback if direct link isn't provided (Rare, but safety first)
        if(!paymentLink) {
             const checkoutBase = isTestKey ? "https://payments-test.cashfree.com" : "https://payments.cashfree.com";
             paymentLink = `${checkoutBase}/order/#${data.payment_session_id}`;
        }

        return new Response(JSON.stringify({
          success: true,
          payment_link: paymentLink
        }), { headers: { "content-type": "application/json" } });

      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: error.message 
        }), { headers: { "content-type": "application/json" } });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
