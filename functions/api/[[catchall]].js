export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const targetOrigin = "https://clipflux-m6hm.onrender.com";
  const targetUrl = `${targetOrigin}${url.pathname}${url.search}`;

  const newHeaders = new Headers(request.headers);
  newHeaders.set("Host", "clipflux-m6hm.onrender.com");

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: "follow",
  });

  try {
    const response = await fetch(proxyRequest);
    const newResHeaders = new Headers(response.headers);
    newResHeaders.set("Access-Control-Allow-Origin", "*");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newResHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Backend proxy connection failed", details: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
