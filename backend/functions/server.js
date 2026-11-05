// Production entry point (Render, or any Node host): node server.js
const app = require("./src/app");
const port = process.env.PORT || 4000;
app.listen(port, "0.0.0.0", () => console.log(`Amoura API listening on port ${port}`));