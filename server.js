import http from "http";
import { register, login } from "./routes/auth.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Change '*' to 'http://localhost:5173' in production
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No content response
    return res.end();
  }

  if (req.method === "POST" && req.url === "/register") {
    register(req, res);
  } else if (req.method === "POST" && req.url === "/login") {
    login(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
