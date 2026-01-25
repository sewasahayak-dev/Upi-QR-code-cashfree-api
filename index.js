export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* ==============================
       MAIN PAYMENT PAGE
    ============================== */
    if (url.pathname === "/" && request.method === "GET") {

      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");

      /* ==============================
         STATUS PAGE
      ============================== */
      if (orderId) {
        let title, message, color;

        if (status === "success") {
          title = "Payment Successful";
          message = "Your payment has been completed successfully.";
          color = "#16a34a";
        } else if (status === "failed") {
          title = "Payment Failed";
          message = "Your payment could not be completed.";
          color = "#dc2626";
        } else {
          title = "Payment Processing";
          message = "Please wait while we verify your payment.";
          color = "#f59e0b";
        }

        return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payment Status</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;background:#f8fafc;display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#fff;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center;max-width:360px}
h1{color:${color}}
p{color:#475569}
.code{margin-top:15px;font-family:monospace;background:#f1f5f9;padding:8px;border-radius:8px}
button{margin-top:20px;padding:12px 20px;border:none;border-radius:10px;background:#6366f1;color:#fff;font-weight:600}
</style>
</head>
<body>
<div class="box">
<h1>${title}</h1>
<p>${message}</p>
<div class="code">Order ID: ${orderId}</div>
<button onclick="window.location.href='/'">New Payment</button>
</div>
</body>
</html>
`, { headers: { "content-type": "text/html" }});
      }

      /* ==============================
         PAYMENT UI PAGE
      ============================== */
      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Sewa Sahayak Payments</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>

<style>
body{margin:0;font-family:Inter,Arial;background:#f8fafc}
.card{max-width:420px;margin:40px auto;background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,.1)}
.header{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:24px;text-align:center;border-radius:20px 20px 0 0}
.content{padding:24px}
input{width:100%;padding:14px;border-radius:10px;border:2px solid #e5e7eb;font-size:16px;margin-bottom:15px}
button{width:100%;padding:16px;border:none;border-radius:12px;background:#6366f1;color:#fff;font-size:17px;font-weight:700}
.error{color:#dc2626;margin-top:10px}
</style>
</head>

<body>
<div class="card">
  <div class="header">
    <h2>Sewa Sahayak</h2>
    <p>UPI QR Secure Payment</p>
  </div>

  <div class="content">
    <input type="number" id="amount" placeholder="Amount (₹)" min="1" value="1">
    <input type="tel" id="phone" placeholder="10 digit mobile number">
    <button onclick="createOrder()" id="btn">Generate UPI QR</button>
    <div class="error" id="error"></div>
  </div>
</div>

<script>
const cashfree = new Cashfree();

async function createOrder(){
  const amount = document.getElementById("amount").value;
  const phone = document.getElementById("phone").value;
  const error = document.getElementById("error");
  const btn = document.getElementById("btn");

  error.textContent = "";

  if(amount < 1){
    error.textContent = "Minimum amount ₹1";
    return;
  }
  if(!/^[0-9]{10}$/.test(phone)){
    error.textContent = "Enter valid 10 digit mobile number";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creating payment...";

  try{
    const res = await fetch("/create-order",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ amount, phone })
    });

    const data = await res.json();
    if(!data.payment_session_id) throw new Error("Session failed");

    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self"
    });

  }catch(e){
    error.textContent = e.message;
    btn.disabled = false;
    btn.textContent = "Generate UPI QR";
  }
}
</script>
</body>
</html>
`, { headers:{ "content-type":"text/html" }});
    }

    /* ==============================
       CREATE ORDER API
    ============================== */
    if (url.pathname === "/create-order" && request.method === "POST") {
      try{
        const body = await request.json();
        const APP_ID = env.CASHFREE_APP_ID;
        const SECRET = env.CASHFREE_SECRET_KEY;

        if(!APP_ID || !SECRET){
          return new Response(JSON.stringify({ error:"Cashfree keys missing" }),{status:500});
        }

        const orderId = "ORD_" + Date.now();

        const payload = {
          order_id: orderId,
          order_amount: Number(body.amount),
          order_currency: "INR",
          customer_details: {
            customer_id: body.phone,
            customer_phone: body.phone
          },
          order_meta:{
            return_url:`https://${request.headers.get("host")}/?order_id=${orderId}&status=success`
          }
        };

        const cf = await fetch("https://api.cashfree.com/pg/orders",{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "x-client-id":APP_ID,
            "x-client-secret":SECRET,
            "x-api-version":"2023-08-01"
          },
          body:JSON.stringify(payload)
        });

        const data = await cf.json();
        return new Response(JSON.stringify(data),{headers:{ "content-type":"application/json" }});

      }catch(e){
        return new Response(JSON.stringify({ error:e.message }),{status:500});
      }
    }

    return new Response("Not Found",{status:404});
  }
};
