export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");
      
      if (orderId) {
        let title, message, iconColor, bgColor;
        
        if (status === "success") {
          title = "Payment Successful!";
          message = `Your payment of ₹${url.searchParams.get("amount")} has been processed successfully.`;
          iconColor = "#10b981";
          bgColor = "#d1fae5";
        } else if (status === "failed") {
          title = "Payment Failed";
          message = "Your payment could not be processed. Please try again.";
          iconColor = "#ef4444";
          bgColor = "#fee2e2";
        } else {
          title = "Payment Processing";
          message = "We're verifying your payment. This may take a few moments.";
          iconColor = "#f59e0b";
          bgColor = "#fef3c7";
        }

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Status - Sewa Sahayak</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #f8f9fa; 
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .status-container {
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    max-width: 400px;
                    width: 100%;
                }
                .status-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    background: ${bgColor};
                }
                .status-icon svg {
                    width: 40px;
                    height: 40px;
                    color: ${iconColor};
                }
                h1 { color: ${iconColor}; margin-bottom: 10px; font-size: 24px; }
                p { color: #64748b; margin-bottom: 20px; line-height: 1.6; }
                .order-id { 
                    background: #f1f5f9; 
                    padding: 8px 12px; 
                    border-radius: 8px; 
                    font-family: monospace; 
                    font-size: 14px; 
                    margin: 15px 0; 
                    word-break: break-all;
                }
                .button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 30px;
                }
                button {
                    flex: 1;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .btn-primary {
                    background: #6366f1;
                    color: white;
                }
                .btn-primary:hover { background: #4f46e5; }
                .btn-secondary {
                    background: #f1f5f9;
                    color: #64748b;
                }
                .btn-secondary:hover { background: #e2e8f0; }
            </style>
        </head>
        <body>
            <div class="status-container">
                <div class="status-icon">
                    ${status === 'success' ? 
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>' :
                      status === 'failed' ?
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>' :
                      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
                    }
                </div>
                <h1>${title}</h1>
                <p>${message}</p>
                <div class="order-id">Order: ${orderId}</div>
                <div class="button-group">
                    <button class="btn-secondary" onclick="window.location.href='/'">New Payment</button>
                    <button class="btn-primary" onclick="window.close()">Close</button>
                </div>
            </div>
        </body>
        </html>
        `;
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }

      // Main payment page
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak - UPI QR Payment</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              * { 
                  box-sizing: border-box; 
                  -webkit-tap-highlight-color: transparent; 
                  margin: 0;
                  padding: 0;
              }
              
              html, body {
                  height: 100%;
                  width: 100%;
              }
              
              body { 
                  font-family: 'Inter', sans-serif; 
                  background: #f8f9fa; 
                  display: flex;
                  flex-direction: column;
              }

              .app-header {
                  padding: 16px 20px;
                  padding-top: max(16px, env(safe-area-inset-top));
                  background: #ffffff;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 1px solid #f1f5f9;
                  flex-shrink: 0;
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

              .content {
                  flex: 1;
                  padding: 24px;
                  overflow-y: auto;
                  -webkit-overflow-scrolling: touch;
                  padding-bottom: 100px;
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

              .qr-info {
                  background: #f0f9ff;
                  border: 1px solid #bae6fd;
                  border-radius: 12px;
                  padding: 16px;
                  margin-top: 20px;
                  display: flex;
                  align-items: center;
                  gap: 12px;
              }
              
              .qr-info svg {
                  width: 24px;
                  height: 24px;
                  color: #0369a1;
                  flex-shrink: 0;
              }
              
              .qr-info p {
                  color: #0369a1;
                  font-size: 14px;
                  line-height: 1.5;
              }
              
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

          <div class="app-header">
              <div class="brand">Sewa Sahayak</div>
              <div class="secure-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11h.6c.66 0 1.2.54 1.2 1.2v5.6c0 .66-.54 1.2-1.2 1.2H8.6c-.66 0-1.2-.54-1.2-1.2v-5.6c0-.66.54-1.2 1.2-1.2h.6V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.83 0-1.5.67-1.5 1.5V11h3V9.5c0-.83-.67-1.5-1.5-1.5z"/></svg>
                  SECURE
              </div>
          </div>

          <div class="content">
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
              
              <div class="qr-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p>You will be redirected to a secure UPI QR code page. Scan the QR code with any UPI app to complete payment.</p>
              </div>
          </div>

          <div class="footer">
              <button onclick="generateUPIQR()" id="pay-btn">
                  Generate UPI QR Code
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
          </div>

          <script>
              async function generateUPIQR() {
                  const amount = document.getElementById("amount").value;
                  const phone = document.getElementById("phone").value;
                  const btn = document.getElementById("pay-btn");
                  
                  if(!amount || amount < 1) {
                      alert("Please enter a valid amount (minimum ₹1)");
                      return;
                  }
                  
                  if(!phone || phone.length !== 10 || !/^[0-9]{10}$/.test(phone)) {
                      alert("Please enter a valid 10-digit mobile number");
                      return;
                  }

                  btn.innerHTML = '<span class="loading-spinner"></span> Generating QR...';
                  btn.disabled = true;

                  try {
                      const res = await fetch("/create-upi-order", {
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

                      // Redirect to Cashfree UPI QR page
                      window.location.href = \`https://payments.cashfree.com/order/#\${data.payment_session_id}\`;
                      
                  } catch (error) {
                      console.error("QR generation error:", error);
                      btn.innerHTML = 'Generate UPI QR Code <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
                      btn.disabled = false;
                      alert("Error: " + error.message);
                  }
              }
              
              // Input validation
              document.getElementById('amount').addEventListener('input', function(e) {
                  if(this.value < 1) this.value = 1;
              });
              
              document.getElementById('phone').addEventListener('input', function(e) {
                  this.value = this.value.replace(/[^0-9]/g, '').slice(0,10);
              });
              
              document.addEventListener('keydown', function(e) {
                  if(e.key === 'Enter') {
                      e.preventDefault();
                      generateUPIQR();
                  }
              });
          </script>
      </body>
      </html>
      `;
      return new Response(html, { 
          headers: { 
              "content-type": "text/html; charset=utf-8"
          } 
      });
    }

    // Create UPI QR order endpoint
    if (url.pathname === "/create-upi-order" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const orderId = "UPI_QR_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        const customerId = "cust_" + Date.now();
        
        // Cashfree UPI QR specific order data
        const orderData = {
            order_id: orderId,
            order_amount: parseFloat(body.amount),
            order_currency: "INR",
            customer_details: { 
                customer_id: customerId, 
                customer_phone: body.phone,
                customer_email: `${body.phone}@sewasahayak.com`
            },
            // UPI QR specific settings
            order_meta: {
                return_url: `https://${request.headers.get("host")}/?order_id=${orderId}&amount=${body.amount}&status=success`,
                notify_url: `https://${request.headers.get("host")}/webhook`
            },
            // Force UPI QR payment method only
            order_tags: {
                payment_method: "upi_qr",
                merchant_defined_tag: "sewa_sahayak"
            },
            // Optional: Set payment methods (Cashfree might still show other options)
            // To strictly enforce only QR, we'll use their specific UPI QR endpoint
        };
        
        console.log("Creating UPI QR order:", orderData.order_id, "Amount:", orderData.order_amount);
        
        // First create the order
        const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(orderData)
        });
        
        const orderDataResponse = await cfResponse.json();
        console.log("Order response:", orderDataResponse);
        
        if(cfResponse.status !== 200) {
            throw new Error(orderDataResponse.message || "Failed to create order");
        }
        
        // Create payment session specifically for UPI QR
        const sessionData = {
            order_id: orderId,
            payment_method: {
                upi: {
                    channel: "qrcode"  // This forces QR code display
                }
            },
            customer_details: orderData.customer_details
        };
        
        const sessionResponse = await fetch("https://api.cashfree.com/pg/orders/sessions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": APP_ID,
                "x-client-secret": SECRET_KEY,
                "x-api-version": "2023-08-01"
            },
            body: JSON.stringify(sessionData)
        });
        
        const sessionDataResponse = await sessionResponse.json();
        console.log("Session response:", sessionDataResponse);
        
        if(sessionResponse.status !== 200) {
            throw new Error(sessionDataResponse.message || "Failed to create payment session");
        }
        
        return new Response(JSON.stringify({
            payment_session_id: sessionDataResponse.payment_session_id,
            order_id: orderId,
            amount: body.amount,
            qr_url: `https://payments.cashfree.com/order/#${sessionDataResponse.payment_session_id}`
        }), { 
            headers: { 
                "content-type": "application/json",
                "cache-control": "no-cache"
            } 
        });
        
      } catch (e) {
        console.error("UPI QR order creation error:", e);
        return new Response(JSON.stringify({ 
            error: e.message,
            details: "Failed to generate UPI QR code"
        }), { 
            status: 500,
            headers: { "content-type": "application/json" }
        });
      }
    }

    // Webhook endpoint for payment notifications
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Payment webhook received:", JSON.stringify(body, null, 2));
        
        // You can update your database here with payment status
        // Verify webhook signature from Cashfree if needed
        
        return new Response(JSON.stringify({ 
            status: "received",
            message: "Webhook processed successfully"
        }), {
          headers: { "content-type": "application/json" }
        });
      } catch (e) {
        console.error("Webhook error:", e);
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500,
          headers: { "content-type": "application/json" }
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
