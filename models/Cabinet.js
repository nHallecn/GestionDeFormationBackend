const { executeQuery } = require('../config/database');

class Cabinet {
  static async findAll() {
    const query = `
      SELECT c.*, 
             COUNT(s.Code_de_Session) as nombre_sessions
      FROM Cabinet c
      LEFT JOIN Sessions_de_Formation s ON c.ID_de_cabinet = s.ID_du_cabinet
      GROUP BY c.ID_de_cabinet
      ORDER BY c.Nom
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const cabinetQuery = `
      SELECT * FROM Cabinet WHERE ID_de_cabinet = ?
    `;
    const result = await executeQuery(cabinetQuery, [id]);

    if (result.length === 0) {
      return null;
    }

    // Get associated sessions
    const sessionsQuery = `
      SELECT 
        s.Code_de_Session,
        s.Date_de_Debut,
        s.Date_de_Fin,
        s.statut,
        c.Nom as nom_formation
      FROM Sessions_de_Formation s
      INNER JOIN Catalogue_de_Formation c ON s.ID_de_catalogue = c.ID_de_catalogue
      WHERE s.ID_du_cabinet = ?
      ORDER BY s.Date_de_Debut DESC
    `;
    const sessions = await executeQuery(sessionsQuery, [id]);

    return {
      ...result[0],
      sessions: sessions
    };
  }

  static async create(cabinetData) {
    const { Nom, telephone, Emplacement } = cabinetData;

    // Check if cabinet with same name already exists
    const existingCabinet = await executeQuery(
      'SELECT ID_de_cabinet FROM Cabinet WHERE Nom = ?',
      [Nom]
    );

    if (existingCabinet.length > 0) {
      throw new Error('A cabinet with this name already exists');
    }

    // Create cabinet
    const insertQuery = `
      INSERT INTO Cabinet (Nom, telephone, Emplacement)
      VALUES (?, ?, ?)
    `;
    const result = await executeQuery(insertQuery, [Nom, telephone, Emplacement]);

    return { 
      ID_de_cabinet: result.insertId, 
      Nom, 
      telephone, 
      Emplacement 
    };
  }

  static async update(id, cabinetData) {
    const { Nom, telephone, Emplacement } = cabinetData;

    // Check if cabinet exists
    const existingCabinet = await executeQuery(
      'SELECT ID_de_cabinet FROM Cabinet WHERE ID_de_cabinet = ?',
      [id]
    );

    if (existingCabinet.length === 0) {
      throw new Error('Cabinet not found');
    }

    // Check if another cabinet with same name exists
    const duplicateCabinet = await executeQuery(
      'SELECT ID_de_cabinet FROM Cabinet WHERE Nom = ? AND ID_de_cabinet != ?',
      [Nom, id]
    );

    if (duplicateCabinet.length > 0) {
      throw new Error('Another cabinet with this name already exists');
    }

    // Update cabinet
    const updateQuery = `
      UPDATE Cabinet 
      SET Nom = ?, telephone = ?, Emplacement = ?
      WHERE ID_de_cabinet = ?
    `;
    await executeQuery(updateQuery, [Nom, telephone, Emplacement, id]);

    return true;
  }

  static async delete(id) {
    // Check if cabinet exists
    const existingCabinet = await executeQuery(
      'SELECT ID_de_cabinet FROM Cabinet WHERE ID_de_cabinet = ?',
      [id]
    );

    if (existingCabinet.length === 0) {
      throw new Error('Cabinet not found');
    }

    // Check if there are associated sessions
    const sessions = await executeQuery(
      'SELECT Code_de_Session FROM Sessions_de_Formation WHERE ID_du_cabinet = ?',
      [id]
    );

    if (sessions.length > 0) {
      throw new Error('Cannot delete this cabinet as it is used in training sessions');
    }

    // Delete cabinet
    await executeQuery('DELETE FROM Cabinet WHERE ID_de_cabinet = ?', [id]);
    return true;
  }

  static async getSessions(id) {
    const query = `
      SELECT 
        s.*,
        c.Nom as nom_formation,
        c.Categorie as categorie_formation,
        COUNT(p.Matricule) as nombre_participants
      FROM Sessions_de_Formation s
      INNER JOIN Catalogue_de_Formation c ON s.ID_de_catalogue = c.ID_de_catalogue
      LEFT JOIN Participants p ON s.Code_de_Session = p.Code_de_Session
      WHERE s.ID_du_cabinet = ?
      GROUP BY s.Code_de_Session
      ORDER BY s.Date_de_Debut DESC
    `;
    return await executeQuery(query, [id]);
  }
}

module.exports = Cabinet;
