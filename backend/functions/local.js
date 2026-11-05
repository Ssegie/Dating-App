// Local development: loads .env.local, then starts the server on http://localhost:4000/api
require("dotenv").config({ path: ".env.local" });
require("./server");