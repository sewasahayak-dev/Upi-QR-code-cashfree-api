export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ------------------------------------------------------------------
    // 1. FRONTEND UI
    // ------------------------------------------------------------------
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak</title>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
              body { font-family: 'Poppins', sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
              .card { background: white; width: 100%; max-width: 380px; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
              input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #eee; border-radius: 10px; font-size: 16px; outline: none; }
              input:focus { border-color: #6366f1; }
              button { width: 100%; padding: 14px; background: #6366f1; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px; }
              button:disabled { background: #ccc; }
              .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 8px; font-size: 12px; margin-top: 15px; display: none; text-align: left; word-break: break-all; border: 1px solid #fecaca; }
              #qr-view, #success-view { display: none; }
              #qrcode { margin: 20px auto; display: flex; justify-content: center; }
              #qrcode img { border: 5px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); border-radius: 10px; }
              .vpa-box { background: #eff6ff; color: #1e40af; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 15px; border: 1px dashed #bfdbfe; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Sewa Sahayak</h2>
              
              <div id="form-view">
                  <p style="color:#666; font-size:14px;">Instant UPI Payment</p>
                  <input type="number" id="amount" placeholder="Amount (₹)" value="1.00">
                  <input type="tel" id="phone" placeholder="Phone Number" maxlength="10">
                  <button id="btn" onclick="process()">Pay Now</button>
                  <div id="error-box" class="error"></div>
              </div>

              <div id="qr-view">
                  <p style="margin-bottom:10px; font-weight:600;">Scan or Pay to UPI ID</p>
                  <div class="vpa-box" id="vpa-txt">Fetching...</div>
                  <div id="qrcode"></div>
                  <button onclick="location.reload()" style="background:#eee; color:#333;">Cancel</button>
              </div>

              <div id="success-view">
                  <div style="font-size:50px; color:#22c55e;">✓</div>
                  <h3 style="color:#15803d;">Payment Successful</h3>
                  <button onclick="location.reload()" style="background:#22c55e;">Done</button>
              </div>
          </div>

          <script>
              async function process() {
                  const amt = document.getElementById('amount').value;
                  const ph = document.getElementById('phone').value;
                  const btn = document.getElementById('btn');
                  const errBox = document.getElementById('error-box');

                  if(!amt || ph.length !== 10) { alert("Invalid Input"); return; }

                  btn.disabled = true; btn.innerText = "Processing...";
                  errBox.style.display = 'none';

                  try {
                      const res = await fetch("/api/get-qr", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount: amt, phone: ph })
                      });
                      const data = await res.json();

                      if(!res.ok) throw new Error(data.message || JSON.stringify(data));

                      document.getElementById('form-view').style.display = 'none';
                      document.getElementById('qr-view').style.display = 'block';
                      document.getElementById('vpa-txt').innerText = data.vpa || "Scan QR Below";

                      new QRCode(document.getElementById("qrcode"), {
                          text: data.upi_link, width: 200, height: 200
                      });

                      checkStatus(data.order_id);

                  } catch(e) {
                      errBox.style.display = 'block';
                      errBox.innerHTML = "<strong>Error:</strong> " + e.message;
                      btn.disabled = false; btn.innerText = "Pay Now";
                  }
              }

              function checkStatus(oid) {
                  setInterval(async () => {
                      try {
                          const r = await fetch("/api/status?id=" + oid);
                          const d = await r.json();
                          if(d.status === "PAID") {
                              document.getElementById('qr-view').style.display = 'none';
                              document.getElementById('success-view').style.display = 'block';
                          }
                      } catch(e){}
                  }, 3000);
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ------------------------------------------------------------------
    // 2. API: CREATE & GET LINK
    // ------------------------------------------------------------------
    if (url.pathname === "/api/get-qr" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET = env.CASHFREE_SECRET_KEY;
        const BASE = "https://api.cashfree.com/pg"; // Production

        if (!APP_ID || !SECRET) throw new Error("API Keys Missing");

        // STEP 1: CREATE ORDER
        const orderId = "ORD_" + Date.now();
        const amountFixed = parseFloat(body.amount).toFixed(2); // Fix Decimal Issue

        const orderResp = await fetch(BASE + "/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID, "x-client-secret": SECRET, "x-api-version": "2022-09-01"
            },
            body: JSON.stringify({
                order_id: orderId,
                order_amount: parseFloat(amountFixed),
                order_currency: "INR",
                customer_details: {
                    customer_id: "CUST_" + Date.now(),
                    customer_phone: body.phone,
                    customer_email: "raj.bazaarika@example.com" // Required field
                }
            })
        });

        const orderData = await orderResp.json();
        if (!orderResp.ok) return new Response(JSON.stringify(orderData), { status: 400 });

        const sessionId = orderData.payment_session_id;
        
        // DEBUG CHECK: Did we get a session?
        if(!sessionId) {
            return new Response(JSON.stringify({ message: "No Session ID returned from Create Order", debug: orderData }), { status: 400 });
        }

        // STEP 2: GET UPI LINK (Using /orders/pay)
        // Note: Using 2022-09-01 version which is very stable for S2S
        const payResp = await fetch(BASE + "/orders/pay", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID, "x-client-secret": SECRET, "x-api-version": "2022-09-01"
            },
            body: JSON.stringify({
                payment_session_id: sessionId,
                payment_method: {
                    upi: { channel: "link" } 
                }
            })
        });

        const payData = await payResp.json();

        if (!payResp.ok) {
             return new Response(JSON.stringify({ 
                 message: "Pay API Failed: " + (payData.message || "Unknown"), 
                 debug_response: payData,
                 sent_session_id: sessionId 
             }), { status: 400 });
        }

        // STEP 3: EXTRACT DATA
        let link = null;
        if(payData.data && payData.data.payload) {
             link = payData.data.payload.default || payData.data.payload.qrcode;
        }

        if(!link) return new Response(JSON.stringify({ message: "No Link Found", debug: payData }), { status: 400 });

        // Extract VPA
        let vpa = "Scan QR";
        try {
            const m = link.match(/[?&]pa=([^&]+)/);
            if(m && m[1]) vpa = decodeURIComponent(m[1]);
        } catch(e){}

        return new Response(JSON.stringify({ order_id: orderId, upi_link: link, vpa: vpa }), { headers: { "Content-Type": "application/json" } });

      } catch (e) {
        return new Response(JSON.stringify({ message: e.message }), { status: 500 });
      }
    }

    // ------------------------------------------------------------------
    // 3. CHECK STATUS
    // ------------------------------------------------------------------
    if (url.pathname === "/api/status" && request.method === "GET") {
        const id = url.searchParams.get("id");
        try {
            const r = await fetch(`https://api.cashfree.com/pg/orders/${id}`, {
                headers: { "x-client-id": env.CASHFREE_APP_ID, "x-client-secret": env.CASHFREE_SECRET_KEY, "x-api-version": "2022-09-01" }
            });
            const d = await r.json();
            return new Response(JSON.stringify({ status: d.order_status }), { headers: { "Content-Type": "application/json" } });
        } catch(e) { return new Response("Error", { status: 500 }); }
    }

    return new Response("Not Found", { status: 404 });
  }
};
