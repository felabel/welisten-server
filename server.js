import { createServer } from "http";
import { register } from "./routes/auth";

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  res.end("we listen server dey run go where e no know");
  // res.setHeader("Content-Type", "application/json");

  if (req.method === "POST" && req.url === "/register") {
    register(req, res);
  }
  //  else if (req.method === "POST" && req.url === "/login") {
  //   login(req, res);
  // } else {
  //   res.writeHead(404);
  //   res.end(JSON.stringify({ error: "Route not found" }));
  // }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
