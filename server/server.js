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
   throw new Error("MONGO_URI is missing or invalid. Set it in server/.env.");
 }
 if (!connectionPromise) {
   connectionPromise = mongoose.connect(process.env.MONGO_URI)
     .then(() => console.log("MongoDB Connected"))
     .catch((err) => {
       connectionPromise = undefined;
       throw err;
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

app.get("/health", (req, res) => {
 const databaseConnected = mongoose.connection.readyState === 1;
 res.status(databaseConnected ? 200 : 503).json({
   status: databaseConnected ? "ok" : "database unavailable",
   database: databaseConnected ? "connected" : "disconnected",
   mongoUriConfigured: isMongoUriConfigured()
 });
});

app.use(async (req, res, next) => {
 try {
   await connectToDatabase();
   next();
 } catch (err) {
   console.error("MongoDB connection failed:", err);
  res.status(503).json({ message: "Database unavailable" });
 }
});

app.get("/students", async (req, res) => {
 try {
   const students = await Student.find();
   res.json(students);
 } catch (err) {
   res.status(500).json({ message: "Error fetching students" });
 }
});

app.post("/students", async (req, res) => {
 try {
   const student = new Student(req.body);
   await student.save();
   res.json(student);
 } catch (err) {
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
 } catch (err) {
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
 } catch (err) {
   res.status(500).json({ message: "Error deleting student" });
 }
});
if (require.main === module) {
 app.listen(process.env.PORT || 5000, () => {
   const port = process.env.PORT || 5000;
   console.log(`Server listening at http://localhost:${port}`);
   console.log(`API status: http://localhost:${port}/health`);
   if (!isMongoUriConfigured()) {
     console.error("MONGO_URI is missing or invalid. Add a valid MongoDB URI to server/.env to use /students.");
   }
 });
}

module.exports = app;