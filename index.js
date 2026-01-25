export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ================= 1. FRONTEND: GUI PAGE =================
    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak Pay</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <style>
              body { font-family: -apple-system, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
              .card { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 420px; overflow: hidden; }
              .header { padding: 20px; background: #6c5ce7; color: white; text-align: center; }
              h2 { margin: 0; font-size: 22px; }
              
              .form-box { padding: 20px; }
              input { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
              button { width: 100%; padding: 14px; background: #00b894; color: white; border: none; border-radius: 8px; font-size: 16px; margin-top: 10px; cursor: pointer; font-weight: bold; }
              button:disabled { background: #ccc; }

              /* Payment Frame (Jahan Cashfree load hoga) */
              #payment-frame { width: 100%; height: 500px; border: none; display: none; }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="header">
                  <h2>Sewa Sahayak</h2>
                  <small>Secure Payments</small>
              </div>
              
              <div class="form-box" id="input-section">
                  <input type="number" id="amount" placeholder="Amount (₹)" value="1" />
                  <input type="tel" id="phone" placeholder="Phone Number" value="9999999999" />
                  <button onclick="startPayment()" id="pay-btn">Pay Now</button>
              </div>

              <div id="payment-frame"></div>
          </div>

          <script>
              let cashfree;
              try {
                  cashfree = Cashfree({ mode: "production" });
              } catch(e) { console.error(e); }

              async function startPayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const frame = document.getElementById("payment-frame");
                  const inputSec = document.getElementById("input-section");

                  if(!amount || !phone) return alert("Fill all details");

                  btn.innerText = "Processing...";
                  btn.disabled = true;

                  try {
                      // 1. Create Order (Standard API)
                      const res = await fetch("/create-order", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ amount, phone })
                      });
                      const data = await res.json();

                      if (!data.payment_session_id) throw new Error(data.message || "Order Failed");

                      // 2. Embed Cashfree UI
                      inputSec.style.display = "none"; // Form chhupao
                      frame.style.display = "block";   // Frame dikhao

                      // Ye Cashfree ke page ko DIV ke andar load kar dega
                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: document.getElementById("payment-frame"),
                          appearance: {
                              theme: "light",
                          }
                      });

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

    // ================= 2. BACKEND API (Standard Orders) =================
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        
        // ENV Variables (Settings se keys)
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        
        const orderId = "ORD_" + Date.now();
        
        // ✅ STANDARD ORDER API (Ye Block Nahi Hoti)
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
