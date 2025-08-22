const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController");
const { validateAgent } = require("../middleware/validation");

// Get all formateurs (MUST be before /:matricule route)
router.get("/formateurs", agentController.getAllFormateurs);

// Get all agents
router.get("/", agentController.getAllAgents);

// Get a single agent by matricule
router.get("/:matricule", agentController.getAgentByMatricule);

// Create a new agent
router.post("/", validateAgent, agentController.createAgent);

// Update an agent by matricule
router.put("/:matricule", validateAgent, agentController.updateAgent);

// Delete an agent by matricule
router.delete("/:matricule", agentController.deleteAgent);

module.exports = router;
