export default {
  async fetch(req, env) {
    // 1. CORS Handle (Security)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const url = new URL(req.url);

    // ============================================================
    // 1. FAST PAY LINK (No UI - Direct Redirect)
    // Usage: /pay-link?amount=100&phone=9999999999
    // ============================================================
    if (url.pathname === "/pay-link" && req.method === "GET") {
      return handleDirectRedirect(url, env);
    }

    // ============================================================
    // 2. CHECK STATUS (Verify Payment)
    // Usage: /api/status?link_id=LNK_...
    // ============================================================
    if (url.pathname === "/api/status" && req.method === "GET") {
      return checkStatus(url, env);
    }

    // ============================================================
    // 3. WEBHOOK (Optional - Auto Update)
    // ============================================================
    if (url.pathname === "/webhook/cashfree" && req.method === "POST") {
      return new Response("OK", { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Route Not Found" }), { status: 404 });
  }
};

/* -------------------------------------------------------------------------- */
/* CORE LOGIC FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

async function handleDirectRedirect(url, env) {
  try {
    const amount = Number(url.searchParams.get("amount"));
    const phone = url.searchParams.get("phone");
    
    // अगर यूजर ने return_url नहीं दिया, तो Google पर भेज दो (Error से बचने के लिए)
    const returnUrl = url.searchParams.get("return_url") || "https://www.google.com";

    if (!amount || !phone) {
      return new Response("Error: Please provide 'amount' and 'phone'", { status: 400 });
    }

    // 1. Unique Link ID बनाओ
    const linkId = "LNK_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // 2. Cashfree API को कॉल करो (Create Payment Link)
    const payload = {
      customer_details: {
        customer_phone: phone.replace(/\D/g, ''),
        customer_id: phone.replace(/\D/g, '')
      },
      link_amount: amount,
      link_currency: "INR",
      link_id: linkId,
      link_meta: {
        return_url: returnUrl // Cashfree इसके पीछे ?link_id=... खुद लगा देगा
      },
      link_notify: {
        send_sms: false,
        send_email: false
      }
    };

    const response = await fetch("https://api.cashfree.com/pg/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // 3. अगर लिंक बन गया, तो Browser को Redirect करो (302 Found)
    if (data.link_url) {
      return Response.redirect(data.link_url, 302);
    } else {
      return new Response("Cashfree Error: " + JSON.stringify(data), { status: 500 });
    }

  } catch (err) {
    return new Response("Server Error: " + err.message, { status: 500 });
  }
}

async function checkStatus(url, env) {
  try {
    const linkId = url.searchParams.get("link_id");
    
    if(!linkId) return new Response("Missing link_id", { status: 400 });

    const response = await fetch(`https://api.cashfree.com/pg/links/${linkId}`, {
      method: "GET",
      headers: {
        "x-client-id": env.CASHFREE_APP_ID,
        "x-client-secret": env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      }
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to fetch status" }), { status: 500 });
  }
}
