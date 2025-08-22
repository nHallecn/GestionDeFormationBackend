// In models/Catalogue.js - REPLACE the content of this file

const { executeQuery, beginTransaction, commit, rollback } = require('../config/database');

class Catalogue {
  // ... (findAll and findById methods are unchanged and correct)
  static async findAll() {
    const query = `
      SELECT c.*, 
             GROUP_CONCAT(comp.Competence_a_Acquerir SEPARATOR '; ') as competences
      FROM Catalogue_de_Formation c
      LEFT JOIN Competence_de_catalogue cc ON c.ID_de_catalogue = cc.ID_de_catalogue
      LEFT JOIN Competences comp ON cc.ID_de_competence = comp.ID_de_competence
      GROUP BY c.ID_de_catalogue
      ORDER BY c.Nom
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const catalogueQuery = `
      SELECT * FROM Catalogue_de_Formation WHERE ID_de_catalogue = ?
    `;
    const result = await executeQuery(catalogueQuery, [id]);
    
    if (result.length === 0) {
      return null;
    }

    const competencesQuery = `
      SELECT comp.ID_de_competence, comp.Competence_a_Acquerir
      FROM Competences comp
      INNER JOIN Competence_de_catalogue cc ON comp.ID_de_competence = cc.ID_de_competence
      WHERE cc.ID_de_catalogue = ?
    `;
    const competences = await executeQuery(competencesQuery, [id]);

    return {
      ...result[0],
      competences: competences
    };
  }

  // --- COMPLETELY REVISED create METHOD ---
  static async create(catalogueData) {
    const { Nom, Description, Objectif_Pedagogique, Prerequis, Categorie, competences } = catalogueData;

    await beginTransaction();

    try {
      // Step 1: Insert the main catalogue entry
      const insertCatalogueQuery = `
        INSERT INTO Catalogue_de_Formation (Nom, Description, Objectif_Pedagogique, Prerequis, Categorie)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await executeQuery(insertCatalogueQuery, [Nom, Description, Objectif_Pedagogique, Prerequis, Categorie]);
      const catalogueId = result.insertId;

      // Step 2: Process and link each competence
      if (competences && competences.length > 0) {
        for (const comp of competences) {
          const skillText = comp.Competence_a_Acquerir;
          let competenceId;

          // Step 2a: Check if the skill already exists in the main Competences table
          const findCompetenceQuery = 'SELECT ID_de_competence FROM Competences WHERE Competence_a_Acquerir = ?';
          const existingComp = await executeQuery(findCompetenceQuery, [skillText]);

          if (existingComp.length > 0) {
            // If it exists, use its ID
            competenceId = existingComp[0].ID_de_competence;
          } else {
            // If it doesn't exist, create it and get the new ID
            const insertCompetenceQuery = 'INSERT INTO Competences (Competence_a_Acquerir) VALUES (?)';
            const newCompResult = await executeQuery(insertCompetenceQuery, [skillText]);
            competenceId = newCompResult.insertId;
          }

          // Step 2b: Link the catalogue and the competence in the junction table
          const linkQuery = 'INSERT INTO Competence_de_catalogue (ID_de_catalogue, ID_de_competence) VALUES (?, ?)';
          await executeQuery(linkQuery, [catalogueId, competenceId]);
        }
      }

      await commit();
      return { ID_de_catalogue: catalogueId, ...catalogueData };

    } catch (error) {
      await rollback();
      console.error("Transaction failed in Catalogue.create:", error);
      throw error;
    }
  }

  // --- COMPLETELY REVISED update METHOD ---
  static async update(id, catalogueData) {
    const { Nom, Description, Objectif_Pedagogique, Prerequis, Categorie, competences } = catalogueData;

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Catalogue not found');
    }

    await beginTransaction();

    try {
      // Step 1: Update the main catalogue details
      const updateQuery = `
        UPDATE Catalogue_de_Formation 
        SET Nom = ?, Description = ?, Objectif_Pedagogique = ?, Prerequis = ?, Categorie = ?
        WHERE ID_de_catalogue = ?
      `;
      await executeQuery(updateQuery, [Nom, Description, Objectif_Pedagogique, Prerequis, Categorie, id]);

      // Step 2: Clear old associations
      await executeQuery('DELETE FROM Competence_de_catalogue WHERE ID_de_catalogue = ?', [id]);

      // Step 3: Process and link each new competence (same logic as create)
      if (competences && competences.length > 0) {
        for (const comp of competences) {
          const skillText = comp.Competence_a_Acquerir;
          let competenceId;

          const findCompetenceQuery = 'SELECT ID_de_competence FROM Competences WHERE Competence_a_Acquerir = ?';
          const existingComp = await executeQuery(findCompetenceQuery, [skillText]);

          if (existingComp.length > 0) {
            competenceId = existingComp[0].ID_de_competence;
          } else {
            const insertCompetenceQuery = 'INSERT INTO Competences (Competence_a_Acquerir) VALUES (?)';
            const newCompResult = await executeQuery(insertCompetenceQuery, [skillText]);
            competenceId = newCompResult.insertId;
          }

          const linkQuery = 'INSERT INTO Competence_de_catalogue (ID_de_catalogue, ID_de_competence) VALUES (?, ?)';
          await executeQuery(linkQuery, [id, competenceId]);
        }
      }

      await commit();
      return true;

    } catch (error) {
      await rollback();
      console.error("Transaction failed in Catalogue.update:", error);
      throw error;
    }
  }

  // ... (delete and getCompetences methods are unchanged and correct)
  static async delete(id) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Catalogue not found');
    }

    const sessions = await executeQuery('SELECT Code_de_Session FROM Sessions_de_Formation WHERE ID_de_catalogue = ?', [id]);
    if (sessions.length > 0) {
      throw new Error('Cannot delete catalogue as it is used in training sessions');
    }

    await beginTransaction();
    try {
        await executeQuery('DELETE FROM Competence_de_catalogue WHERE ID_de_catalogue = ?', [id]);
        await executeQuery('DELETE FROM Catalogue_de_Formation WHERE ID_de_catalogue = ?', [id]);
        await commit();
        return true;
    } catch (error) {
        await rollback();
        throw error;
    }
  }

  static async getCompetences(id) {
    const query = `
      SELECT comp.ID_de_competence, comp.Competence_a_Acquerir
      FROM Competences comp
      INNER JOIN Competence_de_catalogue cc ON comp.ID_de_competence = cc.ID_de_competence
      WHERE cc.ID_de_catalogue = ?
      ORDER BY comp.Competence_a_Acquerir
    `;
    return await executeQuery(query, [id]);
  }
}

module.exports = Catalogue;
