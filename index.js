export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ------------------------------------------------------------------
    // 1. PAYMENT RETURN/SUCCESS PAGE
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET" && url.searchParams.get("order_id")) {
      const orderId = url.searchParams.get("order_id");
      // Yahan hum status verify bhi kar sakte hain, par abhi simple rakhte hain
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
    // 2. MAIN PAYMENT PAGE (UI)
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
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
              body { background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
              
              .container {
                  background: #ffffff;
                  width: 100%;
                  max-width: 420px;
                  border-radius: 24px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
                  overflow: hidden;
                  position: relative;
                  transition: height 0.3s ease;
              }
              
              .header { background: #4f46e5; padding: 30px 24px; text-align: center; color: white; }
              .header h2 { font-size: 22px; font-weight: 700; margin-bottom: 5px; }
              .header p { font-size: 14px; opacity: 0.9; }
              
              .form-body { padding: 30px 24px; }
              
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
              
              input { width: 100%; padding: 16px; border: none; background: transparent; font-size: 16px; font-weight: 500; color: #1f2937; outline: none; }
              
              /* QR Section */
              #qr-section { display: none; text-align: center; }
              .qr-image { width: 250px; height: 250px; margin: 0 auto 20px; border: 2px dashed #4f46e5; border-radius: 12px; padding: 10px; }
              .qr-image img { width: 100%; height: 100%; object-fit: contain; }
              .timer { color: #ef4444; font-weight: 600; margin-top: 10px; font-size: 14px; }
              .status-text { margin-top: 15px; color: #4f46e5; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
              
              button {
                  width: 100%; padding: 18px; background: #4f46e5; color: white; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.1s; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
              }
              button:active { transform: scale(0.98); }
              button:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
              
              .loader { width: 20px; height: 20px; border: 3px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; margin-right: 10px; vertical-align: middle; }
              .loader-blue { border-color: #4f46e5; border-bottom-color: transparent; }
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
              
              <div class="form-body">
                  <div id="payment-form">
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
                      <button id="payBtn" onclick="generateQR()">Pay Now</button>
                  </div>

                  <div id="qr-section">
                      <p style="color:#374151; font-weight:600; margin-bottom:15px;">Scan to Pay</p>
                      <div class="qr-image" id="qr-container">
                          </div>
                      <div class="status-text">
                          <span class="loader loader-blue"></span> Waiting for payment...
                      </div>
                      <div class="footer">Please do not press back or close</div>
                  </div>
                  
                  <div class="footer">Secured by Cashfree Payments</div>
              </div>
          </div>

          <script>
              let pollingInterval;
              let currentOrderId;

              async function generateQR() {
                  const amount = document.getElementById('amount').value;
                  const phone = document.getElementById('phone').value;
                  const btn = document.getElementById('payBtn');
                  
                  if(!amount || !phone || phone.length !== 10) {
                      alert("Please enter valid amount and 10-digit phone number");
                      return;
                  }

                  btn.disabled = true;
                  btn.innerHTML = '<span class="loader"></span> Generating QR...';

                  try {
                      // 1. Create Order and Get QR
                      const res = await fetch("/create-order", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await res.json();
                      
                      if(!res.ok || !data.qr_string) {
                          throw new Error(data.message || "Failed to generate QR");
                      }

                      // 2. Show QR Code
                      currentOrderId = data.order_id;
                      document.getElementById('payment-form').style.display = 'none';
                      document.getElementById('qr-section').style.display = 'block';
                      
                      // Render Base64 QR
                      const qrImg = document.createElement('img');
                      qrImg.src = data.qr_string;
                      document.getElementById('qr-container').appendChild(qrImg);

                      // 3. Start Polling for Status
                      startPolling(currentOrderId);

                  } catch (err) {
                      console.error(err);
                      alert("Error: " + err.message);
                      btn.disabled = false;
                      btn.innerHTML = 'Pay Now';
                  }
              }

              function startPolling(orderId) {
                  pollingInterval = setInterval(async () => {
                      try {
                          const res = await fetch("/check-status", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ order_id: orderId })
                          });
                          const data = await res.json();

                          if (data.status === "PAID") {
                              clearInterval(pollingInterval);
                              window.location.href = "/?order_id=" + orderId;
                          }
                      } catch (e) {
                          console.log("Polling error", e);
                      }
                  }, 3000); // Check every 3 seconds
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 3. API: CREATE ORDER & GENERATE QR (Backend)
    // ------------------------------------------------------------------
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;

        if (!APP_ID || !SECRET_KEY) throw new Error("API Keys missing");

        const uniqueId = Date.now().toString();
        const orderId = "ORD_" + uniqueId;
        
        // A. Create Order
        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(body.amount),
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + uniqueId,
                customer_phone: body.phone,
                customer_email: "customer@example.com"
            },
            order_meta: { return_url: `https://${url.hostname}/?order_id={order_id}` }
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
        if (!createRes.ok) throw new Error(createData.message || "Order Creation Failed");

        // B. Generate UPI QR Immediately
        const payPayload = { payment_method: { upi: { channel: "qrcode" } } };
        
        const qrRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(payPayload)
        });

        const qrData = await qrRes.json();
        
        // Data usually comes as data.payload.qrcode (Base64)
        if (!qrData.data || !qrData.data.payload || !qrData.data.payload.qrcode) {
             throw new Error("QR Generation Failed");
        }

        return new Response(JSON.stringify({ 
            order_id: orderId,
            payment_session_id: createData.payment_session_id,
            qr_string: qrData.data.payload.qrcode 
        }), { headers: { "Content-Type": "application/json" } });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // ------------------------------------------------------------------
    // 4. API: CHECK STATUS (For Polling)
    // ------------------------------------------------------------------
    if (url.pathname === "/check-status" && request.method === "POST") {
        try {
            const body = await request.json();
            const orderId = body.order_id;
            
            const res = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
                method: "GET",
                headers: {
                    "x-client-id": env.CASHFREE_APP_ID,
                    "x-client-secret": env.CASHFREE_SECRET_KEY,
                    "x-api-version": "2023-08-01"
                }
            });
            
            const data = await res.json();
            return new Response(JSON.stringify({ status: data.order_status }), {
                headers: { "Content-Type": "application/json" }
            });

        } catch(e) {
            return new Response(JSON.stringify({ error: "Check failed" }), { status: 500 });
        }
    }

    return new Response("Not Found", { status: 404 });
  }
};
