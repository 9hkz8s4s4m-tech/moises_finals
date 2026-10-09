const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const Student = require("./models/Student");

const app = express();
app.use(cors());
app.use(express.json());

let connectionPromise;

function isMongoUriConfigured() {
  return /^mongodb(?:\+srv)?:\/\/[^/]+/.test(process.env.MONGO_URI || "");
}

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!isMongoUriConfigured()) {
    throw new Error("MONGO_URI is missing or invalid. Set it in the server environment.");
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => console.log("MongoDB Connected"))
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }
  return connectionPromise;
}

app.get("/", (req, res) => {
  res.json({
    message: "Student Management API is running",
    endpoints: ["/students", "/health"]
  });
});

app.get("/health", async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      status: "ok",
      database: "connected",
      mongoUriConfigured: true
    });
  } catch (error) {
    console.error("MongoDB health check failed:", error);
    res.status(503).json({
      status: "database unavailable",
      database: "disconnected",
      mongoUriConfigured: isMongoUriConfigured()
    });
  }
});

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(503).json({ message: "Database unavailable" });
  }
});

app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students" });
  }
});

app.post("/students", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Error adding student" });
  }
});

app.put("/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Error updating student" });
  }
});

app.delete("/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student" });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`API status: http://localhost:${port}/health`);
  });
}

module.exports = app;
