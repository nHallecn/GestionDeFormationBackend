// In models/Session.js - REPLACE the content of this file

const { executeQuery, beginTransaction, commit, rollback } = require('../config/database');

class Session {
  static async findAll() {
    const query = `
      SELECT 
        s.*, 
        c.Nom as nom_formation,
        c.Categorie as categorie_formation,
        a.Nom as nom_formateur,
        cab.Nom as nom_cabinet,
        COUNT(p.Matricule) as nombre_participants
      FROM Sessions_de_Formation AS s
      INNER JOIN Catalogue_de_Formation AS c ON s.ID_de_catalogue = c.ID_de_catalogue
      LEFT JOIN Agent AS a ON s.Matricule_du_formateur = a.Matricule
      LEFT JOIN Cabinet AS cab ON s.ID_du_cabinet = cab.ID_de_cabinet
      LEFT JOIN Participants AS p ON s.Code_de_Session = p.Code_de_Session
      GROUP BY s.Code_de_Session
      ORDER BY s.Date_de_Debut DESC
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const sessionQuery = `
      SELECT 
        s.*, 
        c.Nom as nom_formation,
        c.Description as description_formation,
        c.Objectif_Pedagogique as objectif_formation,
        c.Categorie as categorie_formation,
        a.Nom as nom_formateur,
        cab.Nom as nom_cabinet,
        cab.telephone as telephone_cabinet,
        cab.Emplacement as emplacement_cabinet
      FROM Sessions_de_Formation AS s
      INNER JOIN Catalogue_de_Formation AS c ON s.ID_de_catalogue = c.ID_de_catalogue
      LEFT JOIN Agent AS a ON s.Matricule_du_formateur = a.Matricule
      LEFT JOIN Cabinet AS cab ON s.ID_du_cabinet = cab.ID_de_cabinet
      WHERE s.Code_de_Session = ?
    `;
    const result = await executeQuery(sessionQuery, [id]);

    if (result.length === 0) {
      return null;
    }

    const session = result[0];
    session.participants = await this.getParticipants(id);
    
    return session;
  }

  static async create(sessionData) {
    let { ID_de_catalogue, Date_de_Debut, Date_de_Fin, Type, statut = 'encours', ID_du_cabinet, Matricule_du_formateur, participants = [] } = sessionData;

    const catalogue = await executeQuery('SELECT ID_de_catalogue FROM Catalogue_de_Formation WHERE ID_de_catalogue = ?', [ID_de_catalogue]);
    if (catalogue.length === 0) throw new Error('Training catalogue not found');

    if (Type === 'interne') {
      if (!Matricule_du_formateur) throw new Error('Trainer is required for internal training');
      ID_du_cabinet = null;
    } else if (Type === 'externe') {
      if (!ID_du_cabinet) throw new Error('Cabinet is required for external training');
      Matricule_du_formateur = null;
    } else {
      throw new Error(`Invalid session type provided: ${Type}`);
    }

    const insertSessionQuery = `
      INSERT INTO Sessions_de_Formation (ID_de_catalogue, Date_de_Debut, Date_de_Fin, Type, statut, ID_du_cabinet, Matricule_du_formateur)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(insertSessionQuery, [ID_de_catalogue, Date_de_Debut, Date_de_Fin, Type, statut, ID_du_cabinet, Matricule_du_formateur]);
    const sessionId = result.insertId;

    if (participants && participants.length > 0) {
      for (const matricule of participants) {
        await this.addParticipant(sessionId, matricule).catch(err => {
            if (err.message !== 'Participant is already enrolled in this session') {
                console.warn(`Could not add participant ${matricule} during session creation: ${err.message}`);
            }
        });
      }
    }
    return { Code_de_Session: sessionId, ...sessionData };
  }

  static async update(id, sessionData) {
    const { Date_de_Debut, Date_de_Fin, Type, statut, ID_du_cabinet, Matricule_du_formateur } = sessionData;
    const existing = await this.findById(id);
    if (!existing) throw new Error('Session not found');

    const updateQuery = `
      UPDATE Sessions_de_Formation SET Date_de_Debut = ?, Date_de_Fin = ?, Type = ?, statut = ?, ID_du_cabinet = ?, Matricule_du_formateur = ?
      WHERE Code_de_Session = ?
    `;
    await executeQuery(updateQuery, [Date_de_Debut, Date_de_Fin, Type, statut, ID_du_cabinet, Matricule_du_formateur, id]);
    return true;
  }

  // --- REVISED AND CORRECTED delete METHOD ---
  static async delete(id) {
    // First, check if the session even exists to provide a clear error message.
    const existing = await executeQuery('SELECT Code_de_Session FROM Sessions_de_Formation WHERE Code_de_Session = ?', [id]);
    if (existing.length === 0) {
      throw new Error('Session not found');
    }

    // A transaction ensures that if any step fails, all previous steps are undone.
    await beginTransaction();

    try {
      // Step 1: Delete all evaluation records for this session.
      await executeQuery('DELETE FROM Evaluation WHERE code_de_Session = ?', [id]);

      // Step 2: Delete all presence records for this session.
      await executeQuery('DELETE FROM Presence WHERE Code_de_Session = ?', [id]);

      // Step 3: Delete all participant enrollment records for this session.
      await executeQuery('DELETE FROM Participants WHERE Code_de_Session = ?', [id]);

      // Step 4: Now that all child records are gone, delete the parent session record.
      await executeQuery('DELETE FROM Sessions_de_Formation WHERE Code_de_Session = ?', [id]);

      // If all deletes were successful, commit the transaction.
      await commit();
      return true;

    } catch (error) {
      // If any query fails, roll back the entire transaction.
      await rollback();
      console.error(`Transaction failed for deleting session ${id}:`, error);
      // Re-throw a generic error so the controller can handle it.
      throw new Error('Database error during session deletion.');
    }
  }

  static async getParticipants(sessionId) {
    const query = `
      SELECT 
        a.Matricule, 
        a.Nom, 
        a.Fonction, 
        a.date_d_embauche
      FROM Agent AS a
      INNER JOIN Participants AS p ON a.Matricule = p.Matricule
      WHERE p.Code_de_Session = ?
      ORDER BY a.Nom
    `;
    return await executeQuery(query, [sessionId]);
  }
  
  static async addParticipant(sessionId, matricule) {
    const session = await executeQuery('SELECT Code_de_Session FROM Sessions_de_Formation WHERE Code_de_Session = ?', [sessionId]);
    if (session.length === 0) throw new Error('Session not found');

    const agent = await executeQuery('SELECT Matricule FROM Agent WHERE Matricule = ?', [matricule]);
    if (agent.length === 0) throw new Error('Agent not found');

    const existingParticipant = await executeQuery('SELECT Matricule FROM Participants WHERE Matricule = ? AND Code_de_Session = ?', [matricule, sessionId]);
    if (existingParticipant.length > 0) throw new Error('Participant is already enrolled in this session');

    await executeQuery('INSERT INTO Participants (Matricule, Code_de_Session) VALUES (?, ?)', [matricule, sessionId]);
    return true;
  }

  static async removeParticipant(sessionId, matricule) {
    const participant = await executeQuery('SELECT Matricule FROM Participants WHERE Matricule = ? AND Code_de_Session = ?', [matricule, sessionId]);
    if (participant.length === 0) throw new Error('Participant not found in this session');

    await executeQuery('DELETE FROM Participants WHERE Matricule = ? AND Code_de_Session = ?', [matricule, sessionId]);
    return true;
  }
}

module.exports = Session;
