const express = require("express");
const router = express.Router();
const evaluationController = require("../controllers/evaluationController");
const { validateEvaluation } = require("../middleware/validation");

// Get evaluations for a session
router.get("/session/:sessionId", evaluationController.getSessionEvaluations);

// Get competences to evaluate for a session
router.get("/session/:sessionId/competences", evaluationController.getSessionCompetences);

// Get evaluation matrix for a session
router.get("/session/:sessionId/matrix", evaluationController.getSessionEvaluationMatrix);

// Get participant evaluation summary for a session
router.get("/session/:sessionId/participant/:matricule", evaluationController.getParticipantEvaluationSummary);

// Get all evaluations for a participant (optional: by session)
router.get("/participant/:matricule", evaluationController.getParticipantEvaluations);

// Save evaluations
router.post("/", validateEvaluation, evaluationController.saveEvaluations);

module.exports = router;
