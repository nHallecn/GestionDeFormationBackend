const express = require("express");
const router = express.Router();
const presenceController = require("../controllers/presenceController");
const { validatePresence } = require("../middleware/validation");

// Get presences for a session (optional: by date)
router.get("/session/:sessionId", presenceController.getSessionPresences);

// Get all training dates for a session
router.get("/session/:sessionId/dates", presenceController.getSessionDates);

// Get presences by date for a session
router.get("/session/:sessionId/date", presenceController.getPresencesByDate);

// Record presences
router.post("/", validatePresence, presenceController.recordPresences);

// Get participant presence summary for a session
router.get("/session/:sessionId/participant/:matricule", presenceController.getParticipantPresenceSummary);

module.exports = router;
