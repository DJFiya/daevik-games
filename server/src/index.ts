import { routePartykitRequest } from "partyserver";

export { Room } from "./room";

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGINS.split(",");
    const origin = request.headers.get("Origin");
    const refuse = () => new Response("Forbidden", { status: 403 });
    return (
      (await routePartykitRequest(request, env, {
        onBeforeConnect: () => (origin && allowed.includes(origin) ? undefined : refuse()),
        onBeforeRequest: () => refuse(),
      })) ?? new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
