export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // 1. FRONTEND: Payment Form & Status Page
    // ==========================================
    if (url.pathname === "/" && request.method === "GET") {
      const status = url.searchParams.get("status");
      
      // --- Status Page (Success/Fail) ---
      if (status) {
        const isSuccess = status === "success";
        const color = isSuccess ? "#10b981" : "#ef4444";
        const msg = isSuccess ? "Payment Successful!" : "Payment Failed";
        
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Payment Status</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 90%; max-width: 400px; }
              .icon { font-size: 60px; margin-bottom: 20px; display: block; }
              h2 { margin: 10px 0; color: #1e293b; }
              p { color: #64748b; margin-bottom: 30px; }
              button { background: #2563eb; color: white; border: none; padding: 15px 30px; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%; transition: transform 0.2s; }
              button:active { transform: scale(0.98); }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="icon">${isSuccess ? "✅" : "❌"}</span>
              <h2 style="color: ${color}">${msg}</h2>
              <p>${isSuccess ? "Transaction completed successfully." : "The transaction failed or was cancelled."}</p>
              <button onclick="window.location.href='/'">Make Another Payment</button>
            </div>
          </body>
          </html>
        `, { headers: { "content-type": "text/html; charset=utf-8" } });
      }

      // --- Main Payment Form ---
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
            button { width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 16px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2); }
            button:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); }
            button:active { transform: translateY(0); }
            button:disabled { opacity: 0.7; cursor: wait; }
            .error { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 12px; font-size: 14px; margin-top: 20px; display: none; text-align: center; border: 1px solid #fecaca; }
            .secure { text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sewa Sahayak</h1>
              <p>Secure UPI Payment</p>
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
              Pay Now
            </button>
            
            <div id="error" class="error"></div>
            
            <div class="secure">
              🔒 Secured by Cashfree Payments
            </div>
          </div>

          <script>
            async function processPayment() {
              const btn = document.getElementById('payBtn');
              const errorDiv = document.getElementById('error');
              const amount = document.getElementById('amount').value;
              const phone = document.getElementById('phone').value;

              // Reset UI
              errorDiv.style.display = 'none';
              
              // Validation
              if (!amount || amount < 1) {
                showError("Please enter a valid amount (Min ₹1)");
                return;
              }
              if (!phone || phone.length !== 10) {
                showError("Please enter a valid 10-digit phone number");
                return;
              }

              // Loading State
              const originalText = btn.innerText;
              btn.innerText = "Processing...";
              btn.disabled = true;

              try {
                const res = await fetch("/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount, phone })
                });
                
                const data = await res.json();
                
                if (!data.success) {
                  throw new Error(data.message || "Payment initialization failed");
                }
                
                // Success: Redirect to Payment Link
                window.location.href = data.payment_link;
                
              } catch (err) {
                showError(err.message);
                btn.innerText = originalText;
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
    // 2. BACKEND: Create Order API (Auto-Detect Mode)
    // ==========================================
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;

        if (!APP_ID || !SECRET_KEY) {
          throw new Error("API Keys missing in Cloudflare settings");
        }

        // --- AUTO-DETECT ENVIRONMENT ---
        // If key starts with "TEST", use Sandbox. Otherwise, use Live.
        const isTestKey = APP_ID.startsWith("TEST");
        const baseUrl = isTestKey ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";
        
        const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
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
          throw new Error(data.message || "Failed to contact Cashfree");
        }

        // --- SMART REDIRECT ---
        // If using Test Keys, send to Sandbox checkout. If Live Keys, send to Live checkout.
        const checkoutBase = isTestKey ? "https://payments-test.cashfree.com" : "https://payments.cashfree.com";
        const paymentLink = `${checkoutBase}/order/#${data.payment_session_id}`;

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
