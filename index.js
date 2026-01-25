export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ------------------------------------------------------------------
    // 1. PAYMENT RETURN/SUCCESS PAGE
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET" && url.searchParams.get("order_id")) {
      const orderId = url.searchParams.get("order_id");
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Status - Sewa Sahayak</title>
            <style>
                body { font-family: sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 90%; width: 400px; }
                .icon { width: 80px; height: 80px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 40px; }
                h1 { color: #15803d; margin: 0 0 10px; }
                p { color: #64748b; margin-bottom: 25px; }
                button { background: #22c55e; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">✓</div>
                <h1>Payment Successful!</h1>
                <p>Order ID: ${orderId}<br>Thank you for using Sewa Sahayak.</p>
                <button onclick="window.location.href='/'">Make Another Payment</button>
            </div>
        </body>
        </html>`;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 2. MAIN PAYMENT PAGE (UI - EMBEDDED)
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Sewa Sahayak Payment</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
              body { background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
              
              .container {
                  background: #ffffff;
                  width: 100%;
                  max-width: 450px; /* Slightly wider for embedded frame */
                  border-radius: 24px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                  overflow: hidden;
                  position: relative;
                  min-height: 400px;
              }
              
              .header {
                  background: #4f46e5;
                  padding: 20px 24px;
                  text-align: center;
                  color: white;
              }
              .header h2 { font-size: 20px; font-weight: 700; margin-bottom: 5px; }
              .header p { font-size: 13px; opacity: 0.9; }
              
              .form-body { padding: 30px 24px; transition: opacity 0.3s ease; }
              
              /* Payment Container for Embedded View */
              #payment-container {
                  width: 100%;
                  height: 600px; /* Adjust height for payment options */
                  display: none; /* Hidden by default */
              }

              .input-group { margin-bottom: 20px; }
              .label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
              
              .input-wrapper {
                  position: relative;
                  background: #f9fafb;
                  border: 2px solid #e5e7eb;
                  border-radius: 14px;
                  transition: all 0.3s;
              }
              .input-wrapper:focus-within { border-color: #4f46e5; background: #fff; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
              
              input {
                  width: 100%;
                  padding: 16px;
                  border: none;
                  background: transparent;
                  font-size: 16px;
                  font-weight: 500;
                  color: #1f2937;
                  outline: none;
              }
              
              /* QR Code Hint */
              .qr-hint {
                  background: #eff6ff;
                  border: 1px dashed #3b82f6;
                  border-radius: 12px;
                  padding: 12px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 24px;
              }
              .qr-icon { width: 32px; height: 32px; flex-shrink: 0; }
              .qr-text { font-size: 12px; color: #1e40af; line-height: 1.4; }
              
              button {
                  width: 100%;
                  padding: 18px;
                  background: #4f46e5;
                  color: white;
                  border: none;
                  border-radius: 14px;
                  font-size: 16px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: transform 0.1s;
                  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
              
              .loader {
                  width: 20px; height: 20px; border: 3px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; margin-right: 10px; vertical-align: middle;
              }
              @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h2>Sewa Sahayak</h2>
                  <p>Secure Instant Payment</p>
              </div>
              
              <div class="form-body" id="userForm">
                  <div class="qr-hint">
                      <svg class="qr-icon" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4H6v4H6v4h6v-4h4v2H6v4h6v-4h4v2H6v4h6v-4h4v2H6v4h6v-4h4v2H6v4h6v-4h4v2H6v4h6v-4h4v2zM6 8V6h4v2H6zm0 8v-2h4v2H6zm0 8v-2h4v2H6zm12-12V4h-4v4h4zm-4 8h4v-4h-4v4z" /> 
                      </svg>
                      <div class="qr-text">
                          Tap <strong>Pay Now</strong> to generate <strong>UPI QR Code</strong> right here.
                      </div>
                  </div>

                  <div class="input-group">
                      <label class="label">Amount (INR)</label>
                      <div class="input-wrapper">
                          <input type="number" id="amount" placeholder="Enter Amount" value="1">
                      </div>
                  </div>
                  
                  <div class="input-group">
                      <label class="label">Phone Number</label>
                      <div class="input-wrapper">
                          <input type="tel" id="phone" placeholder="999XXXXXXX" maxlength="10">
                      </div>
                  </div>
                  
                  <button id="payBtn" onclick="initiatePayment()">
                      Pay Now
                  </button>
                  
                  <div class="footer">Secured by Cashfree Payments</div>
              </div>

              <div id="payment-container"></div>
          </div>

          <script>
              const cashfree = Cashfree({ mode: "production" });

              async function initiatePayment() {
                  const amount = document.getElementById('amount').value;
                  const phone = document.getElementById('phone').value;
                  const btn = document.getElementById('payBtn');
                  const formDiv = document.getElementById('userForm');
                  const paymentDiv = document.getElementById('payment-container');
                  
                  if(!amount || !phone || phone.length !== 10) {
                      alert("Please enter valid amount and 10-digit phone number");
                      return;
                  }

                  btn.disabled = true;
                  btn.innerHTML = '<span class="loader"></span> Generating QR...';

                  try {
                      // 1. Create Order on Backend
                      const res = await fetch("/create-order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if(!res.ok || !data.payment_session_id) {
                          throw new Error(data.message || data.error || "Order creation failed");
                      }

                      // 2. Hide Input Form, Show Payment Container
                      formDiv.style.display = 'none';
                      paymentDiv.style.display = 'block';

                      // 3. Mount Cashfree Component (This keeps user on your URL)
                      const components = cashfree.create("components", {
                          paymentSessionId: data.payment_session_id,
                          returnUrl: window.location.origin + "/?order_id={order_id}",
                          styles: {
                              theme: "light", // or 'dark'
                              fontFamily: "Poppins, sans-serif"
                          }
                      });

                      // Render the payment UI inside our div
                      components.mount("#payment-container");

                  } catch (err) {
                      console.error(err);
                      alert("Payment Error: " + err.message);
                      btn.disabled = false;
                      btn.innerHTML = 'Pay Now';
                      
                      // Restore Form if error
                      formDiv.style.display = 'block';
                      paymentDiv.style.display = 'none';
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 3. API: CREATE ORDER (Backend)
    // ------------------------------------------------------------------
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;

        if (!APP_ID || !SECRET_KEY) {
            throw new Error("API Keys are missing in Environment Variables");
        }

        const uniqueId = Date.now().toString();
        
        const payload = {
            order_id: "ORD_" + uniqueId,
            order_amount: parseFloat(body.amount),
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + uniqueId,
                customer_phone: body.phone,
                customer_email: "raj.bazaarika@example.com"
            },
            order_meta: {
                // Return URL is still needed for final success redirection handling
                return_url: `https://${url.hostname}/?order_id={order_id}`,
                payment_methods: "upi" 
            }
        };

        const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(payload)
        });

        const data = await cfRes.json();
        
        if (!cfRes.ok) {
            return new Response(JSON.stringify({ error: data.message }), { status: 400 });
        }

        return new Response(JSON.stringify(data), { 
            headers: { "Content-Type": "application/json" } 
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
