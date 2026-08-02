import app from "../server";

export default function handler(req: any, res: any) {
  // Garantizar que la ruta no rompa el router de Express en Serverless
  if (!req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}