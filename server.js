import http from "http";
import { register, login, checkAuthorization } from "./routes/auth.js";
import { readCategories } from "./routes/categories.js";
import { createFeedback, readFeedbacks } from "./routes/feedback.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Change '*' to 'http://localhost:5173' in production
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow Authorization header

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No content response
    return res.end();
  }

  // auth
  if (req.method === "POST" && req.url === "/register") {
    register(req, res);
  } else if (req.method === "POST" && req.url === "/login") {
    login(req, res);
  } else if (req.method === "GET" && req.url === "/categories") {
    const categories = readCategories(); // Get categories from the file
    res.writeHead(200);
    res.end(JSON.stringify({ categories }));
  } else if (req.method === "GET" && req.url === "/feedback") {
    const feedbacks = readFeedbacks();
    res.writeHead(200);
    res.end(JSON.stringify({ feedbacks }));
  } // POST /feedback - Create feedback (auth protected)
  else if (req.method === "POST" && req.url === "/feedback") {
    if (!checkAuthorization(req).isValid) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    createFeedback(req, res);
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
