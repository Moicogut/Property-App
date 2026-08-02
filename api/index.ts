import app from "../server";

export default function handler(req: any, res: any) {
  // Asegura que req.url mantenga el prefijo /api si Vercel lo remueve
  if (!req.url.startsWith("/api")) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}