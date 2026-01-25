export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: PAYMENT PAGE =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak Pay</title>
          <style>
              body { font-family: -apple-system, sans-serif; background: #f4f7f6; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); text-align: center; width: 90%; max-width: 380px; }
              h2 { color: #333; margin-bottom: 5px; }
              p { color: #666; font-size: 14px; margin-bottom: 20px; }
              
              input { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; outline: none; }
              input:focus { border-color: #6c5ce7; }
              
              button { width: 100%; padding: 14px; background: #6c5ce7; color: white; border: none; border-radius: 8px; font-size: 16px; margin-top: 15px; cursor: pointer; font-weight: bold; }
              button:disabled { background: #ccc; }

              #qr-area { margin-top: 20px; display: none; flex-direction: column; align-items: center; padding-top: 15px; border-top: 1px dashed #ccc; }
              img.qr-code { width: 220px; height: 220px; border-radius: 10px; border: 1px solid #eee; }
              .scan-msg { margin-top: 10px; font-weight: bold; color: #00b894; }
          </style>
      </head>
      <body>
          <div class="card">
              <h2>Sewa Sahayak</h2>
              <p>Secure UPI Payment</p>
              
              <div id="form-section">
                  <input type="number" id="amount" placeholder="Amount (₹)" value="1" />
                  <input type="tel" id="phone" placeholder="Phone Number" value="9999999999" />
                  <input type="text" id="remark" placeholder="Purpose" value="Payment" />
                  <button onclick="generateQR()" id="pay-btn">Generate QR Code</button>
              </div>

              <div id="qr-area">
                  <div id="loader" style="color:#888;">Generating Link...</div>
              </div>
          </div>

          <script>
              async function generateQR() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const remark = document.getElementById("remark").value;
                  const btn = document.getElementById("pay-btn");
                  const qrArea = document.getElementById("qr-area");
                  const formSec = document.getElementById("form-section");

                  if(!amount || !phone) return alert("Please fill details");

                  btn.innerText = "Processing...";
                  btn.disabled = true;

                  try {
                      // Call our Backend API
                      const res = await fetch("/create-link", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone, remark })
                      });
                      const data = await res.json();

                      if (!data.link_url) throw new Error(data.message || "Failed to create link");

                      // Success! Show QR
                      formSec.style.display = "none";
                      qrArea.style.display = "flex";
                      
                      qrArea.innerHTML = \`
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=\${encodeURIComponent(data.link_url)}" class="qr-code" />
                          <div class="scan-msg">Scan & Pay ₹\${amount}</div>
                          <p style="font-size:12px; color:#888; margin-top:10px">Link sent to \${phone}</p>
                          <button onclick="location.reload()" style="background:#555; margin-top:15px; padding:10px; font-size:14px;">New Payment</button>
                      \`;

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

    // ================= 2. BACKEND API =================
    if (url.pathname === "/create-link" && request.method === "POST") {
      try {
        const body = await request.json();
        
        // Settings se Keys load karna
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        // Agar keys nahi mili to error do
        if(!APP_ID || !SECRET_KEY) {
            return new Response(JSON.stringify({ message: "API Keys not found in Dashboard Settings" }), { status: 500 });
        }

        const linkId = "LNK_" + Date.now();
        
        // Cashfree Payment Link API Call
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
                    send_sms: true,
                    send_email: false
                }
            })
        });

        const data = await cfResponse.json();
        return new Response(JSON.stringify(data), { headers: { "content-type": "application/json" } });

      } catch (e) {
        return new Response(JSON.stringify({ message: e.message }), { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
