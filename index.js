export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        service: "Sewa Sahayak Payments",
        timestamp: new Date().toISOString(),
        cashfree_mode: env.CASHFREE_MODE || "production"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Test payment page (for testing without Cashfree)
    if (url.pathname === "/test-payment" && request.method === "GET") {
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Payment - Sewa Sahayak</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                  font-family: 'Inter', sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 20px;
              }
              .test-container {
                  background: white;
                  padding: 40px;
                  border-radius: 20px;
                  text-align: center;
                  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                  max-width: 500px;
                  width: 100%;
              }
              h1 { color: #6366f1; margin-bottom: 20px; }
              p { color: #64748b; margin-bottom: 30px; line-height: 1.6; }
              .qr-placeholder {
                  width: 200px;
                  height: 200px;
                  background: #f1f5f9;
                  border: 2px dashed #cbd5e1;
                  border-radius: 12px;
                  margin: 0 auto 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 14px;
                  color: #94a3b8;
              }
              .success-btn {
                  background: #10b981;
                  color: white;
                  border: none;
                  padding: 15px 30px;
                  border-radius: 10px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  margin: 10px;
                  width: 100%;
              }
              .success-btn:hover { background: #059669; }
          </style>
      </head>
      <body>
          <div class="test-container">
              <h1>🔧 Test Payment Page</h1>
              <p>This is a test page. In production, you would see a real UPI QR code here.</p>
              
              <div class="qr-placeholder">
                  [UPI QR Code Placeholder]
              </div>
              
              <p><strong>To test Cashfree integration:</strong></p>
              <ol style="text-align: left; margin: 20px; color: #475569;">
                  <li>Ensure Cashfree APP_ID and SECRET_KEY are set in Workers</li>
                  <li>Check if Cashfree account is activated for production</li>
                  <li>Verify credentials are correct</li>
                  <li>Use test credentials for testing mode</li>
              </ol>
              
              <button class="success-btn" onclick="window.location.href='/?order_id=TEST_123&status=success'">
                  Simulate Successful Payment
              </button>
              <button class="success-btn" onclick="window.location.href='/'">
                  Back to Payment Form
              </button>
          </div>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }

    // Main page
    if (url.pathname === "/" && request.method === "GET") {
      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");
      
      // Payment status page
      if (orderId) {
        let title, message, iconColor, bgColor;
        
        if (status === "success") {
          title = "Payment Successful!";
          message = `Your payment has been processed successfully.`;
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
                    <button class="btn-primary" onclick="window.location.href='/test-payment'">Test Mode</button>
                </div>
            </div>
        </body>
        </html>
        `;
        return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      }

      // Main payment form
      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sewa Sahayak - UPI Payments</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                  font-family: 'Inter', sans-serif; 
                  background: #f8f9fa;
                  min-height: 100vh;
              }
              .container {
                  max-width: 500px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-top: 40px;
              }
              .logo {
                  font-size: 32px;
                  font-weight: 800;
                  color: #1e293b;
                  margin-bottom: 10px;
              }
              .tagline {
                  color: #64748b;
                  font-size: 16px;
              }
              .card {
                  background: white;
                  border-radius: 16px;
                  padding: 30px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                  margin-bottom: 20px;
              }
              .input-group {
                  margin-bottom: 20px;
              }
              .input-label {
                  display: block;
                  color: #475569;
                  font-size: 14px;
                  font-weight: 600;
                  margin-bottom: 8px;
              }
              .input-field {
                  width: 100%;
                  padding: 16px;
                  border: 2px solid #e2e8f0;
                  border-radius: 10px;
                  font-size: 16px;
                  font-family: inherit;
                  transition: all 0.2s;
              }
              .input-field:focus {
                  outline: none;
                  border-color: #6366f1;
                  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
              }
              .amount-display {
                  text-align: center;
                  margin: 30px 0;
                  padding: 20px;
                  background: #f1f5f9;
                  border-radius: 12px;
              }
              .amount-label {
                  color: #64748b;
                  font-size: 14px;
                  margin-bottom: 5px;
              }
              .amount-value {
                  font-size: 40px;
                  font-weight: 700;
                  color: #1e293b;
              }
              .amount-currency {
                  color: #6366f1;
                  font-size: 20px;
                  margin-right: 5px;
              }
              .btn {
                  width: 100%;
                  padding: 18px;
                  background: #6366f1;
                  color: white;
                  border: none;
                  border-radius: 12px;
                  font-size: 17px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.2s;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  gap: 10px;
              }
              .btn:hover {
                  background: #4f46e5;
                  transform: translateY(-2px);
                  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
              }
              .btn:disabled {
                  background: #cbd5e1;
                  cursor: not-allowed;
                  transform: none;
                  box-shadow: none;
              }
              .loading {
                  display: inline-block;
                  width: 20px;
                  height: 20px;
                  border: 3px solid rgba(255,255,255,0.3);
                  border-radius: 50%;
                  border-top-color: white;
                  animation: spin 1s linear infinite;
                  margin-right: 10px;
              }
              @keyframes spin {
                  to { transform: rotate(360deg); }
              }
              .info-box {
                  background: #f0f9ff;
                  border: 1px solid #bae6fd;
                  border-radius: 10px;
                  padding: 15px;
                  margin-top: 20px;
                  font-size: 14px;
                  color: #0369a1;
              }
              .error-box {
                  background: #fee2e2;
                  border: 1px solid #fca5a5;
                  border-radius: 10px;
                  padding: 15px;
                  margin-top: 20px;
                  font-size: 14px;
                  color: #dc2626;
                  display: none;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  color: #94a3b8;
                  font-size: 13px;
              }
              .test-link {
                  display: block;
                  text-align: center;
                  margin-top: 20px;
                  color: #6366f1;
                  text-decoration: none;
                  font-size: 14px;
              }
              .test-link:hover {
                  text-decoration: underline;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">Sewa Sahayak</div>
                  <div class="tagline">Secure UPI QR Code Payments</div>
              </div>
              
              <div class="card">
                  <div class="amount-display">
                      <div class="amount-label">Amount to Pay</div>
                      <div class="amount-value">
                          <span class="amount-currency">₹</span>
                          <span id="display-amount">1</span>
                      </div>
                  </div>
                  
                  <div class="input-group">
                      <label class="input-label">Payment Amount (₹)</label>
                      <input type="number" id="amount" class="input-field" 
                             placeholder="Enter amount" value="1" min="1" 
                             oninput="updateAmount()">
                  </div>
                  
                  <div class="input-group">
                      <label class="input-label">Mobile Number</label>
                      <input type="tel" id="phone" class="input-field" 
                             placeholder="Enter 10-digit mobile number" 
                             maxlength="10" oninput="formatPhone()">
                  </div>
                  
                  <div class="info-box">
                      💡 You'll be redirected to a secure payment page with a UPI QR code.
                      Scan it with Google Pay, PhonePe, Paytm, or any UPI app.
                  </div>
                  
                  <div class="error-box" id="error-box"></div>
                  
                  <button class="btn" id="pay-btn" onclick="createPayment()">
                      Generate UPI QR Code
                  </button>
                  
                  <a href="/test-payment" class="test-link">
                      Having issues? Try Test Payment Page
                  </a>
              </div>
              
              <div class="footer">
                  <div>100% Secure Payments • Powered by Cashfree</div>
                  <div style="margin-top: 5px; font-size: 12px;">
                      Test Mode: Use ₹1 for testing
                  </div>
              </div>
          </div>
          
          <script>
              function updateAmount() {
                  const amount = document.getElementById('amount').value || '1';
                  document.getElementById('display-amount').textContent = amount;
              }
              
              function formatPhone() {
                  const phoneInput = document.getElementById('phone');
                  phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '').slice(0,10);
              }
              
              function showError(message) {
                  const errorBox = document.getElementById('error-box');
                  errorBox.textContent = message;
                  errorBox.style.display = 'block';
                  setTimeout(() => errorBox.style.display = 'none', 5000);
              }
              
              async function createPayment() {
                  const amount = document.getElementById('amount').value;
                  const phone = document.getElementById('phone').value;
                  const btn = document.getElementById('pay-btn');
                  
                  // Validation
                  if (!amount || amount < 1) {
                      showError('Please enter a valid amount (minimum ₹1)');
                      return;
                  }
                  
                  if (!phone || phone.length !== 10) {
                      showError('Please enter a valid 10-digit mobile number');
                      return;
                  }
                  
                  // Disable button and show loading
                  btn.disabled = true;
                  btn.innerHTML = '<span class="loading"></span> Creating Payment Link...';
                  
                  try {
                      const response = await fetch('/create-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount, phone })
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                          throw new Error(data.message || 'Payment failed');
                      }
                      
                      if (!data.payment_url) {
                          throw new Error('Payment URL not received');
                      }
                      
                      // Redirect to payment page
                      window.location.href = data.payment_url;
                      
                  } catch (error) {
                      console.error('Payment error:', error);
                      
                      let errorMessage = error.message;
                      
                      // Common errors mapping
                      if (error.message.includes('client session') || 
                          error.message.includes('invalid') ||
                          error.message.includes('credentials')) {
                          errorMessage = 'Payment service configuration error. Please contact support or use Test Mode.';
                      } else if (error.message.includes('network') || 
                                error.message.includes('fetch')) {
                          errorMessage = 'Network error. Please check your connection and try again.';
                      }
                      
                      showError('Error: ' + errorMessage);
                      
                      // Reset button
                      btn.disabled = false;
                      btn.innerHTML = 'Generate UPI QR Code';
                  }
              }
              
              // Initialize
              updateAmount();
              
              // Auto-fill demo phone
              document.getElementById('phone').addEventListener('focus', function() {
                  if (!this.value) {
                      this.value = '9999999999';
                  }
              });
              
              // Enter key support
              document.addEventListener('keypress', function(e) {
                  if (e.key === 'Enter') {
                      createPayment();
                  }
              });
          </script>
      </body>
      </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    }

    // Create payment endpoint
    if (url.pathname === "/create-payment" && request.method === "POST") {
      try {
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET_KEY = env.CASHFREE_SECRET_KEY;
        const MODE = env.CASHFREE_MODE || "production";
        
        console.log("Payment request received:", body);
        console.log("Mode:", MODE);
        
        // Check credentials
        if (!APP_ID || !SECRET_KEY) {
          console.error("Missing Cashfree credentials");
          return new Response(JSON.stringify({
            success: false,
            message: "Payment service not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY."
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Validate
        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount < 1) {
          return new Response(JSON.stringify({
            success: false,
            message: "Invalid amount. Minimum ₹1 required."
          }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        
        const phone = body.phone?.toString().trim();
        if (!phone || !/^\d{10}$/.test(phone)) {
          return new Response(JSON.stringify({
            success: false,
            message: "Invalid phone number. 10 digits required."
          }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        
        // Generate IDs
        const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const customerId = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Determine API endpoint based on mode
        const baseUrl = MODE === "sandbox" 
          ? "https://sandbox.cashfree.com/pg" 
          : "https://api.cashfree.com/pg";
        
        // Create order payload
        const orderData = {
          order_id: orderId,
          order_amount: amount,
          order_currency: "INR",
          customer_details: {
            customer_id: customerId,
            customer_phone: phone,
            customer_email: `${phone}@sewasahayak.com`,
            customer_name: "Customer"
          },
          order_meta: {
            return_url: `https://${request.headers.get("host")}/?order_id=${orderId}&status=success`,
            notify_url: `https://${request.headers.get("host")}/webhook`
          }
        };
        
        console.log("Creating Cashfree order:", orderData);
        
        // Create order
        const orderResponse = await fetch(`${baseUrl}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": APP_ID,
            "x-client-secret": SECRET_KEY,
            "x-api-version": "2023-08-01"
          },
          body: JSON.stringify(orderData)
        });
        
        const orderResult = await orderResponse.json();
        console.log("Cashfree response:", orderResult);
        
        if (!orderResponse.ok) {
          // Check for specific errors
          if (orderResult.message?.includes("Invalid client credentials")) {
            return new Response(JSON.stringify({
              success: false,
              message: "Invalid Cashfree credentials. Please check APP_ID and SECRET_KEY."
            }), { status: 401, headers: { "Content-Type": "application/json" } });
          }
          
          if (orderResult.message?.includes("not active")) {
            return new Response(JSON.stringify({
              success: false,
              message: "Cashfree account not active. Please activate your merchant account."
            }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
          
          throw new Error(orderResult.message || "Failed to create order");
        }
        
        if (!orderResult.payment_session_id) {
          throw new Error("Payment session ID not received");
        }
        
        // Build payment URL
        const paymentBase = MODE === "sandbox" 
          ? "https://sandbox.cashfree.com/pg/order" 
          : "https://payments.cashfree.com/order";
        
        const paymentUrl = `${paymentBase}#${orderResult.payment_session_id}`;
        
        console.log("Payment URL created:", paymentUrl);
        
        return new Response(JSON.stringify({
          success: true,
          order_id: orderId,
          payment_session_id: orderResult.payment_session_id,
          payment_url: paymentUrl,
          mode: MODE
        }), {
          headers: { "Content-Type": "application/json" }
        });
        
      } catch (error) {
        console.error("Payment creation error:", error);
        
        return new Response(JSON.stringify({
          success: false,
          message: error.message || "Payment processing failed",
          suggestion: "Check your Cashfree credentials and account status"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Webhook endpoint
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Webhook received:", body);
        return new Response(JSON.stringify({ received: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Webhook error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
