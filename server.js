const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, createTables } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const agentRoutes = require("./routes/agents");
const catalogueRoutes = require("./routes/catalogues");
const sessionRoutes = require("./routes/sessions");
const presenceRoutes = require("./routes/presences");
const evaluationRoutes = require("./routes/evaluations");
const cabinetRoutes = require("./routes/cabinets");
const competenceRoutes = require("./routes/competences");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Camrail Training is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API Routes
 app.use("/api/agents", agentRoutes);
 app.use("/api/catalogues", catalogueRoutes);
 app.use("/api/sessions", sessionRoutes);
 app.use("/api/presences", presenceRoutes);
 app.use("/api/evaluations", evaluationRoutes);
 app.use("/api/cabinets", cabinetRoutes);
app.use("/api/competences", competenceRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenue sur l'API de Gestion de Formation Camrail",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      agents: "/api/agents",
      catalogues: "/api/catalogues",
      sessions: "/api/sessions",
      presences: "/api/presences",
      evaluations: "/api/evaluations",
      cabinets: "/api/cabinets",
      competences: "/api/competences"
    }
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint non trouvé"
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🚀 Démarrage du serveur...");
    
    // Test database connection
    await testConnection();
    
    // Create tables if they don't exist
    await createTables();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 API accessible sur http://localhost:${PORT}` );
      console.log(`📊 Health check: http://localhost:${PORT}/api/health` );
      console.log(`📚 Documentation: http://localhost:${PORT}/api` );
      
      if (process.env.NODE_ENV === "development") {
        console.log("🔧 Mode développement activé");
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Arrêt du serveur...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Arrêt du serveur...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
