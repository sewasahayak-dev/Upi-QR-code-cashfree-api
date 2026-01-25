export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: FULL SCREEN UI =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Sewa Sahayak Pay</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <style>
              /* Base Styles */
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                  background: #f0f2f5; 
                  margin: 0; 
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
              }

              /* Input Card Design */
              .card { 
                  background: white; 
                  width: 90%; 
                  max-width: 400px; 
                  padding: 25px; 
                  border-radius: 20px; 
                  box-shadow: 0 4px 25px rgba(0,0,0,0.1); 
                  text-align: center;
                  transition: opacity 0.3s ease;
              }

              h2 { margin: 0 0 5px 0; color: #333; }
              p { color: #666; margin: 0 0 25px 0; font-size: 14px; }

              /* Inputs */
              .input-group { margin-bottom: 15px; text-align: left; }
              label { display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px; margin-left: 5px; }
              
              input { 
                  width: 100%; 
                  padding: 16px; 
                  border: 1px solid #ddd; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  box-sizing: border-box; 
                  background: #fafafa;
                  outline: none;
              }
              input:focus { border-color: #6c5ce7; background: #fff; }

              /* Button */
              button { 
                  width: 100%; 
                  padding: 18px; 
                  background: #6c5ce7; 
                  color: white; 
                  border: none; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  font-weight: bold; 
                  cursor: pointer; 
                  margin-top: 10px;
                  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #b2bec3; }

              /* --- KEY CHANGE: FULL SCREEN PAYMENT CONTAINER --- */
              #payment-screen {
                  position: fixed; /* Screen ke upar chipak jayega */
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: white;
                  z-index: 9999; /* Sabse upar */
                  display: none; /* Pehle chhupa rahega */
                  overflow-y: auto; /* Scroll karne dega agar zaroorat ho */
              }
          </style>
      </head>
      <body>

          <div class="card" id="form-card">
              <h2>Sewa Sahayak</h2>
              <p>Secure Payment Gateway</p>
              
              <div class="input-group">
                  <label>AMOUNT (₹)</label>
                  <input type="number" id="amount" placeholder="Ex: 10" value="1" />
              </div>
              <div class="input-group">
                  <label>PHONE NUMBER</label>
                  <input type="tel" id="phone" placeholder="Ex: 9999999999" value="9999999999" />
              </div>
              
              <button onclick="startPayment()" id="pay-btn">Pay Now</button>
          </div>

          <div id="payment-screen"></div>

          <script>
              let cashfree;
              try {
                  cashfree = Cashfree({ mode: "production" });
              } catch(e) { console.error(e); }

              async function startPayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const formCard = document.getElementById("form-card");
                  const payScreen = document.getElementById("payment-screen");

                  if(!amount || !phone) return alert("Please fill details");

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

                      // 2. UI Switch: Hide Card, Show Full Screen Overlay
                      formCard.style.display = "none"; 
                      payScreen.style.display = "block"; // Ab ye puri screen le lega

                      // 3. Load Cashfree in Full Screen Div
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: payScreen, // Target full screen div
                          appearance: {
                              theme: "light",
                          }
                      });

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerText = "Pay Now";
                      btn.disabled = false;
                      formCard.style.display = "block";
                      payScreen.style.display = "none";
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
