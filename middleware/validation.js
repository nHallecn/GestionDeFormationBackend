const { body, param, query, validationResult } = require("express-validator");

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreurs de validation",
      errors: errors.array(),
    });
  }
  next();
};

// Règles de validation pour les agents
const validateAgent = [
  body("Matricule").notEmpty().withMessage("Le matricule est requis"),
  body("Nom").notEmpty().withMessage("Le nom est requis"),
  body("Fonction").notEmpty().withMessage("La fonction est requise"),
  body("date_d_embauche").isISO8601().withMessage("La date d'embauche doit être une date valide (YYYY-MM-DD)"),
  handleValidationErrors,
];

// Règles de validation pour les catalogues de formation
const validateCatalogue = [
  body("Nom").notEmpty().withMessage("Le nom du catalogue est requis"),
  body("Description").notEmpty().withMessage("La description est requise"),
  body("Objectif_Pedagogique").notEmpty().withMessage("L'objectif pédagogique est requis"),
  body("Prerequis").notEmpty().withMessage("Les prérequis sont requis"),
  body("Categorie").isIn(["certifiant", "non certifiant"]).withMessage("La catégorie doit être 'certifiant' ou 'non certifiant'"),
  handleValidationErrors,
];

// Règles de validation pour les sessions de formation
const validateSession = [
  body("ID_de_catalogue").isInt().withMessage("L'ID du catalogue doit être un entier"),
  body("Date_de_Debut").isISO8601().withMessage("La date de début doit être une date valide (YYYY-MM-DD)"),
  body("Date_de_Fin").isISO8601().withMessage("La date de fin doit être une date valide (YYYY-MM-DD)"),
  body("Type").isIn(["interne", "externe"]).withMessage("Le type doit être 'interne' ou 'externe'"),
  // Conditionnel pour formateur ou cabinet
  body("Matricule_du_formateur").if(body("Type").equals("interne")).notEmpty().withMessage("Le matricule du formateur est requis pour les sessions internes"),
  body("ID_du_cabinet").if(body("Type").equals("externe")).isInt().withMessage("L'ID du cabinet est requis pour les sessions externes"),
  handleValidationErrors,
];

// Règles de validation pour les cabinets
const validateCabinet = [
  body("Nom").notEmpty().withMessage("Le nom du cabinet est requis"),
  body("telephone").notEmpty().withMessage("Le numéro de téléphone est requis"),
  body("Emplacement").notEmpty().withMessage("L'emplacement est requis"),
  handleValidationErrors,
];

// Règles de validation pour les compétences
const validateCompetence = [
  body("Competence_a_Acquerir").notEmpty().withMessage("La compétence est requise"),
  handleValidationErrors,
];

// Règles de validation pour les présences
const validatePresence = [
  body("presences").isArray().withMessage("Les présences doivent être un tableau"),
  body("presences.*.Code_de_Session").isInt().withMessage("Le code de session est requis"),
  body("presences.*.Matricule").notEmpty().withMessage("Le matricule est requis"),
  body("presences.*.Date").isISO8601().withMessage("La date est requise et doit être au format YYYY-MM-DD"),
  body("presences.*.statut").isIn(["present", "absent"]).withMessage("Le statut doit être 'present' ou 'absent'"),
  handleValidationErrors,
];

// Règles de validation pour les évaluations
const validateEvaluation = [
  body("evaluations").isArray().withMessage("Les évaluations doivent être un tableau"),
  body("evaluations.*.code_de_Session").isInt().withMessage("Le code de session est requis"),
  body("evaluations.*.Matricule").notEmpty().withMessage("Le matricule est requis"),
  body("evaluations.*.ID_de_competence").isInt().withMessage("L'ID de compétence est requis"),
  body("evaluations.*.Score").isFloat({ min: 0, max: 20 }).withMessage("Le score doit être un nombre entre 0 et 20"),
  handleValidationErrors,
];

module.exports = {
  validateAgent,
  validateCatalogue,
  validateSession,
  validateCabinet,
  validateCompetence,
  validatePresence,
  validateEvaluation,
  handleValidationErrors,
};
