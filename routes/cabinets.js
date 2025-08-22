const express = require("express");
const router = express.Router();
const cabinetController = require("../controllers/cabinetController");
const { validateCabinet } = require("../middleware/validation");

// Get all cabinets
router.get("/", cabinetController.getAllCabinets);

// Get a single cabinet by ID
router.get("/:id", cabinetController.getCabinetById);

// Create a new cabinet
router.post("/", validateCabinet, cabinetController.createCabinet);

// Update a cabinet by ID
router.put("/:id", validateCabinet, cabinetController.updateCabinet);

// Delete a cabinet by ID
router.delete("/:id", cabinetController.deleteCabinet);

// Get sessions for a cabinet
router.get("/:id/sessions", cabinetController.getCabinetSessions);

module.exports = router;
