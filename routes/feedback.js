import fs from "fs";
import { checkAuthorization } from "./auth.js";
const feedbackPath = "./data/feedbacks.json";
import { readUsers } from "./auth.js";

export const Status = {
  PLANNED: "Planned",
  IN_PROGRESS: "InProgress",
  LIVE: "Live",
};

// read feedback from file
export const readFeedbacks = () => {
  try {
    if (!fs.existsSync(feedbackPath)) {
      fs.writeFileSync(feedbackPath, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(feedbackPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error getting feedback", err);
    return [];
  }
};

// get feedbacks
export const getFeedbacks = (category, sort) => {
  try {
    let feedbacks = readFeedbacks();

    // Filter by category if provided
    if (category && category !== "all") {
      feedbacks = feedbacks.filter((fb) => fb.category === category);
    }

    // Sorting logic
    if (sort) {
      switch (sort) {
        case "most-upvotes":
          feedbacks.sort((a, b) => b.upvotes - a.upvotes);
          break;
        case "least-upvotes":
          feedbacks.sort((a, b) => a.upvotes - b.upvotes);
          break;
        case "most-comments":
          feedbacks.sort(
            (a, b) => (b.comments?.length || 0) - (a.comments?.length || 0)
          );
          break;
        case "least-comments":
          feedbacks.sort(
            (a, b) => (a.comments?.length || 0) - (b.comments?.length || 0)
          );
          break;
        case "all":
          // No sorting - return in original order
          break;
        default:
          // Default sort by most upvotes
          feedbacks.sort((a, b) => b.upvotes - a.upvotes);
      }
    }

    return feedbacks;
  } catch (err) {
    console.error("Error processing feedback", err);
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
        upvotes: 0,
        status: Status.PLANNED,
        comments: [],
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

// update feedback
export const updateFeedback = (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const parsedBody = JSON.parse(body);

      if (!parsedBody.title || !parsedBody.category || !parsedBody.detail) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "All fields are required" }));
      }
      // Extract feedback ID from URL
      const id = req.url.split("/").pop(); // Extract ID from URL

      // Read existing feedbacks
      const feedbacks = readFeedbacks();

      // Find the feedback to update
      const feedbackIndex = feedbacks.findIndex(
        (feedback) => feedback.id.toString() === id
      );

      if (feedbackIndex === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Feedback not found" }));
      }

      // Update the feedback
      feedbacks[feedbackIndex] = {
        ...feedbacks[feedbackIndex],
        ...parsedBody,
      };

      // Write the updated feedback list back to the file
      writeFeedbacks(feedbacks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Feedback updated successfully",
          feedback: feedbacks[feedbackIndex],
        })
      );
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};

// get feedback by id
export const getFeedbackById = (req, res, id) => {
  const feedbacks = readFeedbacks(); // Read existing feedbacks

  const feedback = feedbacks.find((fb) => fb.id.toString() === id.toString());

  if (!feedback) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Feedback not found" }));
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ feedback }));
};

// upvote feedback
export const upvoteFeedback = (req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { id, userId } = JSON.parse(body); // Get feedback ID and user ID

      if (!id || !userId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "ID and user ID are required" })
        );
      }

      const feedbacks = readFeedbacks();
      const feedback = feedbacks.find(
        (fb) => fb.id.toString() === id.toString()
      );

      if (!feedback) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Feedback not found" }));
      }

      // Initialize upvotedBy if it doesn't exist
      if (!feedback.upvotedBy) {
        feedback.upvotedBy = [];
      }

      const userIndex = feedback.upvotedBy.indexOf(userId);

      if (userIndex === -1) {
        // User hasn't voted yet - add upvote
        feedback.upvotedBy.push(userId);
        feedback.upvotes = (feedback.upvotes || 0) + 1;
      } else {
        // User has already voted - remove upvote
        feedback.upvotedBy.splice(userIndex, 1);
        feedback.upvotes = Math.max(0, (feedback.upvotes || 0) - 1);
      }

      writeFeedbacks(feedbacks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Feedback upvoted successfully!",
          feedback,
          hasUpvoted: userIndex === -1, // Returns true if user just upvoted, false if removed
        })
      );
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};

// comment on a feedback
export const addComment = (req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { id, userId, text, username, email } = JSON.parse(body);

      if ((!id || !userId || !text || !username, !email)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "ID, User ID, and Text are required" })
        );
      }

      const feedbacks = readFeedbacks();
      const feedback = feedbacks.find(
        (fb) => fb.id.toString() === id.toString()
      );

      if (!feedback) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Feedback not found" }));
      }

      // Fetch user details
      const users = readUsers(); // Assuming users are stored in `users.json`
      const user = users.find((u) => u.id === userId);

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
      }

      // Ensure comments array exists
      if (!Array.isArray(feedback.comments)) {
        feedback.comments = [];
      }

      // Create new comment with username and email
      const newComment = {
        id: Date.now().toString(),
        userId,
        username: user.username,
        email: user.email,
        text,
        createdAt: new Date().toISOString(),
        replies: [],
      };

      feedback.comments.push(newComment);
      writeFeedbacks(feedbacks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Comment added", feedback }));
    } catch (err) {
      console.error("Error parsing request body:", err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};

// reply to a comment on a feedback
export const addReply = (req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { feedbackId, commentId, userId, text, username, email } =
        JSON.parse(body);

      if (
        (!feedbackId || !commentId || !userId || !text || !username, !email)
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "All fields are required" }));
      }

      const feedbacks = readFeedbacks();
      const feedback = feedbacks.find(
        (fb) => fb.id.toString() === feedbackId.toString()
      );

      if (!feedback) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Feedback not found" }));
      }

      const comment = feedback.comments.find((c) => c.id === commentId);
      if (!comment) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Comment not found" }));
      }

      // Fetch user details
      const users = readUsers(); // Fetch users
      const user = users.find((u) => u.id === userId);

      if (!user) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
      }

      // Create new reply with username and email
      const newReply = {
        id: Date.now().toString(),
        userId,
        username: user.username,
        email: user.email,
        text,
        createdAt: new Date().toISOString(),
      };

      comment.replies.push(newReply);
      writeFeedbacks(feedbacks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Reply added", feedback }));
    } catch (err) {
      console.error("Error parsing request body:", err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};

// update feedback status
export const updateFeedbackStatus = (req, res) => {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    try {
      const { id, status } = JSON.parse(body);

      if (!id || !status) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "ID and status are required" }));
      }

      const validStatuses = Object.values(Status);
      if (!validStatuses.includes(status)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid status value" }));
      }

      const feedbacks = readFeedbacks();
      const feedback = feedbacks.find(
        (fb) => fb.id.toString() === id.toString()
      );

      if (!feedback) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Feedback not found" }));
      }

      feedback.status = status; // Update status
      writeFeedbacks(feedbacks);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Feedback status updated", feedback }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to parse request body" }));
    }
  });
};

//feedback count
export const getFeedbackStatusCount = (req, res) => {
  const feedbacks = readFeedbacks();

  const statusCount = [
    {
      name: "Planned",
      count: feedbacks.filter((fb) => fb.status === Status.PLANNED).length,
    },
    {
      name: "InProgress",
      count: feedbacks.filter((fb) => fb.status === Status.IN_PROGRESS).length,
    },
    {
      name: "Live",
      count: feedbacks.filter((fb) => fb.status === Status.LIVE).length,
    },
  ];

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ statusCount }));
};
