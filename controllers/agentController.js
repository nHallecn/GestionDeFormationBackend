const Agent = require('../models/Agent');

// Récupérer tous les agents
const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.findAll();
    
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des agents'
    });
  }
};

// Récupérer un agent par matricule
const getAgentByMatricule = async (req, res) => {
  try {
    const { matricule } = req.params;
    const agent = await Agent.findByMatricule(matricule);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'agent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'agent'
    });
  }
};

// Créer un nouvel agent
const createAgent = async (req, res) => {
  try {
    const agentData = req.body;
    const newAgent = await Agent.create(agentData);
    
    res.status(201).json({
      success: true,
      message: 'Agent créé avec succès',
      data: newAgent
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'agent:', error);
    
    if (error.message === 'Agent with this matricule already exists') {
      return res.status(409).json({
        success: false,
        message: 'Un agent avec ce matricule existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'agent'
    });
  }
};

// Mettre à jour un agent
const updateAgent = async (req, res) => {
  try {
    const { matricule } = req.params;
    const agentData = req.body;
    
    await Agent.update(matricule, agentData);
    
    res.json({
      success: true,
      message: 'Agent mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'agent:', error);
    
    if (error.message === 'Agent not found') {
      return res.status(404).json({
        success: false,
        message: 'Agent non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'agent'
    });
  }
};

// Supprimer un agent
const deleteAgent = async (req, res) => {
  try {
    const { matricule } = req.params;
    
    await Agent.delete(matricule);
    
    res.json({
      success: true,
      message: 'Agent supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'agent:', error);
    
    if (error.message === 'Agent not found') {
      return res.status(404).json({
        success: false,
        message: 'Agent non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'agent'
    });
  }
};

// Récupérer tous les formateurs
const getAllFormateurs = async (req, res) => {
  try {
    const formateurs = await Agent.findAllFormateurs();
    
    res.json({
      success: true,
      data: formateurs,
      count: formateurs.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des formateurs'
    });
  }
};

module.exports = {
  getAllAgents,
  getAgentByMatricule,
  createAgent,
  updateAgent,
  deleteAgent,
  getAllFormateurs
};
