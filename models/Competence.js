const Competence = require('../models/Competence');

// Récupérer toutes les compétences
const getAllCompetences = async (req, res) => {
  try {
    const competences = await Competence.findAll();
    
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

// Récupérer une compétence par ID
const getCompetenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const competence = await Competence.findById(id);
    
    if (!competence) {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: competence
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la compétence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la compétence'
    });
  }
};

// Créer une nouvelle compétence
const createCompetence = async (req, res) => {
  try {
    const competenceData = req.body;
    const newCompetence = await Competence.create(competenceData);
    
    res.status(201).json({
      success: true,
      message: 'Compétence créée avec succès',
      data: newCompetence
    });
  } catch (error) {
    console.error('Erreur lors de la création de la compétence:', error);
    
    if (error.message === 'A competence with this description already exists') {
      return res.status(409).json({
        success: false,
        message: 'Une compétence avec cette description existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la compétence'
    });
  }
};

// Mettre à jour une compétence
const updateCompetence = async (req, res) => {
  try {
    const { id } = req.params;
    const competenceData = req.body;
    
    await Competence.update(id, competenceData);
    
    res.json({
      success: true,
      message: 'Compétence mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la compétence:', error);
    
    if (error.message === 'Competence not found') {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    if (error.message === 'Another competence with this description already exists') {
      return res.status(409).json({
        success: false,
        message: 'Une autre compétence avec cette description existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la compétence'
    });
  }
};

// Supprimer une compétence
const deleteCompetence = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Competence.delete(id);
    
    res.json({
      success: true,
      message: 'Compétence supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la compétence:', error);
    
    if (error.message === 'Competence not found') {
      return res.status(404).json({
        success: false,
        message: 'Compétence non trouvée'
      });
    }
    
    if (error.message === 'Cannot delete this competence as it is used in training catalogues') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette compétence car elle est utilisée dans des catalogues de formation'
      });
    }
    
    if (error.message === 'Cannot delete this competence as it is used in evaluations') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer cette compétence car elle est utilisée dans des évaluations'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la compétence'
    });
  }
};

// Rechercher des compétences
const searchCompetences = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }
    
    const competences = await Competence.search(q);
    
    res.json({
      success: true,
      data: competences,
      count: competences.length,
      query: q
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de compétences:', error);
    
    if (error.message === 'Search term must contain at least 2 characters') {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de compétences'
    });
  }
};

module.exports = {
  getAllCompetences,
  getCompetenceById,
  createCompetence,
  updateCompetence,
  deleteCompetence,
  searchCompetences
};
