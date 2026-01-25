// =================CONFIGURATION=================
// AGAR TESTING KAR RAHE HO TO 'true' RAKHO
// AGAR LIVE CUSTOMERS KE LIYE HAI TO 'false' KAR DO
const IS_SANDBOX = true; 
// ===============================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Payment Status Page (Success/Failure dikhane ke liye)
    if (url.pathname === "/" && request.method === "GET") {
      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");
      
      // Agar URL mein order_id hai, to Status Page dikhao
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
          title = "Payment Processing";
          message = "We're verifying your payment. This may take a few moments.";
          iconColor = "#f59e0b";
          bgColor = "#fef3c7";
        }

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Status - Sewa Sahayak</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; background: #f8f9fa; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .status-container { background: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
                .status-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; background: ${bgColor}; }
                .status-icon svg { width: 40px; height: 40px; color: ${iconColor}; }
                h1 { color: ${iconColor}; margin-bottom: 10px; font-size: 24px; }
                p { color: #64748b; margin-bottom: 20px; line-height: 1.6; }
                .order-id { background: #f1f5f9; padding: 8px 12px; border-radius: 8px; font-family: monospace; font-size: 14px; margin: 15px 0; word-break: break-all; }
                .button-group { display: flex; gap: 10px; margin-top: 30px; }
                button { flex: 1; padding: 12px 20px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
                .btn-primary { background: #6366f1; color: white; }
                .btn-secondary { background: #f1f5f9; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="status-container">
                <div class="status-icon">
                    ${status === 'success' ? 
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>' :
                      status === 'failed' ?
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>' :
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
                    }
                </div>
                <h1>${title}</h1>
                <p>${message}</p>
                <div class="order-id">Order: ${orderId}</div>
                <div class="button-group">
                    <button class="btn-secondary" onclick="window.location.href='/'">New Payment</button>
                    <button class="btn-primary" onclick="window.close()">Close</button>
                </div>
            </div>
        </body>
        </html>
        `;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }

      // 2. Main Payment Page (Form)
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak - UPI QR Payment</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              /* CSS Styles preserved from your original code */
              * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; margin: 0; padding: 0; }
              html, body { height: 100%; width: 100%; }
              body { font-family: 'Inter', sans-serif; background: #f8f9fa; display: flex; flex-direction: column; min-height: 100vh; }
              .payment-container { flex: 1; display: flex; flex-direction: column; max-width: 500px; margin: 0 auto; width: 100%; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); margin-top: 20px; margin-bottom: 20px; }
              .app-header { padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
              .brand { font-size: 28px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }
              .subtitle { font-size: 16px; font-weight: 500; opacity: 0.9; margin-bottom: 15px; }
              .secure-badge { display: inline-flex; align-items: center; background: rgba(255,255,255,0.2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; backdrop-filter: blur(10px); }
              .content { flex: 1; padding: 30px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
              .input-group { margin-bottom: 24px; }
              .label { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
              .input-wrapper { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; align-items: center; transition: all 0.2s ease; }
              .input-wrapper:focus-within { border-color: #6366f1; background: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
              .icon { width: 22px; height: 22px; margin-right: 12px; fill: #94a3b8; flex-shrink: 0; }
              .input-wrapper:focus-within .icon { fill: #6366f1; }
              input { border: none; background: transparent; width: 100%; font-size: 18px; font-weight: 600; color: #0f172a; outline: none; }
              input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
              .amount-display { text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 16px; }
              .amount-value { font-size: 48px; font-weight: 700; color: #1e293b; }
              .amount-currency { color: #6366f1; font-size: 24px; margin-right: 5px; }
              .footer { padding: 20px 30px 30px; background: #ffffff; border-top: 1px solid #f1f5f9; }
              button { width: 100%; padding: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 17px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; transition: all 0.2s ease; }
              button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4); }
              button:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }
              .loading-spinner { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-right: 10px; }
              @keyframes spin { to { transform: rotate(360deg); } }
              .qr-feature { background: #f0f9ff; border: 2px solid #bae6fd; border-radius: 16px; padding: 20px; margin-top: 25px; text-align: center; }
              .qr-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; }
              .qr-icon svg { width: 30px; height: 30px; color: white; }
              .qr-title { font-size: 18px; font-weight: 700; color: #0c4a6e; margin-bottom: 8px; }
              .qr-desc { color: #0369a1; font-size: 14px; line-height: 1.5; }
              .error-message { background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; padding: 12px 16px; border-radius: 8px; margin-top: 20px; font-size: 14px; display: none; }
              @media (max-width: 480px) { .payment-container { margin: 0; border-radius: 0; min-height: 100vh; box-shadow: none; } }
          </style>
      </head>
      <body>
          <div class="payment-container">
              <div class="app-header">
                  <div class="brand">Sewa Sahayak</div>
                  <div class="subtitle">Fast & Secure UPI Payments</div>
                  <div class="secure-badge">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11h.6c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H8.6c-.66 0-1.2-.54-1.2-1.2v-5.6c0-.66.54-1.2 1.2-1.2h.6V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.83 0-1.5.67-1.5 1.5V11h3V9.5c0-.83-.67-1.5-1.5-1.5z"/>
                      </svg>
                      BANK LEVEL SECURITY
                  </div>
              </div>

              <div class="content">
                  <div class="amount-display">
                      <div class="amount-label">You Pay</div>
                      <div class="amount-value">
                          <span class="amount-currency">₹</span>
                          <span id="display-amount">1</span>
                      </div>
                  </div>

                  <div class="input-group">
                      <div class="label">
                          <span>Payment Amount</span>
                          <span style="font-weight: 400; font-size: 12px;">(Minimum ₹1)</span>
                      </div>
                      <div class="input-wrapper">
                          <svg class="icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          <input type="number" id="amount" placeholder="Enter amount" value="1" min="1" step="1" inputmode="decimal" oninput="updateDisplayAmount()" />
                      </div>
                  </div>

                  <div class="input-group">
                      <div class="label">Mobile Number</div>
                      <div class="input-wrapper">
                          <svg class="icon" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                          <input type="tel" id="phone" placeholder="Enter 10-digit number" value="" maxlength="10" inputmode="numeric" />
                      </div>
                  </div>
                  
                  <div class="qr-feature">
                      <div class="qr-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                          </svg>
                      </div>
                      <div class="qr-title">UPI QR Code Payment</div>
                      <div class="qr-desc">Scan the QR code with any UPI app like Google Pay, PhonePe, Paytm, BHIM, etc.</div>
                  </div>
                  
                  <div class="error-message" id="error-message"></div>
              </div>

              <div class="footer">
                  <button onclick="createOrder()" id="pay-btn">
                      Generate UPI QR Code
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <div style="text-align: center; margin-top: 15px;">
                      <span style="color: #94a3b8; font-size: 12px;">Powered by Cashfree Payments • 100% Secure</span>
                  </div>
              </div>
          </div>

          <script>
              function updateDisplayAmount() {
                  const amount = document.getElementById('amount').value;
                  document.getElementById('display-amount').textContent = amount || '0';
              }
              
              function showError(message) {
                  const errorDiv = document.getElementById('error-message');
                  errorDiv.textContent = message;
                  errorDiv.style.display = 'block';
                  setTimeout(() => {
                      errorDiv.style.display = 'none';
                  }, 5000);
              }
              
              updateDisplayAmount();
              
              async function createOrder() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  
                  document.getElementById('error-message').style.display = 'none';
                  
                  if(!amount || amount < 1) {
                      showError("Please enter a valid amount (minimum ₹1)");
                      return;
                  }
                  
                  if(!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
                      showError("Please enter a valid 10-digit mobile number");
                      return;
                  }

                  btn.innerHTML = '<span class="loading-spinner"></span> Creating Payment Link...';
                  btn.disabled = true;

                  try {
                      const response = await fetch("/create-order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount: parseFloat(amount), phone: phone })
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) throw new Error(data.message || "Failed to create order");
                      if (!data.payment_link) throw new Error("Payment link not generated");
                      
                      console.log("Redirecting to:", data.payment_link);
                      
                      // Use the full link provided by backend (corrects test vs live automatically)
                      window.location.href = data.payment_link;
                      
                  } catch (error) {
                      console.error("Error:", error);
                      btn.innerHTML = 'Generate UPI QR Code <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
                      btn.disabled = false;
                      showError(error.message || "Error processing payment");
                  }
              }
              
              document.getElementById('amount').addEventListener('input', function(e) {
                  let value = this.value.replace(/[^0-9]/g, '');
                  if(value < 1) value = 1;
                  this.value = value;
                  updateDisplayAmount();
              });
              
              document.getElementById('phone').addEventListener('input', function(e) {
                  this.value = this.value.replace(/[^0-9]/g, '').slice(0,10);
              });
          </script>
      </body>
      </html>
      `;
      return new Response(html, { 
          headers: { "content-type": "text/html; charset=utf-8" } 
      });
    }

    // 3. Create Order Endpoint
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        if (!APP_ID || !SECRET_KEY) {
          return new Response(JSON.stringify({ error: "Server error", message: "Missing credentials" }), { status: 500 });
        }
        
        // --- Environment Handling ---
        const API_URL = IS_SANDBOX 
            ? "https://sandbox.cashfree.com/pg/orders" 
            : "https://api.cashfree.com/pg/orders";
            
        const CHECKOUT_URL = IS_SANDBOX
            ? "https://payments-test.cashfree.com/order/#"
            : "https://payments.cashfree.com/order/#";
        // ----------------------------

        const amount = parseFloat(body.amount);
        const phone = body.phone?.toString().trim();
        
        // Generate IDs
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const orderId = `ORD_${timestamp}_${randomStr}`;
        const customerId = `CUST_${phone}_${randomStr}`;
        
        const orderPayload = {
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          order_note: "Sewa Sahayak Payment",
          customer_details: {
            customer_id: customerId,
            customer_phone: phone,
            customer_name: "Customer",
            customer_email: "pay@sewasahayak.com"
          },
          order_meta: {
            return_url: `https://${request.headers.get("host")}/?order_id=${orderId}&status=success`,
            notify_url: `https://${request.headers.get("host")}/webhook`
          }
        };
        
        // Call Cashfree API
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": APP_ID,
            "x-client-secret": SECRET_KEY,
            "x-api-version": "2023-08-01"
          },
          body: JSON.stringify(orderPayload)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error("Cashfree Error:", data);
          throw new Error(data.message || "Payment gateway error");
        }
        
        if (!data.payment_session_id) {
          throw new Error("Failed to generate payment session");
        }
        
        // Construct the correct payment link based on Environment
        const fullPaymentLink = `${CHECKOUT_URL}${data.payment_session_id}`;
        
        return new Response(JSON.stringify({
          success: true,
          payment_session_id: data.payment_session_id,
          payment_link: fullPaymentLink
        }), {
          headers: { "content-type": "application/json" }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Failed",
          message: error.message
        }), {
          status: 500,
          headers: { "content-type": "application/json" }
        });
      }
    }

    // Webhook (Optional)
    if (url.pathname === "/webhook" && request.method === "POST") {
        return new Response(JSON.stringify({ status: "received" }));
    }

    return new Response("Not Found", { status: 404 });
  }
};
