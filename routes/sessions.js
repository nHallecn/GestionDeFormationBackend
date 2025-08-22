const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { validateSession } = require("../middleware/validation");

// Get all sessions
router.get("/", sessionController.getAllSessions);

// ✅ Move these up BEFORE `/:id`
router.get("/:id/participants", sessionController.getSessionParticipants);
router.post("/:id/participants", sessionController.addParticipantToSession);
router.delete("/:id/participants/:matricule", sessionController.removeParticipantFromSession);

// Get a single session by ID
router.get("/:id", sessionController.getSessionById);

// Create a new session
router.post("/", validateSession, sessionController.createSession);

// Update a session by ID
router.put("/:id", validateSession, sessionController.updateSession);

// Delete a session by ID
router.delete("/:id", sessionController.deleteSession);

module.exports = router;
