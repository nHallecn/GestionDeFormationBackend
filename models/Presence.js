const { executeQuery } = require('../config/database');

class Presence {
  static async getSessionPresences(sessionId, date = null) {
    let query = `
      SELECT p.*, a.Nom as nom_participant
      FROM Presence p
      INNER JOIN Agent a ON p.Matricule = a.Matricule
      WHERE p.Code_de_Session = ?
    `;
    let params = [sessionId];

    if (date) {
      query += ' AND p.Date = ?';
      params.push(date);
    }

    query += ' ORDER BY p.Date DESC, a.Nom';

    return await executeQuery(query, params);
  }

  static async getSessionDates(sessionId) {
    // Get session information
    const sessionQuery = `
      SELECT Date_de_Debut, Date_de_Fin
      FROM Sessions_de_Formation
      WHERE Code_de_Session = ?
    `;
    const sessions = await executeQuery(sessionQuery, [sessionId]);

    if (sessions.length === 0) {
      throw new Error('Session not found');
    }

    const { Date_de_Debut, Date_de_Fin } = sessions[0];

    // Generate all dates between start and end (weekdays only)
    const dates = [];
    const startDate = new Date(Date_de_Debut);
    const endDate = new Date(Date_de_Fin);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }

    // Check which dates already have recorded presences
    const presenceQuery = `
      SELECT DISTINCT Date
      FROM Presence
      WHERE Code_de_Session = ?
    `;
    const existingPresences = await executeQuery(presenceQuery, [sessionId]);
    const existingDates = existingPresences.map(p => p.Date.toISOString().split('T')[0]);

    const datesWithStatus = dates.map(date => ({
      date,
      hasPresences: existingDates.includes(date)
    }));

    return {
      dates: datesWithStatus,
      startDate: Date_de_Debut,
      endDate: Date_de_Fin
    };
  }

  static async recordPresences(presences) {
    if (!presences || !Array.isArray(presences) || presences.length === 0) {
      throw new Error('Invalid presence data');
    }

    // Verify all participants belong to the session
    const sessionId = presences[0].Code_de_Session;
    const participantsQuery = `
      SELECT Matricule
      FROM Participants
      WHERE Code_de_Session = ?
    `;
    const validParticipants = await executeQuery(participantsQuery, [sessionId]);
    const validMatricules = validParticipants.map(p => p.Matricule);

    // Process each presence
    for (const presence of presences) {
      const { Code_de_Session, Matricule, Date, statut } = presence;

      // Verify participant belongs to session
      if (!validMatricules.includes(Matricule)) {
        continue; // Skip invalid participants
      }

      // Check if presence already exists for this date and participant
      const existingPresence = await executeQuery(
        'SELECT * FROM Presence WHERE Code_de_Session = ? AND Matricule = ? AND Date = ?',
        [Code_de_Session, Matricule, Date]
      );

      if (existingPresence.length > 0) {
        // Update existing presence
        await executeQuery(
          'UPDATE Presence SET statut = ? WHERE Code_de_Session = ? AND Matricule = ? AND Date = ?',
          [statut, Code_de_Session, Matricule, Date]
        );
      } else {
        // Create new presence
        await executeQuery(
          'INSERT INTO Presence (Code_de_Session, Matricule, Date, statut) VALUES (?, ?, ?, ?)',
          [Code_de_Session, Matricule, Date, statut]
        );
      }
    }

    return true;
  }

  static async getPresencesByDate(sessionId, date) {
    if (!date) {
      throw new Error('Date is required');
    }

    // Get all participants of the session with their presence status for this date
    const query = `
      SELECT 
        a.Matricule,
        a.Nom,
        a.Fonction,
        COALESCE(p.statut, 'absent') as statut
      FROM Agent a
      INNER JOIN Participants part ON a.Matricule = part.Matricule
      LEFT JOIN Presence p ON a.Matricule = p.Matricule 
        AND p.Code_de_Session = ? 
        AND p.Date = ?
      WHERE part.Code_de_Session = ?
      ORDER BY a.Nom
    `;

    return await executeQuery(query, [sessionId, date, sessionId]);
  }

  static async getParticipantPresenceSummary(sessionId, matricule) {
    // Verify participant belongs to session
    const participantCheck = await executeQuery(
      'SELECT Matricule FROM Participants WHERE Code_de_Session = ? AND Matricule = ?',
      [sessionId, matricule]
    );

    if (participantCheck.length === 0) {
      throw new Error('Participant not found in this session');
    }

    // Get all presences for this participant in this session
    const presencesQuery = `
      SELECT Date, statut
      FROM Presence
      WHERE Code_de_Session = ? AND Matricule = ?
      ORDER BY Date
    `;
    const presences = await executeQuery(presencesQuery, [sessionId, matricule]);

    // Calculate statistics
    const totalDays = presences.length;
    const presentDays = presences.filter(p => p.statut === 'present').length;
    const absentDays = presences.filter(p => p.statut === 'absent').length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays * 100).toFixed(2) : 0;

    return {
      matricule,
      presences,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: parseFloat(attendanceRate)
      }
    };
  }
}

module.exports = Presence;
