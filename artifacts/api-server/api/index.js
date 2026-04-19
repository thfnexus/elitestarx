// This is a Proxy to run our bundled ESM code as a Vercel Serverless Function
let cachedApp;

export default async function handler(req, res) {
  if (!cachedApp) {
    // Dynamically import the bundled application
    const { default: app } = await import('../dist/index.mjs');
    cachedApp = app;
  }
  
  // Forward the request to the Express application
  return cachedApp(req, res);
}
