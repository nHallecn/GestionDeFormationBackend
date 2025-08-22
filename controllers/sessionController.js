const Session = require('../models/Session');

// Récupérer toutes les sessions de formation
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.findAll();
    res.json({ success: true, data: sessions, count: sessions.length });
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des sessions' });
  }
};

// Récupérer une session par ID
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session de formation non trouvée' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    console.error(`Erreur lors de la récupération de la session ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la session' });
  }
};

// Créer une nouvelle session de formation
const createSession = async (req, res) => {
  try {
    const sessionData = req.body;
    const newSession = await Session.create(sessionData);
    res.status(201).json({ success: true, message: 'Session de formation créée avec succès', data: newSession });
  } catch (error) {
    console.error('❌ [CONTROLLER] CRASH in createSession controller:', error);
    if (error.message === 'Training catalogue not found') return res.status(404).json({ success: false, message: 'Catalogue de formation non trouvé' });
    if (error.message === 'Trainer is required for internal training') return res.status(400).json({ success: false, message: 'Un formateur est requis pour les formations internes' });
    if (error.message === 'Cabinet is required for external training') return res.status(400).json({ success: false, message: 'Un cabinet est requis pour les formations externes' });
    res.status(500).json({ success: false, message: 'Erreur lors de la création de la session' });
  }
};

// Mettre à jour une session de formation
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionData = req.body;
    await Session.update(id, sessionData);
    res.json({ success: true, message: 'Session de formation mise à jour avec succès' });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la session ${req.params.id}:`, error);
    if (error.message === 'Session not found') return res.status(404).json({ success: false, message: 'Session de formation non trouvée' });
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la session' });
  }
};

// Supprimer une session de formation
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await Session.delete(id);
    res.json({ success: true, message: 'Session de formation supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur lors de la suppression de la session ${req.params.id}:`, error);
    if (error.message === 'Session not found') return res.status(404).json({ success: false, message: 'Session de formation non trouvée' });
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la session' });
  }
};

// --- CORRECTED FUNCTION ---
// Récupérer les participants d'une session
const getSessionParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const participants = await Session.getParticipants(id);
    res.json({ success: true, data: participants, count: participants.length });
  } catch (error) {
    // ADDED DETAILED LOGGING TO CATCH THE REAL ERROR
    console.error('--- CRASH in getSessionParticipants ---');
    console.error('Failed to get participants for session ID:', req.params.id);
    console.error('Error Message:', error.message);
    console.error('Full Error Object:', error); // This will show the database error code and stack trace
    console.error('--- END CRASH REPORT ---');
    
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des participants' });
  }
};

// Ajouter un participant à une session
const addParticipantToSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule } = req.body;
    await Session.addParticipant(id, matricule);
    res.status(201).json({ success: true, message: 'Participant ajouté avec succès à la session' });
  } catch (error) {
    console.error(`Erreur lors de l'ajout du participant ${req.body.matricule} à la session ${req.params.id}:`, error);
    if (error.message === 'Session not found') return res.status(404).json({ success: false, message: 'Session de formation non trouvée' });
    if (error.message === 'Agent not found') return res.status(404).json({ success: false, message: 'Agent non trouvé' });
    if (error.message === 'Participant is already enrolled in this session') return res.status(409).json({ success: false, message: 'Ce participant est déjà inscrit à cette session' });
    res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout du participant' });
  }
};

// Supprimer un participant d'une session
const removeParticipantFromSession = async (req, res) => {
  try {
    const { id, matricule } = req.params;
    await Session.removeParticipant(id, matricule);
    res.json({ success: true, message: 'Participant retiré avec succès de la session' });
  } catch (error) {
    console.error(`Erreur lors de la suppression du participant ${req.params.matricule} de la session ${req.params.id}:`, error);
    if (error.message === 'Participant not found in this session') return res.status(404).json({ success: false, message: 'Participant non trouvé dans cette session' });
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du participant' });
  }
};

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getSessionParticipants,
  addParticipantToSession,
  removeParticipantFromSession
};
