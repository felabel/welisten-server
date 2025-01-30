import http from "http";
import { register, login } from "./routes/auth.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
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
