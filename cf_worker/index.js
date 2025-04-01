export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/access/")) {
      const key = path.slice("/access/".length);
      if (!key) {
        return new Response("No file key provided", { status: 400 });
      }

      const object = await env.my_r2_bucket.get(key);
      if (object) {
        const content = await object.text();
        return new Response(content);
      } else {
        return new Response("File not found", { status: 404 });
      }
    } else {
      return new Response("Invalid path", { status: 404 });
    }
  },
};