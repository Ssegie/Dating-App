// Firebase entry point: exposes the Express app as one HTTPS function called "api".
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const app = require("./src/app");

const DATABASE_URL = defineSecret("DATABASE_URL"); // firebase functions:secrets:set DATABASE_URL

exports.api = onRequest(
  { region: "europe-west1", secrets: [DATABASE_URL], maxInstances: 10, memory: "512MiB" },
  app
);
