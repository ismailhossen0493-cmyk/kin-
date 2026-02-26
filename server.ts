const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Kin! Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

export default async (req: any, res: any) => {
  const app = await startServer();
  return app(req, res);
};

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
