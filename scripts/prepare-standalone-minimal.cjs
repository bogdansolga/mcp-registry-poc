"use strict";
const fs = require("node:fs");
const path = require("node:path");

const standaloneDir = path.join(__dirname, "..", ".next", "standalone");

// Copy static files to standalone/public/static folder
fs.cpSync(path.join(__dirname, "..", ".next", "static"), path.join(standaloneDir, "public", "static"), {
  recursive: true,
});
