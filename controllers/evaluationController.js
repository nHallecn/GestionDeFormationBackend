const Evaluation = require('../models/Evaluation');

// Récupérer les évaluations d'une session
const getSessionEvaluations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const evaluations = await Evaluation.getSessionEvaluations(sessionId);
    
    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des évaluations'
    });
  }
};

// Récupérer les évaluations d'un participant
const getParticipantEvaluations = async (req, res) => {
  try {
    const { matricule } = req.params;
    const { sessionId } = req.query;
    
    const evaluations = await Evaluation.getParticipantEvaluations(matricule, sessionId);
    
    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations du participant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des évaluations'
    });
  }
};

// Enregistrer ou mettre à jour des évaluations
const saveEvaluations = async (req, res) => {
  try {
    const { evaluations } = req.body;
    
    await Evaluation.saveEvaluations(evaluations);
    
    res.json({
      success: true,
      message: 'Évaluations enregistrées avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des évaluations:', error);
    
    if (error.message === 'Invalid evaluation data') {
      return res.status(400).json({
        success: false,
        message: 'Données d\'évaluation invalides'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des évaluations'
    });
  }
};

// Récupérer le résumé des évaluations d'un participant pour une session
const getParticipantEvaluationSummary = async (req, res) => {
  try {
    const { sessionId, matricule } = req.params;
    
    const summary = await Evaluation.getParticipantEvaluationSummary(sessionId, matricule);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé d\'évaluation:', error);
    
    if (error.message === 'Participant not found in this session') {
      return res.status(404).json({
        success: false,
        message: 'Participant non trouvé dans cette session'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé d\'évaluation'
    });
  }
};

// Récupérer les compétences à évaluer pour une session
const getSessionCompetences = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const competences = await Evaluation.getSessionCompetences(sessionId);
    
    res.json({
      success: true,
      data: competences,
      count: competences.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des compétences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des compétences'
    });
  }
};

// Récupérer la matrice d'évaluation complète d'une session
const getSessionEvaluationMatrix = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const matrix = await Evaluation.getSessionEvaluationMatrix(sessionId);
    
    res.json({
      success: true,
      data: matrix
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la matrice d\'évaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la matrice d\'évaluation'
    });
  }
};

module.exports = {
  getSessionEvaluations,
  getParticipantEvaluations,
  saveEvaluations,
  getParticipantEvaluationSummary,
  getSessionCompetences,
  getSessionEvaluationMatrix
};
