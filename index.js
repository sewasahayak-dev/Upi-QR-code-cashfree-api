export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: NATIVE APP UI =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
          <title>Sewa Sahayak</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              /* --- NATIVE APP BASE --- */
              * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
              body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                  background: #ffffff; 
                  margin: 0; 
                  padding: 0;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                  overflow: hidden; /* Scroll band jab tak zaroorat na ho */
              }

              /* --- APP HEADER --- */
              .app-header {
                  padding: 20px 24px;
                  padding-top: max(20px, env(safe-area-inset-top)); /* Notch Support */
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
              }
              .brand { font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px; }
              .badge { background: #f0fdf4; color: #16a34a; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

              /* --- MAIN CONTENT AREA --- */
              .content {
                  flex: 1;
                  padding: 0 24px;
                  display: flex;
                  flex-direction: column;
                  justify-content: center; /* Center Inputs Vertical */
              }

              .label { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
              
              .input-wrap {
                  background: #f8fafc;
                  border: 2px solid #e2e8f0;
                  border-radius: 16px;
                  padding: 16px;
                  margin-bottom: 24px;
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
              }
              .input-wrap:focus-within { border-color: #6366f1; background: #fff; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1); }
              
              .currency { font-size: 20px; color: #94a3b8; font-weight: 600; margin-right: 10px; }
              
              input { 
                  border: none; 
                  background: transparent; 
                  width: 100%; 
                  font-size: 20px; 
                  font-weight: 600; 
                  color: #0f172a; 
                  outline: none;
                  font-family: 'Inter', sans-serif;
              }
              input::placeholder { color: #cbd5e1; }

              /* --- BOTTOM ACTION BAR --- */
              .action-bar {
                  padding: 24px;
                  padding-bottom: max(24px, env(safe-area-inset-bottom));
                  background: #ffffff;
                  border-top: 1px solid #f1f5f9;
              }

              button {
                  width: 100%;
                  padding: 18px;
                  background: #6366f1;
                  color: white;
                  border: none;
                  border-radius: 16px;
                  font-size: 17px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: transform 0.1s;
                  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.25);
              }
              button:active { transform: scale(0.97); }
              button:disabled { background: #cbd5e1; box-shadow: none; color: #94a3b8; }

              /* --- FULL SCREEN OVERLAY (CASHFREE) --- */
              #payment-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  background: #ffffff;
                  z-index: 99999;
                  display: none; /* Hidden Default */
                  animation: slideUp 0.3s ease-out;
              }
              
              @keyframes slideUp {
                  from { transform: translateY(100%); }
                  to { transform: translateY(0); }
              }
          </style>
      </head>
      <body>

          <div class="app-header" id="header">
              <div class="brand">Sewa Sahayak</div>
              <div class="badge">SECURE</div>
          </div>

          <div class="content" id="main-content">
              <div>
                  <div class="label">Payment Amount</div>
                  <div class="input-wrap">
                      <span class="currency">₹</span>
                      <input type="number" id="amount" placeholder="0" value="1" inputmode="numeric" />
                  </div>

                  <div class="label">Mobile Number</div>
                  <div class="input-wrap">
                      <span class="currency">📱</span>
                      <input type="tel" id="phone" placeholder="9999999999" value="9999999999" maxlength="10" />
                  </div>
              </div>
          </div>

          <div class="action-bar" id="footer">
              <button onclick="startNativePayment()" id="pay-btn">Pay Securely</button>
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
                  
                  // Hide UI elements smoothly
                  const uiElements = [document.getElementById("header"), document.getElementById("main-content"), document.getElementById("footer")];

                  if(!amount || !phone) return alert("Please fill amount and phone");

                  btn.innerText = "Processing...";
                  btn.disabled = true;

                  try {
                      // 1. Create Order
                      const res = await fetch("/create-order", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      const data = await res.json();

                      if (!data.payment_session_id) throw new Error(data.message || "Order Failed");

                      // 2. Switch to Full Screen Mode
                      uiElements.forEach(el => el.style.display = 'none'); // Purana UI chhupao
                      overlay.style.display = 'block'; // Payment UI dikhao

                      // 3. Load Cashfree Natively
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: overlay, // Target full screen div
                          appearance: {
                              theme: "light",
                          }
                      });

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerText = "Pay Securely";
                      btn.disabled = false;
                      // Restore UI if error
                      uiElements.forEach(el => el.style.display = 'flex');
                      overlay.style.display = 'none';
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
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
