export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Sewa Sahayak</title>
          <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              /* --- RESET & BASE --- */
              * { 
                  box-sizing: border-box; 
                  -webkit-tap-highlight-color: transparent; 
                  margin: 0;
                  padding: 0;
              }
              
              html, body {
                  height: 100%;
                  width: 100%;
                  overflow: hidden;
              }
              
              body { 
                  font-family: 'Inter', sans-serif; 
                  background: #f8f9fa; 
                  display: flex;
                  flex-direction: column;
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
              }

              /* --- HEADER --- */
              .app-header {
                  padding: 16px 20px;
                  padding-top: max(16px, env(safe-area-inset-top));
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0;
                  z-index: 100;
              }
              
              .brand { 
                  font-size: 20px; 
                  font-weight: 800; 
                  color: #1e293b; 
                  letter-spacing: -0.5px; 
              }
              
              .secure-badge { 
                  background: #ecfdf5; 
                  color: #059669; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
                  font-size: 11px; 
                  font-weight: 700; 
                  display: flex; 
                  align-items: center; 
                  gap: 4px; 
              }

              /* --- CONTENT (Scrollable) --- */
              .content {
                  flex: 1;
                  padding: 24px;
                  overflow-y: auto;
                  -webkit-overflow-scrolling: touch;
                  min-height: 0;
                  padding-bottom: 90px;
              }

              .input-group { 
                  margin-bottom: 24px; 
              }
              
              .label { 
                  font-size: 12px; 
                  color: #64748b; 
                  font-weight: 600; 
                  margin-bottom: 8px; 
                  text-transform: uppercase; 
                  letter-spacing: 0.5px; 
              }
              
              .input-wrapper {
                  background: #ffffff;
                  border: 1.5px solid #e2e8f0;
                  border-radius: 16px;
                  padding: 16px;
                  display: flex; 
                  align-items: center; 
                  transition: all 0.2s ease;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
              }
              
              .input-wrapper:focus-within { 
                  border-color: #6366f1; 
                  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); 
              }
              
              .icon { 
                  width: 24px; 
                  height: 24px; 
                  margin-right: 12px; 
                  fill: #94a3b8; 
                  flex-shrink: 0;
              }
              
              .input-wrapper:focus-within .icon { 
                  fill: #6366f1; 
              }
              
              input { 
                  border: none; 
                  background: transparent; 
                  width: 100%; 
                  font-size: 18px; 
                  font-weight: 600; 
                  color: #0f172a; 
                  outline: none; 
                  min-width: 0;
              }
              
              input::-webkit-outer-spin-button,
              input::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
              }
              
              input[type=number] {
                  -moz-appearance: textfield;
              }
              
              input::placeholder { 
                  color: #cbd5e1; 
              }

              /* --- STICKY FOOTER BUTTON --- */
              .footer {
                  position: fixed;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  padding: 20px 24px;
                  padding-bottom: max(20px, env(safe-area-inset-bottom));
                  background: #ffffff;
                  border-top: 1px solid #f1f5f9;
                  z-index: 50;
                  box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
                  flex-shrink: 0;
              }

              button {
                  width: 100%;
                  padding: 16px;
                  background: #6366f1;
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 16px;
                  font-weight: 700;
                  cursor: pointer;
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  gap: 8px;
                  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                  transition: all 0.2s ease;
              }
              
              button:active { 
                  transform: scale(0.98); 
              }
              
              button:disabled { 
                  background: #cbd5e1; 
                  box-shadow: none; 
                  cursor: not-allowed;
              }

              /* --- FULL SCREEN OVERLAY --- */
              #payment-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: #ffffff;
                  z-index: 999999;
                  display: none;
                  overflow: hidden;
              }
              
              #payment-overlay iframe {
                  width: 100%;
                  height: 100%;
                  border: none;
                  display: block;
              }
              
              .loading-spinner {
                  display: inline-block;
                  width: 20px;
                  height: 20px;
                  border: 3px solid rgba(255,255,255,.3);
                  border-radius: 50%;
                  border-top-color: #fff;
                  animation: spin 1s ease-in-out infinite;
                  margin-right: 8px;
              }
              
              @keyframes spin {
                  to { transform: rotate(360deg); }
              }
              
              /* Mobile optimizations */
              @media (max-width: 480px) {
                  .content {
                      padding: 20px;
                  }
                  
                  .footer {
                      padding: 16px 20px;
                      padding-bottom: max(16px, env(safe-area-inset-bottom));
                  }
                  
                  .input-wrapper {
                      padding: 14px;
                  }
                  
                  input {
                      font-size: 16px;
                  }
              }
          </style>
      </head>
      <body>

          <div class="app-header" id="header">
              <div class="brand">Sewa Sahayak</div>
              <div class="secure-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11h.6c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H8.6c-.66 0-1.2-.54-1.2-1.2v-5.6c0-.66.54-1.2 1.2-1.2h.6V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.83 0-1.5.67-1.5 1.5V11h3V9.5c0-.83-.67-1.5-1.5-1.5z"/></svg>
                  SECURE
              </div>
          </div>

          <div class="content" id="main-content">
              <div class="input-group">
                  <div class="label">Payment Amount (₹)</div>
                  <div class="input-wrapper">
                      <svg class="icon" viewBox="0 0 24 24"><path d="M17 6V4H6v2h3.5c1.302 0 2.401.838 2.815 2H6v2h6.315A2.995 2.995 0 0 1 9.5 12H6v2.414L11.586 20h2.828l-6-6H9.5a5.007 5.007 0 0 0 4.898-4H17V8h-2.602a4.933 4.933 0 0 0-.924-2H17z"/></svg>
                      <input type="number" id="amount" placeholder="0" value="1" min="1" step="1" inputmode="decimal" />
                  </div>
              </div>

              <div class="input-group">
                  <div class="label">Mobile Number</div>
                  <div class="input-wrapper">
                      <svg class="icon" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                      <input type="tel" id="phone" placeholder="9999999999" value="9999999999" maxlength="10" inputmode="numeric" pattern="[0-9]{10}" />
                  </div>
              </div>
          </div>

          <div class="footer" id="footer">
              <button onclick="startNativePayment()" id="pay-btn">
                  Proceed to Pay
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
          </div>

          <div id="payment-overlay"></div>

          <script>
              let cashfree;
              try { 
                  cashfree = Cashfree({ mode: "production" }); 
              } catch(e) { 
                  console.error("Cashfree SDK error:", e); 
              }

              async function startNativePayment() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  const overlay = document.getElementById("payment-overlay");
                  
                  if(!amount || amount < 1) {
                      alert("Please enter a valid amount (minimum ₹1)");
                      return;
                  }
                  
                  if(!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
                      alert("Please enter a valid 10-digit mobile number");
                      return;
                  }

                  btn.innerHTML = '<span class="loading-spinner"></span> Processing...';
                  btn.disabled = true;

                  try {
                      const res = await fetch("/create-order", {
                          method: "POST", 
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                              amount: parseFloat(amount), 
                              phone: phone 
                          })
                      });
                      
                      const data = await res.json();
                      
                      if (!data.payment_session_id) {
                          throw new Error(data.message || data.error || "Failed to create order");
                      }

                      // Hide main UI
                      document.getElementById("header").style.display = 'none';
                      document.getElementById("main-content").style.display = 'none';
                      document.getElementById("footer").style.display = 'none';
                      
                      // Show overlay with full screen
                      overlay.style.display = 'block';
                      document.body.style.overflow = 'hidden';
                      
                      // Ensure overlay takes full viewport
                      overlay.style.position = 'fixed';
                      overlay.style.top = '0';
                      overlay.style.left = '0';
                      overlay.style.width = '100vw';
                      overlay.style.height = '100vh';
                      overlay.style.zIndex = '999999';

                      cashfree.checkout({
                          paymentSessionId: data.payment_session_id,
                          redirectTarget: overlay,
                          appearance: { 
                              theme: "light",
                              orientation: "portrait"
                          }
                      }).then(function(result){
                          if(result.error) {
                              throw new Error(result.error.message || "Payment failed");
                          }
                          if(result.redirect) {
                              console.log("Redirecting to:", result.redirectUrl);
                          }
                      }).catch(function(error){
                          console.error("Checkout error:", error);
                          resetUI();
                          alert("Payment Error: " + error.message);
                      });
                      
                  } catch (error) {
                      console.error("Payment initiation error:", error);
                      resetUI();
                      alert("Error: " + error.message);
                  }
              }
              
              function resetUI() {
                  const btn = document.getElementById("pay-btn");
                  btn.innerHTML = 'Proceed to Pay <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                  btn.disabled = false;
                  
                  document.getElementById("header").style.display = 'flex';
                  document.getElementById("main-content").style.display = 'block';
                  document.getElementById("footer").style.display = 'block';
                  
                  document.getElementById("payment-overlay").style.display = 'none';
                  document.body.style.overflow = '';
              }
              
              // Input validation
              document.getElementById('amount').addEventListener('input', function(e) {
                  if(this.value < 1) this.value = 1;
              });
              
              document.getElementById('phone').addEventListener('input', function(e) {
                  this.value = this.value.replace(/[^0-9]/g, '').slice(0,10);
              });
              
              // Prevent form submission on enter
              document.addEventListener('keydown', function(e) {
                  if(e.key === 'Enter') {
                      e.preventDefault();
                      startNativePayment();
                  }
              });
          </script>
      </body>
      </html>
      `;
      return new Response(html, { 
          headers: { 
              "content-type": "text/html; charset=utf-8",
              "x-frame-options": "SAMEORIGIN"
          } 
      });
    }

    // Backend Same Rahega
    if (url.pathname === "/create-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const orderId = "ORD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        
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
                    customer_phone: body.phone,
                    customer_email: body.phone + "@cashfree.com"
                },
                order_meta: {
                    return_url: "https://" + request.headers.get("host") + "/?order_id=" + orderId
                }
            })
        });
        
        const data = await cfResponse.json();
        
        if(cfResponse.status !== 200) {
            throw new Error(data.message || "Failed to create order");
        }
        
        return new Response(JSON.stringify(data), { 
            headers: { 
                "content-type": "application/json",
                "cache-control": "no-cache"
            } 
        });
        
      } catch (e) {
        console.error("Order creation error:", e);
        return new Response(JSON.stringify({ 
            error: e.message,
            details: "Order creation failed"
        }), { 
            status: 500,
            headers: { "content-type": "application/json" }
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
