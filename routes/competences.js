const express = require("express");
const router = express.Router();
const competenceController = require("../controllers/competenceController");
const { validateCompetence } = require("../middleware/validation");

// Search competences (MUST be before /:id route)
router.get("/search", competenceController.searchCompetences);

// Get all competences
router.get("/", competenceController.getAllCompetences);

// Get a single competence by ID
router.get("/:id", competenceController.getCompetenceById);

// Create a new competence
router.post("/", validateCompetence, competenceController.createCompetence);

// Update a competence by ID
router.put("/:id", validateCompetence, competenceController.updateCompetence);

// Delete a competence by ID
router.delete("/:id", competenceController.deleteCompetence);

module.exports = router;
