const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erreur interne du serveur";

  res.status(statusCode).json({
    success: false,
    message: message,
    // Inclure le stack trace en mode développement
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
