const { executeQuery } = require('../config/database');

class Agent {
  static async findAll() {
    const query = `
      SELECT a.*, f.Domain as domaine_formateur
      FROM Agent a
      LEFT JOIN Formateur f ON a.Matricule = f.matricule
      ORDER BY a.Nom
    `;
    return await executeQuery(query);
  }

  static async findByMatricule(matricule) {
    const query = `
      SELECT a.*, f.Domain as domaine_formateur
      FROM Agent a
      LEFT JOIN Formateur f ON a.Matricule = f.matricule
      WHERE a.Matricule = ?
    `;
    const result = await executeQuery(query, [matricule]);
    return result[0] || null;
  }

  static async create(agentData) {
    const { Matricule, Nom, Fonction, date_d_embauche, Domain } = agentData;
    
    // Check if agent already exists
    const existing = await this.findByMatricule(Matricule);
    if (existing) {
      throw new Error('Agent with this matricule already exists');
    }

    // Create agent
    const insertAgentQuery = `
      INSERT INTO Agent (Matricule, Nom, Fonction, date_d_embauche)
      VALUES (?, ?, ?, ?)
    `;
    await executeQuery(insertAgentQuery, [Matricule, Nom, Fonction, date_d_embauche]);

    // Create formateur entry if Domain is provided
    if (Domain) {
      const insertFormateurQuery = `
        INSERT INTO Formateur (matricule, Domain)
        VALUES (?, ?)
      `;
      await executeQuery(insertFormateurQuery, [Matricule, Domain]);
    }

    return { Matricule, Nom, Fonction, date_d_embauche, Domain };
  }

  static async update(matricule, agentData) {
    const { Nom, Fonction, date_d_embauche, Domain } = agentData;
    
    // Check if agent exists
    const existing = await this.findByMatricule(matricule);
    if (!existing) {
      throw new Error('Agent not found');
    }

    // Update agent
    const updateAgentQuery = `
      UPDATE Agent 
      SET Nom = ?, Fonction = ?, date_d_embauche = ?
      WHERE Matricule = ?
    `;
    await executeQuery(updateAgentQuery, [Nom, Fonction, date_d_embauche, matricule]);

    // Handle formateur status
    const existingFormateur = await executeQuery(
      'SELECT matricule FROM Formateur WHERE matricule = ?',
      [matricule]
    );

    if (Domain) {
      if (existingFormateur.length > 0) {
        await executeQuery(
          'UPDATE Formateur SET Domain = ? WHERE matricule = ?',
          [Domain, matricule]
        );
      } else {
        await executeQuery(
          'INSERT INTO Formateur (matricule, Domain) VALUES (?, ?)',
          [matricule, Domain]
        );
      }
    } else if (existingFormateur.length > 0) {
      await executeQuery(
        'DELETE FROM Formateur WHERE matricule = ?',
        [matricule]
      );
    }

    return true;
  }


static async delete(matricule) {

  const existing = await this.findByMatricule(matricule);
  if (!existing) {
    throw new Error('Agent not found');
  }

  await executeQuery('DELETE FROM Participants WHERE Matricule = ?', [matricule]);

  await executeQuery(
    'UPDATE Sessions_de_Formation SET Matricule_du_formateur = NULL WHERE Matricule_du_formateur = ?',
    [matricule]
  );

  // 3. Delete the corresponding record from the 'Formateur' table.
  await executeQuery('DELETE FROM Formateur WHERE matricule = ?', [matricule]);

  // 4. Now that all dependencies are removed, it's safe to delete the agent.
  await executeQuery('DELETE FROM Agent WHERE Matricule = ?', [matricule]);

  // --- FIX ENDS HERE ---

  return true;
}


  static async findAllFormateurs() {
    const query = `
      SELECT a.Matricule, a.Nom, a.Fonction, a.date_d_embauche, f.Domain
      FROM Agent a
      INNER JOIN Formateur f ON a.Matricule = f.matricule
      ORDER BY a.Nom
    `;
    return await executeQuery(query);
  }
}

module.exports = Agent;
