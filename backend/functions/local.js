// Local development server (no Firebase tools needed): http://localhost:4000/api
require("dotenv").config({ path: ".env.local" });
const app = require("./src/app");
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Amoura API listening on http://localhost:${port}/api`));
