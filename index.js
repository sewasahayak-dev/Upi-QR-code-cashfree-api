export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---------------- CONFIGURATION ----------------
    // Agar Live/Real money lena hai to isse false karein
    const IS_SANDBOX = true; 
    
    const API_URL = IS_SANDBOX 
      ? "https://sandbox.cashfree.com/pg/orders" 
      : "https://api.cashfree.com/pg/orders";
      
    const CHECKOUT_URL = IS_SANDBOX
      ? "https://payments-test.cashfree.com/order/#"
      : "https://payments.cashfree.com/order/#";
    // -----------------------------------------------

    if (url.pathname === "/" && request.method === "GET") {
      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");
      
      // Payment Status Page
      if (orderId) {
        let title, message, iconColor, bgColor;
        
        if (status === "success") {
          title = "Payment Successful!";
          message = `Your payment has been processed successfully.`;
          iconColor = "#10b981";
          bgColor = "#d1fae5";
        } else if (status === "failed") {
          title = "Payment Failed";
          message = "Your payment could not be processed. Please try again.";
          iconColor = "#ef4444";
          bgColor = "#fee2e2";
        } else {
          title = "Processing...";
          message = "Verifying payment status...";
          iconColor = "#f59e0b";
          bgColor = "#fef3c7";
        }

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Status</title>
            <style>
                body { font-family: sans-serif; background: #f8f9fa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
                .icon { width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; background: ${bgColor}; color: ${iconColor}; font-size: 30px; }
                h1 { color: ${iconColor}; margin: 0 0 10px; font-size: 24px; }
                p { color: #64748b; margin-bottom: 20px; }
                button { background: #6366f1; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-size: 16px; width: 100%; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">${status === 'success' ? '✔' : status === 'failed' ? '✖' : '!'}</div>
                <h1>${title}</h1>
                <p>${message}</p>
                <p style="font-size: 12px; background: #f1f5f9; padding: 5px; border-radius: 5px;">Order: ${orderId}</p>
                <button onclick="window.location.href='/'">New Payment</button>
            </div>
        </body>
        </html>`;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }

      // Main Payment Form
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak - UPI Payment</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: 'Inter', sans-serif; background: #f0f2f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
              .container { background: white; width: 100%; max-width: 420px; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
              .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px 20px; text-align: center; color: white; }
              .amount-display { font-size: 42px; font-weight: 700; margin: 10px 0; }
              .content { padding: 30px; }
              .input-group { margin-bottom: 20px; }
              .input-group label { display: block; color: #64748b; font-size: 14px; margin-bottom: 8px; font-weight: 600; }
              input { width: 100%; padding: 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 18px; outline: none; transition: 0.2s; }
              input:focus { border-color: #6366f1; }
              .pay-btn { width: 100%; padding: 18px; background: #101827; color: white; border: none; border-radius: 14px; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; }
              .pay-btn:disabled { opacity: 0.7; cursor: not-allowed; }
              .secure-note { text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 5px; }
              .error { color: #ef4444; font-size: 14px; text-align: center; margin-top: 10px; display: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div style="font-size: 18px; opacity: 0.9;">Payment to Sewa Sahayak</div>
                  <div class="amount-display">₹<span id="display-amt">1</span></div>
              </div>
              <div class="content">
                  <div class="input-group">
                      <label>Amount (₹)</label>
                      <input type="number" id="amount" value="1" min="1" oninput="document.getElementById('display-amt').innerText = this.value || 0">
                  </div>
                  <div class="input-group">
                      <label>Phone Number</label>
                      <input type="tel" id="phone" placeholder="9876543210" maxlength="10">
                  </div>
                  
                  <button id="pay-btn" class="pay-btn" onclick="initiatePayment()">
                      Pay with UPI QR
                      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  <div id="error-msg" class="error"></div>
                  
                  <div class="secure-note">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                      Secured by Cashfree Payments
                  </div>
              </div>
          </div>

          <script>
              async function initiatePayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const errorDiv = document.getElementById("error-msg");
                  
                  errorDiv.style.display = "none";
                  
                  if (!amount || amount < 1) return showErr("Enter valid amount");
                  if (!phone || phone.length !== 10) return showErr("Enter valid 10-digit phone");

                  btn.innerHTML = "Processing...";
                  btn.disabled = true;

                  try {
                      const res = await fetch("/create-order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if (!res.ok) throw new Error(data.message || "Failed to create order");
                      
                      // Redirect to Payment Page (QR Code wahan dikhega)
                      window.location.href = data.payment_link;
                      
                  } catch (err) {
                      showErr(err.message);
                      btn.innerHTML = "Pay with UPI QR";
                      btn.disabled = false;
                  }
              }

              function showErr(msg) {
                  const el = document.getElementById("error-msg");
                  el.innerText = msg;
                  el.style.display = "block";
              }
          </script>
      </body>
      </html>`;
      
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    // API to Create Order
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = env;

        if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) throw new Error("Credentials missing");

        const orderId = "ORD_" + Date.now() + Math.floor(Math.random() * 1000);
        
        // Configuration Check
        const IS_SANDBOX = true; // Make sure this matches top config
        const API_URL = IS_SANDBOX 
           ? "https://sandbox.cashfree.com/pg/orders" 
           : "https://api.cashfree.com/pg/orders";
        
        const CHECKOUT_URL = IS_SANDBOX
           ? "https://payments-test.cashfree.com/order/#"
           : "https://payments.cashfree.com/order/#";

        // Cashfree Order Payload
        const payload = {
          order_id: orderId,
          order_amount: parseFloat(body.amount),
          order_currency: "INR",
          customer_details: {
            customer_id: "CUST_" + body.phone,
            customer_phone: body.phone,
            customer_name: "Customer"
          },
          order_meta: {
            return_url: \`https://\${url.host}/?order_id={order_id}&status={order_status}\`
          }
        };

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("Cashfree Error:", data);
            throw new Error(data.message || "Payment Gateway Error");
        }

        return new Response(JSON.stringify({
          success: true,
          payment_session_id: data.payment_session_id,
          // Correct Payment Link based on Environment
          payment_link: CHECKOUT_URL + data.payment_session_id
        }), { headers: { "content-type": "application/json" } });

      } catch (error) {
        return new Response(JSON.stringify({ error: true, message: error.message }), { 
            status: 500, headers: { "content-type": "application/json" } 
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
