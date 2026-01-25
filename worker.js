export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. GUI PAGE (QR DISPLAY) =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak Pay</title>
          <style>
              body { font-family: 'Segoe UI', sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; width: 90%; max-width: 380px; }
              h2 { color: #2d3436; margin-bottom: 5px; font-weight: 700; }
              p { color: #636e72; font-size: 14px; margin-bottom: 20px; }
              
              input { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid #dfe6e9; border-radius: 10px; box-sizing: border-box; font-size: 16px; outline: none; transition: 0.3s; }
              input:focus { border-color: #0984e3; }
              
              button { width: 100%; padding: 14px; background: #0984e3; color: white; border: none; border-radius: 10px; font-size: 16px; margin-top: 15px; cursor: pointer; font-weight: bold; transition: 0.3s; }
              button:active { transform: scale(0.98); }
              button:disabled { background: #b2bec3; }

              /* QR Box Styles */
              #qr-area { margin-top: 20px; display: none; flex-direction: column; align-items: center; animation: fadeIn 0.5s; }
              img.qr-code { width: 220px; height: 220px; border: 1px solid #eee; padding: 10px; border-radius: 12px; background: #fff; }
              .status-txt { margin-top: 15px; font-size: 14px; color: #00b894; font-weight: bold; }
              
              @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Sewa Sahayak</h2>
              <p>Instant QR Payment</p>
              
              <div id="form-section">
                  <input type="number" id="amount" placeholder="Amount (₹)" value="1" />
                  <input type="tel" id="phone" placeholder="Mobile Number" value="9999999999" />
                  <input type="text" id="remark" placeholder="Purpose" value="Payment" />
                  <button onclick="generateLinkQR()" id="pay-btn">Show QR Code</button>
              </div>

              <div id="qr-area">
                  <div id="qr-placeholder">Generating...</div>
              </div>
          </div>

          <script>
              async function generateLinkQR() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const remark = document.getElementById("remark").value;
                  const btn = document.getElementById("pay-btn");
                  const qrArea = document.getElementById("qr-area");
                  const formSec = document.getElementById("form-section");

                  if(!amount || !phone) return alert("Please fill details");

                  btn.innerText = "Creating Link...";
                  btn.disabled = true;

                  try {
                      // 1. Worker API call to generate Cashfree Link
                      const res = await fetch("/create-link", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone, remark })
                      });
                      const data = await res.json();

                      if (!data.link_url) throw new Error(data.message || "Failed to create link");

                      // 2. Link mila -> QR banao
                      formSec.style.display = "none";
                      qrArea.style.display = "flex";
                      
                      // Link ko QR image me badalna (QR Server API use karke)
                      qrArea.innerHTML = \`<img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(data.link_url)}" class="qr-code" />
                                          <div class="status-txt">Scan to Pay ₹\${amount}</div>
                                          <button onclick="location.reload()" style="background:#636e72; margin-top:15px; padding:10px;">Create New</button>\`;

                  } catch (e) {
                      alert("Error: " + e.message);
                      btn.innerText = "Try Again";
                      btn.disabled = false;
                  }
              }
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ================= 2. API: CREATE PAYMENT LINK =================
    if (url.pathname === "/create-link" && request.method === "POST") {
      try {
        const body = await request.json();
        
        // ENV se Keys
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        // Unique Link ID
        const linkId = "LNK_" + Date.now();
        
        // Cashfree Payment Links API Call
        const cfResponse = await fetch("https://api.cashfree.com/links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify({
                link_id: linkId,
                link_amount: parseFloat(body.amount),
                link_currency: "INR",
                link_purpose: body.remark,
                customer_details: {
                    customer_phone: body.phone,
                    customer_email: "customer@example.com"
                },
                link_notify: {
                    send_sms: false,
                    send_email: false
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
