export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: PRO GUI PAGE =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Sewa Sahayak Payment</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <style>
              /* --- PRO CSS STYLES --- */
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                  background: #f5f7fa; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  margin: 0; 
                  padding: 10px;
                  box-sizing: border-box;
              }
              
              .card { 
                  background: white; 
                  border-radius: 20px; 
                  box-shadow: 0 10px 40px rgba(0,0,0,0.08); 
                  width: 100%; 
                  max-width: 450px; 
                  overflow: hidden; 
                  transition: all 0.3s ease;
                  position: relative;
              }

              .header { 
                  background: linear-gradient(135deg, #6c5ce7, #a29bfe); 
                  color: white; 
                  padding: 25px 20px; 
                  text-align: center; 
                  border-radius: 0 0 20px 20px;
              }
              .header h2 { margin: 0; font-size: 22px; font-weight: 700; }
              .header small { font-size: 13px; opacity: 0.9; }

              .form-box { padding: 25px; }
              
              .input-group { margin-bottom: 15px; text-align: left; }
              .input-label { font-size: 12px; font-weight: bold; color: #666; margin-bottom: 5px; display: block; margin-left: 5px; }
              
              input { 
                  width: 100%; 
                  padding: 16px; 
                  border: 1px solid #eee; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  box-sizing: border-box; 
                  background: #f9f9f9; 
                  outline: none; 
                  transition: 0.2s;
              }
              input:focus { border-color: #6c5ce7; background: #fff; box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1); }

              button { 
                  width: 100%; 
                  padding: 18px; 
                  background: #6c5ce7; 
                  color: white; 
                  border: none; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  margin-top: 10px; 
                  cursor: pointer; 
                  font-weight: bold; 
                  box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
                  transition: transform 0.1s;
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #b2bec3; box-shadow: none; }

              /* Payment Frame (Hidden initially) */
              #payment-frame { 
                  width: 100%; 
                  height: 650px; /* Taller height for mobile */
                  border: none; 
                  display: none; 
              }

              /* Loader */
              .loader { border: 3px solid #f3f3f3; border-top: 3px solid #6c5ce7; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 10px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
      </head>
      <body>
          <div class="card" id="main-card">
              <div class="header" id="top-header">
                  <h2>Sewa Sahayak</h2>
                  <small>Secure Checkout</small>
              </div>
              
              <div class="form-box" id="input-section">
                  <div class="input-group">
                      <label class="input-label">AMOUNT (₹)</label>
                      <input type="number" id="amount" placeholder="Ex: 10" value="1" />
                  </div>
                  <div class="input-group">
                      <label class="input-label">PHONE NUMBER</label>
                      <input type="tel" id="phone" placeholder="Ex: 9999999999" value="9999999999" />
                  </div>
                  <button onclick="startPayment()" id="pay-btn">Proceed to Pay</button>
              </div>

              <div id="payment-frame"></div>
          </div>

          <script>
              let cashfree;
              try {
                  // Initialize Cashfree
                  cashfree = Cashfree({ mode: "production" });
              } catch(e) { console.error(e); }

              async function startPayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const frame = document.getElementById("payment-frame");
                  const inputSec = document.getElementById("input-section");
                  const header = document.getElementById("top-header");
                  const mainCard = document.getElementById("main-card");

                  if(!amount || !phone) return alert("Please fill amount and phone");

                  // UI Change: Loading State
                  btn.innerHTML = '<div class="loader"></div> Processing...';
                  btn.disabled = true;

                  try {
                      // 1. Create Order
                      const res = await fetch("/create-order", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      const data = await res.json();

                      if (!data.payment_session_id) throw new Error(data.message || "Order Failed");

                      // 2. UI Transformation for Payment
                      inputSec.style.display = "none";  // Hide Inputs
                      header.style.display = "none";    // Hide Header to give full space
                      frame.style.display = "block";    // Show Frame
                      
                      // Remove padding to let Cashfree take full width
                      mainCard.style.padding = "0";     
                      mainCard.style.maxWidth = "500px"; // Slightly wider for payment page
                      mainCard.style.borderRadius = "0"; // Square corners for mobile feel (optional)

                      // 3. Load Cashfree Checkout
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: document.getElementById("payment-frame"),
                          appearance: {
                              theme: "light",
                          }
                      });

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerText = "Proceed to Pay";
                      btn.disabled = false;
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ================= 2. BACKEND API (Standard Orders) =================
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        if(!APP_ID || !SECRET_KEY) return new Response(JSON.stringify({ message: "Keys Missing" }), { status: 500 });

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
