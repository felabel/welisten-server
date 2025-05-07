import http from "http";
import { register, login, checkAuthorization } from "./routes/auth.js";
import { readCategories } from "./routes/categories.js";
import {
  createFeedback,
  getFeedbackById,
  readFeedbacks,
  updateFeedback,
  upvoteFeedback,
  addComment,
  addReply,
  updateFeedbackStatus,
  getFeedbackStatusCount,
  getFeedbacks,
} from "./routes/feedback.js";

const PORT = process.env.PORT || 3000;

// Function to parse ID from URL
const extractIdFromUrl = (url, base) => {
  const regex = new RegExp(`^${base}/(\\d+)$`);
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Routes definition
const routes = {
  POST: {
    "/register": register,
    "/login": login,
    "/feedback": (req, res) => {
      if (!checkAuthorization(req).isValid) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
      createFeedback(req, res);
    },
    "/feedback/upvote": upvoteFeedback,
    "/feedback/comment": addComment,
    "/feedback/reply": addReply,
  },

  GET: {
    "/categories": (req, res) => {
      const categories = readCategories();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ categories }));
    },
    "/feedback": (req, res) => {
      // Parse URL and query parameters
      const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
      const category = parsedUrl.searchParams.get("category");
      const sort = parsedUrl.searchParams.get("sort");

      // Get feedbacks with filters
      const feedbacks = getFeedbacks(category, sort);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ feedbacks }));
    },
    "/feedback/status-count": getFeedbackStatusCount,
  },
  PUT: {
    "/feedback/:id": updateFeedback,
    "/feedback/status": updateFeedbackStatus,
  },
};

// Create Server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Change '*' to a specific domain in production
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET, PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // Extract path without query parameters
  const pathname = req.url ? req.url.split("?")[0] : "/";

  // Check for exact route match (without query params)
  if (routes[req.method] && routes[req.method][pathname]) {
    return routes[req.method][pathname](req, res);
  }

  // Handle dynamic routes
  const urlParts = pathname.split("/");
  if (urlParts[1] === "feedback") {
    const id = urlParts[2]; // Get the ID part

    if (req.method === "GET" && id) {
      return getFeedbackById(req, res, id);
    }

    if (req.method === "PUT" && id) {
      return updateFeedback(req, res); // ID will be extracted inside
    }
  }

  // // Check for exact route match
  // if (routes[req.method] && routes[req.method][req.url]) {
  //   return routes[req.method][req.url](req, res);
  // }

  // // Handle dynamic routes
  // const urlParts = req.url.split("/");
  // if (urlParts[1] === "feedback") {
  //   const id = urlParts[2]; // Get the ID part

  //   if (req.method === "GET" && id) {
  //     return getFeedbackById(req, res, id);
  //   }

  //   if (req.method === "PUT" && id) {
  //     return updateFeedback(req, res); // ID will be extracted inside
  //   }
  // }

  // If no matching route
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
