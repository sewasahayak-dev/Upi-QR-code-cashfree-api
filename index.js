export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: PREMIUM NATIVE APP UI =================
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
              body { 
                  font-family: 'Inter', sans-serif; 
                  background: #f8f9fa; 
                  margin: 0; 
                  padding: 0;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
              }

              /* --- HEADER --- */
              .app-header {
                  padding: 20px 24px;
                  padding-top: max(20px, env(safe-area-inset-top));
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  box-shadow: 0 1px 0 rgba(0,0,0,0.05);
                  z-index: 10;
              }
              .brand { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
              .secure-badge { 
                  background: #ecfdf5; 
                  color: #059669; 
                  padding: 6px 10px; 
                  border-radius: 8px; 
                  font-size: 11px; 
                  font-weight: 700; 
                  display: flex; 
                  align-items: center; 
                  gap: 4px;
              }

              /* --- CONTENT --- */
              .content {
                  flex: 1;
                  padding: 24px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
              }

              .input-group { margin-bottom: 24px; }
              .label { 
                  font-size: 12px; 
                  color: #64748b; 
                  font-weight: 600; 
                  margin-bottom: 8px; 
                  text-transform: uppercase; 
                  letter-spacing: 0.5px; 
              }
              
              .input-wrapper {
                  background: #ffffff;
                  border: 1.5px solid #e2e8f0;
                  border-radius: 16px;
                  padding: 16px;
                  display: flex;
                  align-items: center;
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              .input-wrapper:focus-within { 
                  border-color: #6366f1; 
                  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); 
                  transform: translateY(-1px);
              }

              /* SVG ICONS (Fixes Encoding Issue) */
              .icon { width: 24px; height: 24px; margin-right: 12px; fill: #94a3b8; }
              .input-wrapper:focus-within .icon { fill: #6366f1; }

              input { 
                  border: none; 
                  background: transparent; 
                  width: 100%; 
                  font-size: 18px; 
                  font-weight: 600; 
                  color: #0f172a; 
                  outline: none;
                  font-family: 'Inter', sans-serif;
              }
              input::placeholder { color: #cbd5e1; font-weight: 500; }

              /* --- BOTTOM BUTTON --- */
              .footer {
                  padding: 24px;
                  padding-bottom: max(24px, env(safe-area-inset-bottom));
                  background: #ffffff;
                  border-top: 1px solid #f1f5f9;
              }

              button {
                  width: 100%;
                  padding: 18px;
                  background: #6366f1; /* Indigo Color */
                  color: white;
                  border: none;
                  border-radius: 14px;
                  font-size: 16px;
                  font-weight: 700;
                  cursor: pointer;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 8px;
                  transition: 0.2s;
                  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

              /* --- FULL SCREEN PAYMENT OVERLAY --- */
              #payment-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  background: #ffffff;
                  z-index: 99999;
                  display: none;
              }
          </style>
      </head>
      <body>

          <div class="app-header" id="header">
              <div class="brand">Sewa Sahayak</div>
              <div class="secure-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11h.6c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H8.6c-.66 0-1.2-.54-1.2-1.2v-5.6c0-.66.54-1.2 1.2-1.2h.6V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.83 0-1.5.67-1.5 1.5V11h3V9.5c0-.83-.67-1.5-1.5-1.5z"/></svg>
                  SECURE
              </div>
          </div>

          <div class="content" id="main-content">
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
          </div>

          <div class="footer" id="footer">
              <button onclick="startNativePayment()" id="pay-btn">
                  Proceed to Pay
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
          </div>

          <div id="payment-overlay"></div>

          <script>
              let cashfree;
              try {
                  cashfree = Cashfree({ mode: "production" });
              } catch(e) { console.error(e); }

              async function startNativePayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const overlay = document.getElementById("payment-overlay");
                  
                  // Elements to hide
                  const uiElements = [document.getElementById("header"), document.getElementById("main-content"), document.getElementById("footer")];

                  if(!amount || !phone) return alert("Please enter valid details");

                  btn.innerHTML = 'Processing...';
                  btn.disabled = true;

                  try {
                      // 1. Backend Call
                      const res = await fetch("/create-order", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      const data = await res.json();

                      if (!data.payment_session_id) throw new Error(data.message || "Order Failed");

                      // 2. Hide UI & Show Full Screen Overlay
                      uiElements.forEach(el => el.style.display = 'none');
                      overlay.style.display = 'block';

                      // 3. Launch Cashfree
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: overlay,
                          appearance: {
                              theme: "light",
                          }
                      });

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerHTML = 'Proceed to Pay';
                      btn.disabled = false;
                      // Restore UI
                      uiElements.forEach(el => el.style.display = 'flex');
                      overlay.style.display = 'none';
                  }
              }
          </script>
      </body>
      </html>
      `;
      // Fix Encoding Issue Here: charset=utf-8 added
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    }

    // ================= 2. BACKEND API =================
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const API_VERSION = "2023-08-01";
        
        const orderId = "ORD_" + Date.now();
        
        const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": API_VERSION
            },
            body: JSON.stringify({
                order_id: orderId,
                order_amount: parseFloat(body.amount),
                order_currency: "INR",
                customer_details: {
                    customer_id: "cust_" + Date.now(),
                    customer_phone: body.phone
                }
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
