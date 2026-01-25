export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ------------------------------------------------------------------
    // 1. MAIN UI PAGE
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak - Scan & Pay</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              /* --- CSS STYLES --- */
              * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
              body { background: #f3f4f6; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
              
              .card { 
                  background: white; 
                  width: 100%; 
                  max-width: 400px; 
                  border-radius: 20px; 
                  box-shadow: 0 20px 40px rgba(0,0,0,0.05); 
                  padding: 30px; 
                  text-align: center;
                  transition: all 0.3s ease;
              }

              h2 { color: #111827; margin-bottom: 5px; font-size: 22px; }
              p.subtitle { color: #6b7280; font-size: 14px; margin-bottom: 25px; }

              /* Input Styles */
              .input-group { margin-bottom: 15px; text-align: left; }
              label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 5px; }
              input { width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px; outline: none; transition: 0.2s; }
              input:focus { border-color: #6366f1; }

              /* Button */
              button { 
                  width: 100%; background: #6366f1; color: white; border: none; padding: 14px; 
                  border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 10px; 
              }
              button:disabled { background: #cbd5e1; cursor: not-allowed; }

              /* QR Section */
              #qr-section { display: none; margin-top: 20px; }
              .qr-image { width: 220px; height: 220px; margin: 0 auto 15px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
              .timer { font-size: 13px; color: #ef4444; font-weight: 600; margin-top: 10px; }
              .loader { width: 24px; height: 24px; border: 3px solid #6366f1; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; }
              
              /* Success Section */
              #success-section { display: none; }
              .success-icon { width: 80px; height: 80px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 20px; }
              
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
      </head>
      <body>

          <div class="card" id="main-card">
              <div id="form-section">
                  <h2>Sewa Sahayak</h2>
                  <p class="subtitle">Enter details to generate QR</p>
                  
                  <div class="input-group">
                      <label>Amount (₹)</label>
                      <input type="number" id="amount" value="1" min="1">
                  </div>
                  <div class="input-group">
                      <label>Mobile Number</label>
                      <input type="tel" id="phone" placeholder="9999999999" maxlength="10">
                  </div>

                  <button id="pay-btn" onclick="generateQR()">Generate QR Code</button>
              </div>

              <div id="qr-section">
                  <h2>Scan to Pay</h2>
                  <p class="subtitle">Use any UPI App</p>
                  
                  <img id="qr-img" class="qr-image" src="" alt="QR Code">
                  
                  <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #6b7280; font-size: 14px;">
                      <span class="loader" style="width: 16px; height: 16px; border-width: 2px;"></span>
                      Waiting for payment...
                  </div>
              </div>

              <div id="success-section">
                  <div class="success-icon">✓</div>
                  <h2 style="color: #15803d;">Payment Successful!</h2>
                  <p class="subtitle" id="success-msg">Your transaction is complete.</p>
                  <button onclick="window.location.reload()" style="background: #22c55e;">Pay Again</button>
              </div>
          </div>

          <script>
              let checkInterval;
              let currentOrderId = null;

              async function generateQR() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");

                  if(!amount || !phone || phone.length !== 10) {
                      alert("Please enter valid amount and 10 digit number");
                      return;
                  }

                  btn.innerHTML = '<span class="loader" style="border-color: white;"></span> Processing...';
                  btn.disabled = true;

                  try {
                      // Call Backend to Create Order AND Get QR
                      const res = await fetch("/generate-qr", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if(!res.ok) throw new Error(data.error || "Failed");

                      // Show QR
                      document.getElementById("form-section").style.display = "none";
                      document.getElementById("qr-section").style.display = "block";
                      document.getElementById("qr-img").src = data.qr_image;
                      
                      currentOrderId = data.order_id;
                      
                      // Start polling for status
                      startStatusCheck();

                  } catch (e) {
                      console.error(e);
                      alert("Error: " + e.message);
                      btn.innerHTML = 'Generate QR Code';
                      btn.disabled = false;
                  }
              }

              function startStatusCheck() {
                  checkInterval = setInterval(async () => {
                      if(!currentOrderId) return;
                      
                      try {
                          const res = await fetch("/check-status?order_id=" + currentOrderId);
                          const data = await res.json();
                          
                          if(data.status === "PAID") {
                              clearInterval(checkInterval);
                              showSuccess(currentOrderId);
                          }
                      } catch(e) { console.log("Check failed", e); }
                  }, 3000); // Check every 3 seconds
              }

              function showSuccess(id) {
                  document.getElementById("qr-section").style.display = "none";
                  document.getElementById("success-section").style.display = "block";
                  document.getElementById("success-msg").innerText = "Order ID: " + id;
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 2. API: GENERATE QR (Create Order + Fetch QR)
    // ------------------------------------------------------------------
    if (url.pathname === "/generate-qr" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        if (!APP_ID || !SECRET_KEY) throw new Error("Missing API Keys");

        const orderId = "ORD_" + Date.now();
        
        // Step A: Create Order
        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(body.amount),
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + Date.now(),
                customer_phone: body.phone,
                customer_email: "raj.bazaarika@example.com"
            },
            order_meta: { return_url: "https://example.com" } // Not used but required
        };

        const createRes = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(orderPayload)
        });

        const createData = await createRes.json();
        if(!createRes.ok) throw new Error(createData.message);

        const paymentSessionId = createData.payment_session_id;

        // Step B: Get UPI QR Code using the Session ID
        const qrPayload = {
            payment_method: { upi: { channel: "qrcode" } },
            payment_session_id: paymentSessionId
        };

        const qrRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(qrPayload)
        });

        const qrData = await qrRes.json();
        
        // qrData.data.payload.qrcode contains the Base64 image string
        if(qrData.data && qrData.data.payload && qrData.data.payload.qrcode) {
             return new Response(JSON.stringify({
                order_id: orderId,
                qr_image: qrData.data.payload.qrcode
             }), { headers: { "Content-Type": "application/json" } });
        } else {
            throw new Error("Failed to generate QR");
        }

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ------------------------------------------------------------------
    // 3. API: CHECK STATUS
    // ------------------------------------------------------------------
    if (url.pathname === "/check-status" && request.method === "GET") {
        const orderId = url.searchParams.get("order_id");
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;

        try {
            const res = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
                headers: {
                    "x-client-id": APP_ID,
                    "x-client-secret": SECRET_KEY,
                    "x-api-version": "2023-08-01"
                }
            });
            const data = await res.json();
            
            return new Response(JSON.stringify({ 
                status: data.order_status // Returns "PAID", "ACTIVE", etc.
            }), { headers: { "Content-Type": "application/json" } });

        } catch(e) {
            return new Response(JSON.stringify({ status: "ERROR" }));
        }
    }

    return new Response("Not Found", { status: 404 });
  }
};
