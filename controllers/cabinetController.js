const Cabinet = require('../models/Cabinet');

// Récupérer tous les cabinets
const getAllCabinets = async (req, res) => {
  try {
    const cabinets = await Cabinet.findAll();
    
    res.json({
      success: true,
      data: cabinets,
      count: cabinets.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des cabinets:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des cabinets'
    });
  }
};

// Récupérer un cabinet par ID
const getCabinetById = async (req, res) => {
  try {
    const { id } = req.params;
    const cabinet = await Cabinet.findById(id);
    
    if (!cabinet) {
      return res.status(404).json({
        success: false,
        message: 'Cabinet non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: cabinet
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du cabinet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du cabinet'
    });
  }
};

// Créer un nouveau cabinet
const createCabinet = async (req, res) => {
  try {
    const cabinetData = req.body;
    const newCabinet = await Cabinet.create(cabinetData);
    
    res.status(201).json({
      success: true,
      message: 'Cabinet créé avec succès',
      data: newCabinet
    });
  } catch (error) {
    console.error('Erreur lors de la création du cabinet:', error);
    
    if (error.message === 'A cabinet with this name already exists') {
      return res.status(409).json({
        success: false,
        message: 'Un cabinet avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du cabinet'
    });
  }
};

// Mettre à jour un cabinet
const updateCabinet = async (req, res) => {
  try {
    const { id } = req.params;
    const cabinetData = req.body;
    
    await Cabinet.update(id, cabinetData);
    
    res.json({
      success: true,
      message: 'Cabinet mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du cabinet:', error);
    
    if (error.message === 'Cabinet not found') {
      return res.status(404).json({
        success: false,
        message: 'Cabinet non trouvé'
      });
    }
    
    if (error.message === 'Another cabinet with this name already exists') {
      return res.status(409).json({
        success: false,
        message: 'Un autre cabinet avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du cabinet'
    });
  }
};

// Supprimer un cabinet
const deleteCabinet = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Cabinet.delete(id);
    
    res.json({
      success: true,
      message: 'Cabinet supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du cabinet:', error);
    
    if (error.message === 'Cabinet not found') {
      return res.status(404).json({
        success: false,
        message: 'Cabinet non trouvé'
      });
    }
    
    if (error.message === 'Cannot delete this cabinet as it is used in training sessions') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce cabinet car il est utilisé dans des sessions de formation'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du cabinet'
    });
  }
};

// Récupérer les sessions d'un cabinet
const getCabinetSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await Cabinet.getSessions(id);
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions du cabinet:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sessions'
    });
  }
};

module.exports = {
  getAllCabinets,
  getCabinetById,
  createCabinet,
  updateCabinet,
  deleteCabinet,
  getCabinetSessions
};
