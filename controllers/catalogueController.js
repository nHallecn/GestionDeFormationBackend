// In controllers/catalogueController.js - REPLACE the content of this file

const Catalogue = require('../models/Catalogue');

const getAllCatalogues = async (req, res) => {
  try {
    const catalogues = await Catalogue.findAll();
    res.json({ success: true, data: catalogues, count: catalogues.length });
  } catch (error) {
    console.error('Error in getAllCatalogues:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des catalogues' });
  }
};

const getCatalogueById = async (req, res) => {
  try {
    const { id } = req.params;
    const catalogue = await Catalogue.findById(id);
    if (!catalogue) {
      return res.status(404).json({ success: false, message: 'Catalogue de formation non trouvé' });
    }
    res.json({ success: true, data: catalogue });
  } catch (error) {
    console.error('Error in getCatalogueById:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du catalogue' });
  }
};

const createCatalogue = async (req, res) => {
  try {
    const catalogueData = req.body;
    const newCatalogue = await Catalogue.create(catalogueData);
    res.status(201).json({ success: true, message: 'Catalogue de formation créé avec succès', data: newCatalogue });
  } catch (error) {
    console.error('Error in createCatalogue:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du catalogue' });
  }
};

const updateCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const catalogueData = req.body;
    await Catalogue.update(id, catalogueData);
    res.json({ success: true, message: 'Catalogue de formation mis à jour avec succès' });
  } catch (error) {
    console.error('Error in updateCatalogue:', error);
    if (error.message === 'Catalogue not found') {
      return res.status(404).json({ success: false, message: 'Catalogue de formation non trouvé' });
    }
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du catalogue' });
  }
};

const deleteCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    await Catalogue.delete(id);
    res.json({ success: true, message: 'Catalogue de formation supprimé avec succès' });
  } catch (error) {
    console.error('Error in deleteCatalogue:', error);
    if (error.message === 'Catalogue not found') {
      return res.status(404).json({ success: false, message: 'Catalogue de formation non trouvé' });
    }
    if (error.message === 'Cannot delete catalogue as it is used in training sessions') {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer ce catalogue car il est utilisé dans des sessions de formation' });
    }
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du catalogue' });
  }
};

const getCatalogueCompetences = async (req, res) => {
  try {
    const { id } = req.params;
    const competences = await Catalogue.getCompetences(id);
    res.json({ success: true, data: competences, count: competences.length });
  } catch (error) {
    console.error('Error in getCatalogueCompetences:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des compétences' });
  }
};

module.exports = {
  getAllCatalogues,
  getCatalogueById,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
  getCatalogueCompetences
};
