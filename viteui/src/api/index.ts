/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
// Use the fully qualified name for the Env type
const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// app.get("*", (c) => {
//   return c.env.ASSETS.fetch(c.req.raw);
// });

export default app;
