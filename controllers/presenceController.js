const Presence = require('../models/Presence');

// Récupérer les présences d'une session
const getSessionPresences = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.query;
    
    const presences = await Presence.getSessionPresences(sessionId, date);
    
    res.json({
      success: true,
      data: presences,
      count: presences.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des présences'
    });
  }
};

// Récupérer les dates de formation d'une session
const getSessionDates = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const dates = await Presence.getSessionDates(sessionId);
    
    res.json({
      success: true,
      data: dates
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des dates:', error);
    
    if (error.message === 'Session not found') {
      return res.status(404).json({
        success: false,
        message: 'Session non trouvée'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dates'
    });
  }
};

// Enregistrer les présences pour une date donnée
const recordPresences = async (req, res) => {
  try {
    const { presences } = req.body;
    
    await Presence.recordPresences(presences);
    
    res.json({
      success: true,
      message: 'Présences enregistrées avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des présences:', error);
    
    if (error.message === 'Invalid presence data') {
      return res.status(400).json({
        success: false,
        message: 'Données de présence invalides'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des présences'
    });
  }
};

// Récupérer les présences d'une date spécifique avec les participants
const getPresencesByDate = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date } = req.query;
    
    const participants = await Presence.getPresencesByDate(sessionId, date);
    
    res.json({
      success: true,
      data: participants,
      count: participants.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des présences par date:', error);
    
    if (error.message === 'Date is required') {
      return res.status(400).json({
        success: false,
        message: 'Date requise'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des présences'
    });
  }
};

// Récupérer le résumé des présences d'un participant pour une session
const getParticipantPresenceSummary = async (req, res) => {
  try {
    const { sessionId, matricule } = req.params;
    
    const summary = await Presence.getParticipantPresenceSummary(sessionId, matricule);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé de présence:', error);
    
    if (error.message === 'Participant not found in this session') {
      return res.status(404).json({
        success: false,
        message: 'Participant non trouvé dans cette session'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résumé de présence'
    });
  }
};

module.exports = {
  getSessionPresences,
  getSessionDates,
  recordPresences,
  getPresencesByDate,
  getParticipantPresenceSummary
};
