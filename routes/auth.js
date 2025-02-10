import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const usersFile = "./data/users.json";

// Read users from file

// Read users from file
const readUsers = () => {
  try {
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify([], null, 2)); // Create file if missing
    }
    const data = fs.readFileSync(usersFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
};

// Write users to file
const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Register a new user
const register = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const { username, password, email } = JSON.parse(body);
    const users = readUsers();

    // Check if user exists
    if (users.some((user) => user.email === email)) {
      res.writeHead(400);
      return res.end(
        JSON.stringify({ error: "An account with this email already exists" })
      );
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    writeUsers(users);

    res.writeHead(201);
    res.end(JSON.stringify({ message: "User registered successfully" }));
  });
};

// Login a user
const login = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const { email, password } = JSON.parse(body);
      if (!email || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ error: "Email and password are required" })
        );
      }

      const users = readUsers();
      // const user = users.find((u) => u.email === email);
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid email" }));
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Invalid password" }));
      }

      const token = crypto.randomBytes(16).toString("hex");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Login successful", token }));
    } catch (err) {
      console.error("Error parsing request body:", err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request format" }));
    }
  });
};

// Export functions (for ES Modules)
export { register, login };
