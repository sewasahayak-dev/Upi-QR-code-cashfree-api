export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ------------------------------------------------------------------
    // 1. FRONTEND: PAYMENT PAGE (UI)
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Sewa Sahayak Payment</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
              body { background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
              
              .container {
                  background: #ffffff;
                  width: 100%;
                  max-width: 400px;
                  border-radius: 24px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                  overflow: hidden;
                  text-align: center;
              }
              
              .header { background: #4f46e5; padding: 24px; color: white; }
              .header h2 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
              .header p { font-size: 13px; opacity: 0.9; }
              
              .body { padding: 30px 24px; }
              
              /* Input Styles */
              .input-group { text-align: left; margin-bottom: 20px; }
              .label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
              input {
                  width: 100%; padding: 14px; border: 2px solid #e5e7eb; border-radius: 12px;
                  font-size: 16px; outline: none; transition: border 0.3s;
              }
              input:focus { border-color: #4f46e5; }
              
              button {
                  width: 100%; padding: 16px; background: #4f46e5; color: white; border: none;
                  border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;
                  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                  transition: all 0.2s;
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }

              /* QR Section (Hidden by default) */
              #qr-section { display: none; }
              
              /* Container for the Generated QR */
              #qrcode {
                  width: 200px;
                  height: 200px;
                  margin: 0 auto 15px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              #qrcode img {
                  border: 1px solid #eee;
                  padding: 10px;
                  border-radius: 10px;
                  width: 100%;
              }

              .upi-id-box {
                  background: #eff6ff;
                  border: 1px dashed #3b82f6;
                  padding: 10px;
                  border-radius: 8px;
                  margin-bottom: 15px;
                  word-break: break-all;
              }
              .upi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
              .upi-value { font-size: 14px; color: #1e40af; font-weight: 700; margin-top: 2px; }

              .timer { font-size: 12px; color: #6b7280; margin-top: 10px; }
              
              .loader { width: 18px; height: 18px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; vertical-align: middle; margin-right: 8px; }
              @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

              /* Success Screen */
              #success-section { display: none; }
              .success-icon { width: 60px; height: 60px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 30px; }
          </style>
      </head>
      <body>

          <div class="container">
              <div class="header">
                  <h2>Sewa Sahayak</h2>
                  <p>Secure UPI Payment</p>
              </div>

              <div class="body" id="form-section">
                  <div class="input-group">
                      <label class="label">Amount (₹)</label>
                      <input type="number" id="amount" placeholder="100" value="1">
                  </div>
                  <div class="input-group">
                      <label class="label">Phone Number</label>
                      <input type="tel" id="phone" placeholder="9999999999" maxlength="10">
                  </div>
                  <button id="payBtn" onclick="generateQR()">Get UPI ID & QR</button>
              </div>

              <div class="body" id="qr-section">
                  <p style="margin-bottom: 15px; font-weight: 600; color: #374151;">Scan or Pay to UPI ID</p>
                  
                  <div class="upi-id-box">
                      <div class="upi-label">Pay to VPA</div>
                      <div class="upi-value" id="display-vpa">Loading...</div>
                  </div>

                  <div id="qrcode"></div>
                  
                  <p style="font-size: 13px; color: #4f46e5; font-weight: 500;">Waiting for payment...</p>
                  <button onclick="location.reload()" style="margin-top: 20px; background: #f3f4f6; color: #374151; box-shadow: none;">Cancel</button>
              </div>

              <div class="body" id="success-section">
                  <div class="success-icon">✓</div>
                  <h3 style="color: #15803d; margin-bottom: 10px;">Payment Successful!</h3>
                  <p style="font-size: 13px; color: #6b7280;">Thank you for your payment.</p>
                  <button onclick="location.reload()" style="margin-top: 20px; background: #22c55e;">Make Another Payment</button>
              </div>
          </div>

          <script>
              let pollingInterval;

              async function generateQR() {
                  const amount = document.getElementById('amount').value;
                  const phone = document.getElementById('phone').value;
                  const btn = document.getElementById('payBtn');

                  if(!amount || phone.length !== 10) { alert("Please enter valid amount and 10-digit phone number"); return; }

                  // Loading UI
                  btn.disabled = true;
                  btn.innerHTML = '<span class="loader"></span> Fetching details...';

                  try {
                      // 1. Get Payment Link from Backend
                      const res = await fetch("/create-qr", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if(!res.ok) {
                          // Show DETAILED error from Backend
                          throw new Error(data.error || JSON.stringify(data));
                      }
                      
                      if(!data.upi_link) {
                           throw new Error("No UPI Link received. Response: " + JSON.stringify(data));
                      }

                      // 2. Switch to QR View
                      document.getElementById('form-section').style.display = 'none';
                      document.getElementById('qr-section').style.display = 'block';

                      // 3. SHOW UPI ID (VPA)
                      if(data.vpa) {
                          document.getElementById('display-vpa').innerText = data.vpa;
                      } else {
                          document.getElementById('display-vpa').innerText = "Scan QR below";
                      }

                      // 4. GENERATE QR CODE LOCALLY
                      document.getElementById("qrcode").innerHTML = "";
                      new QRCode(document.getElementById("qrcode"), {
                          text: data.upi_link,
                          width: 200,
                          height: 200,
                          colorDark : "#000000",
                          colorLight : "#ffffff",
                          correctLevel : QRCode.CorrectLevel.M
                      });

                      // 5. Start Polling for Status
                      startPolling(data.order_id);

                  } catch (e) {
                      // ALERT THE FULL ERROR SO WE KNOW WHAT HAPPENED
                      alert("Payment Failed: " + e.message);
                      btn.disabled = false;
                      btn.innerHTML = 'Get UPI ID & QR';
                  }
              }

              function startPolling(orderId) {
                  pollingInterval = setInterval(async () => {
                      try {
                          const res = await fetch("/check-status?order_id=" + orderId);
                          const data = await res.json();
                          
                          if(data.status === "PAID") {
                              clearInterval(pollingInterval);
                              showSuccess();
                          }
                      } catch(e) { console.error("Polling error", e); }
                  }, 3000); // Check every 3 seconds
              }

              function showSuccess() {
                  document.getElementById('qr-section').style.display = 'none';
                  document.getElementById('success-section').style.display = 'block';
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 2. API: CREATE ORDER & EXTRACT UPI DATA
    // ------------------------------------------------------------------
    if (url.pathname === "/create-qr" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const BASE_URL = "https://api.cashfree.com/pg"; 

        if (!APP_ID || !SECRET_KEY) {
            throw new Error("Missing API Keys in Environment Variables");
        }

        // A. Create Order
        const orderId = "ORD_" + Date.now();
        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(body.amount),
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + Date.now(),
                customer_phone: body.phone,
                customer_email: "raj.bazaarika@example.com"
            }
        };

        const createRes = await fetch(BASE_URL + "/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(orderPayload)
        });

        const orderData = await createRes.json();
        if (!createRes.ok) {
            return new Response(JSON.stringify({ error: orderData.message || "Order Creation Failed", full_error: orderData }), { status: 400 });
        }

        const sessionId = orderData.payment_session_id;

        // B. Request Payment Link (Intent Mode)
        const payPayload = {
            payment_session_id: sessionId,
            payment_method: {
                upi: { channel: "link" } 
            }
        };

        const payRes = await fetch(BASE_URL + "/orders/sessions/" + sessionId + "/pay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(payPayload)
        });

        const payData = await payRes.json();
        
        // C. Extract Data Safely
        let upiLink = null;
        let vpa = null;

        // Check if payload exists
        if(payData.data && payData.data.payload) {
            // Try generic default
            if(payData.data.payload.default) {
                upiLink = payData.data.payload.default;
            } 
            // Sometimes it returns specific apps, pick any valid one if default is missing
            else if(Object.values(payData.data.payload).length > 0) {
                 upiLink = Object.values(payData.data.payload)[0];
            }
        }

        if(!upiLink) {
             // Return FULL debug info to Frontend so we see what happened
             return new Response(JSON.stringify({ 
                 error: "UPI Link Not Found in Response", 
                 debug_response: payData 
             }), { status: 400 });
        }

        // D. Extract VPA (UPI ID) from the Link
        // Link looks like: upi://pay?pa=merchant@bank&pn=MerchantName...
        try {
            const match = upiLink.match(/[?&]pa=([^&]+)/);
            if(match && match[1]) {
                vpa = decodeURIComponent(match[1]);
            }
        } catch(e) { console.error("Regex error", e); }

        return new Response(JSON.stringify({ 
            order_id: orderId,
            upi_link: upiLink,
            vpa: vpa // Sending the extracted UPI ID to frontend
        }), { headers: { "Content-Type": "application/json" } });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ------------------------------------------------------------------
    // 3. API: CHECK STATUS (Polling)
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
                status: data.order_status 
            }), { headers: { "Content-Type": "application/json" } });

        } catch(e) {
            return new Response(JSON.stringify({ error: "Check failed" }), { status: 500 });
        }
    }

    return new Response("Not Found", { status: 404 });
  }
};
