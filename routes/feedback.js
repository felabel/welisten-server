import fs from "fs";
import { checkAuthorization } from "./auth.js";
const feedbackPath = "./data/feedbacks.json";

// read feedback from file
export const readFeedbacks = () => {
  try {
    if (!fs.existsSync(feedbackPath)) {
      fs.writeFileSync(feedbackPath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(feedbackPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro getting feedback", err);
    return [];
  }
};

// write feedbaks to file

const writeFeedbacks = (feedbacks) => {
  try {
    fs.writeFileSync(feedbackPath, JSON.stringify(feedbacks, null, 2));
  } catch (err) {
    console.err("Error writing feedbacks file", err);
  }
};

// handle creating feedback

export const createFeedback = (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { title, category, detail } = JSON.parse(body);
      if (!title || !category || !detail) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "All fields are required" }));
      }

      //   extract user info fom token
      const { isValid, user } = checkAuthorization(req);
      if (!isValid || !user) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }

      const feedbacks = readFeedbacks();
      const newFeedback = {
        id: `${feedbacks.length + 1}`,
        user: user.email,
        title,
        category,
        detail,
      };
      feedbacks.push(newFeedback);
      writeFeedbacks(feedbacks);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Feedback added successfully",
          feedback: newFeedback,
        })
      );
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};
