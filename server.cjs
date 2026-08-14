"use strict";

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error("Missing frontend build. Run `npm run build` before starting the app.");
  process.exit(1);
}

app.use(express.static(distDir, { index: false }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Biazo client app listening on port ${port}`);
});
