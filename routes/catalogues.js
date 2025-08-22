const express = require("express");
const router = express.Router();
const catalogueController = require("../controllers/catalogueController");
const { validateCatalogue } = require("../middleware/validation");

// Get all catalogues
router.get("/", catalogueController.getAllCatalogues);

// Get a single catalogue by ID
router.get("/:id", catalogueController.getCatalogueById);

// Create a new catalogue
router.post("/", validateCatalogue, catalogueController.createCatalogue);

// Update a catalogue by ID
router.put("/:id", validateCatalogue, catalogueController.updateCatalogue);

// Delete a catalogue by ID
router.delete("/:id", catalogueController.deleteCatalogue);

// Get competences for a catalogue
router.get("/:id/competences", catalogueController.getCatalogueCompetences);

module.exports = router;
