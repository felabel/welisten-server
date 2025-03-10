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
      const feedbacks = readFeedbacks();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ feedbacks }));
    },
    "/feedback/status-count": getFeedbackStatusCount,
  },
  PUT: {
    "/feedback": updateFeedback,
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

  // Check for exact route match
  if (routes[req.method] && routes[req.method][req.url]) {
    return routes[req.method][req.url](req, res);
  }

  // Handle dynamic routes (e.g., GET /feedback/:id)
  const feedbackId = extractIdFromUrl(req.url, "/feedback");
  if (req.method === "GET" && feedbackId) {
    return getFeedbackById(req, res, feedbackId);
  }

  // If no matching route
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
