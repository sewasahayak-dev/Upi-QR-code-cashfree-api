export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
          <title>Sewa Sahayak</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              /* --- RESET & BASE --- */
              * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
              body, html { 
                  margin: 0; padding: 0; 
                  height: 100%; width: 100%;
                  font-family: 'Inter', sans-serif; 
                  background: #f8f9fa;
                  overflow: hidden; /* Prevent body scroll */
              }

              /* --- APP CONTAINER (Holds Input UI) --- */
              #app-container {
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  width: 100%;
                  transition: opacity 0.3s ease;
              }

              /* --- HEADER --- */
              .app-header {
                  padding: 16px 20px;
                  padding-top: max(16px, env(safe-area-inset-top));
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0; /* Header shrink nahi hoga */
              }
              .brand { font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
              .secure-badge { 
                  background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 6px; 
                  font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; 
              }

              /* --- CONTENT AREA --- */
              .content {
                  flex: 1;
                  padding: 24px;
                  overflow-y: auto;
                  display: flex;
                  flex-direction: column;
              }

              .input-group { margin-bottom: 24px; }
              .label { font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
              
              .input-wrapper {
                  background: #ffffff;
                  border: 1.5px solid #e2e8f0;
                  border-radius: 16px;
                  padding: 16px;
                  display: flex; align-items: center;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              .input-wrapper:focus-within { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
              .icon { width: 24px; height: 24px; margin-right: 12px; fill: #94a3b8; }
              .input-wrapper:focus-within .icon { fill: #6366f1; }
              
              input { border: none; background: transparent; width: 100%; font-size: 18px; font-weight: 600; color: #0f172a; outline: none; }
              input::placeholder { color: #cbd5e1; }

              /* --- BOTTOM BUTTON AREA --- */
              .footer {
                  padding: 20px 24px;
                  padding-bottom: max(20px, env(safe-area-inset-bottom));
                  background: #ffffff;
                  border-top: 1px solid #f1f5f9;
                  flex-shrink: 0;
              }

              button {
                  width: 100%;
                  padding: 16px;
                  background: #6366f1;
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 16px;
                  font-weight: 700;
                  cursor: pointer;
                  display: flex; justify-content: center; align-items: center; gap: 8px;
                  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #cbd5e1; box-shadow: none; }

              /* --- PAYMENT OVERLAY (FORCE FULL SCREEN) --- */
              #payment-overlay {
                  position: fixed; 
                  top: 0; 
                  left: 0; 
                  width: 100%; 
                  height: 100%;
                  background: #ffffff; 
                  z-index: 99999; 
                  display: none;
              }
              
              /* FORCE IFRAME TO FILL SCREEN */
              #payment-overlay iframe {
                  width: 100% !important;
                  height: 100% !important;
                  border: none !important;
                  display: block !important;
              }
          </style>
      </head>
      <body>

          <div id="app-container">
              <div class="app-header">
                  <div class="brand">Sewa Sahayak</div>
                  <div class="secure-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11h.6c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H8.6c-.66 0-1.2-.54-1.2-1.2v-5.6c0-.66.54-1.2 1.2-1.2h.6V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.83 0-1.5.67-1.5 1.5V11h3V9.5c0-.83-.67-1.5-1.5-1.5z"/></svg>
                      SECURE
                  </div>
              </div>

              <div class="content">
                  <div class="input-group">
                      <div class="label">Payment Amount</div>
                      <div class="input-wrapper">
                          <svg class="icon" viewBox="0 0 24 24"><path d="M17 6V4H6v2h3.5c1.302 0 2.401.838 2.815 2H6v2h6.315A2.995 2.995 0 0 1 9.5 12H6v2.414L11.586 20h2.828l-6-6H9.5a5.007 5.007 0 0 0 4.898-4H17V8h-2.602a4.933 4.933 0 0 0-.924-2H17z"/></svg>
                          <input type="number" id="amount" placeholder="0" value="1" inputmode="decimal" />
                      </div>
                  </div>

                  <div class="input-group">
                      <div class="label">Mobile Number</div>
                      <div class="input-wrapper">
                          <svg class="icon" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                      <input type="tel" id="phone" placeholder="9999999999" value="9999999999" maxlength="10" inputmode="numeric" />
                  </div>
              </div>

              <div class="footer">
                  <button onclick="startNativePayment()" id="pay-btn">
                      Proceed to Pay
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
              </div>
          </div>

          <div id="payment-overlay"></div>

          <script>
              let cashfree;
              try { cashfree = Cashfree({ mode: "production" }); } catch(e) { console.error(e); }

              async function startNativePayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const appContainer = document.getElementById("app-container");
                  const overlay = document.getElementById("payment-overlay");

                  if(!amount || !phone) return alert("Please fill details");

                  btn.innerHTML = 'Processing...';
                  btn.disabled = true;

                  try {
                      // 1. Create Order
                      const res = await fetch("/create-order", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      const data = await res.json();
                      if (!data.payment_session_id) throw new Error(data.message || "Order Failed");

                      // 2. Hide Input UI Completely
                      appContainer.style.display = 'none';
                      
                      // 3. Show Overlay
                      overlay.style.display = 'block';

                      // 4. Start Cashfree Checkout
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: overlay,
                          appearance: { theme: "light" }
                      });

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerHTML = 'Proceed to Pay';
                      btn.disabled = false;
                      
                      // Show UI Back if Error
                      appContainer.style.display = 'flex';
                      overlay.style.display = 'none';
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    // Backend Logic (No Changes Needed)
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const orderId = "ORD_" + Date.now();
        
        const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify({
                order_id: orderId,
                order_amount: parseFloat(body.amount),
                order_currency: "INR",
                customer_details: { customer_id: "cust_" + Date.now(), customer_phone: body.phone }
            })
        });
        const data = await cfResponse.json();
        return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
