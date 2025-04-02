export default {
  async fetch(request, env) {
	  
	const object = await env.MY_R2_BUCKET.get("dic.csv");
      if (object) {
        const content = await object.text();
        return new Response(content);
      } else {
        return new Response("File not found", { status: 404 });
      }
  },
};