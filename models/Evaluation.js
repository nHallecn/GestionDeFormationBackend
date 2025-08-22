const { executeQuery } = require('../config/database');

class Evaluation {
  static async getSessionEvaluations(sessionId) {
    const query = `
      SELECT 
        e.*,
        a.Nom as nom_participant,
        comp.Competence_a_Acquerir as competence
      FROM Evaluation e
      INNER JOIN Agent a ON e.Matricule = a.Matricule
      INNER JOIN Competences comp ON e.ID_de_competence = comp.ID_de_competence
      WHERE e.code_de_Session = ?
      ORDER BY a.Nom, comp.Competence_a_Acquerir
    `;

    return await executeQuery(query, [sessionId]);
  }

  static async getParticipantEvaluations(matricule, sessionId = null) {
    let query = `
      SELECT 
        e.*,
        comp.Competence_a_Acquerir as competence,
        s.Date_de_Debut,
        s.Date_de_Fin,
        c.Nom as nom_formation
      FROM Evaluation e
      INNER JOIN Competences comp ON e.ID_de_competence = comp.ID_de_competence
      INNER JOIN Sessions_de_Formation s ON e.code_de_Session = s.Code_de_Session
      INNER JOIN Catalogue_de_Formation c ON s.ID_de_catalogue = c.ID_de_catalogue
      WHERE e.Matricule = ?
    `;

    let params = [matricule];

    if (sessionId) {
      query += ' AND e.code_de_Session = ?';
      params.push(sessionId);
    }

    query += ' ORDER BY s.Date_de_Debut DESC, comp.Competence_a_Acquerir';

    return await executeQuery(query, params);
  }

  static async saveEvaluations(evaluations) {
    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      throw new Error('Invalid evaluation data');
    }

    // Verify all participants belong to the session
    const sessionId = evaluations[0].code_de_Session;
    const participantsQuery = `
      SELECT Matricule
      FROM Participants
      WHERE Code_de_Session = ?
    `;
    const validParticipants = await executeQuery(participantsQuery, [sessionId]);
    const validMatricules = validParticipants.map(p => p.Matricule);

    // Get valid competences for the training
    const competencesQuery = `
      SELECT comp.ID_de_competence
      FROM Competences comp
      INNER JOIN Competence_de_catalogue cc ON comp.ID_de_competence = cc.ID_de_competence
      INNER JOIN Sessions_de_Formation s ON cc.ID_de_catalogue = s.ID_de_catalogue
      WHERE s.Code_de_Session = ?
    `;
    const validCompetences = await executeQuery(competencesQuery, [sessionId]);
    const validCompetenceIds = validCompetences.map(c => c.ID_de_competence);

    // Process each evaluation
    for (const evaluation of evaluations) {
      const { code_de_Session, Matricule, ID_de_competence, Score } = evaluation;

      // Verify participant and competence are valid
      if (!validMatricules.includes(Matricule) || !validCompetenceIds.includes(ID_de_competence)) {
        continue; // Skip invalid evaluations
      }

      // Check if evaluation already exists
      const existingEvaluation = await executeQuery(
        'SELECT * FROM Evaluation WHERE code_de_Session = ? AND Matricule = ? AND ID_de_competence = ?',
        [code_de_Session, Matricule, ID_de_competence]
      );

      if (existingEvaluation.length > 0) {
        // Update existing evaluation
        await executeQuery(
          'UPDATE Evaluation SET Score = ? WHERE code_de_Session = ? AND Matricule = ? AND ID_de_competence = ?',
          [Score, code_de_Session, Matricule, ID_de_competence]
        );
      } else {
        // Create new evaluation
        await executeQuery(
          'INSERT INTO Evaluation (code_de_Session, Matricule, ID_de_competence, Score) VALUES (?, ?, ?, ?)',
          [code_de_Session, Matricule, ID_de_competence, Score]
        );
      }
    }

    return true;
  }

  static async getParticipantEvaluationSummary(sessionId, matricule) {
    // Verify participant belongs to session
    const participantCheck = await executeQuery(
      'SELECT Matricule FROM Participants WHERE Code_de_Session = ? AND Matricule = ?',
      [sessionId, matricule]
    );

    if (participantCheck.length === 0) {
      throw new Error('Participant not found in this session');
    }

    // Get participant and training information
    const participantQuery = `
      SELECT 
        a.Matricule,
        a.Nom,
        a.Fonction,
        c.Nom as nom_formation,
        c.Categorie as categorie_formation,
        s.Date_de_Debut,
        s.Date_de_Fin
      FROM Agent a
      CROSS JOIN Sessions_de_Formation s
      INNER JOIN Catalogue_de_Formation c ON s.ID_de_catalogue = c.ID_de_catalogue
      WHERE a.Matricule = ? AND s.Code_de_Session = ?
    `;
    const participantInfo = await executeQuery(participantQuery, [matricule, sessionId]);

    // Get all evaluations for this participant in this session
    const evaluationsQuery = `
      SELECT 
        e.Score,
        comp.Competence_a_Acquerir as competence
      FROM Evaluation e
      INNER JOIN Competences comp ON e.ID_de_competence = comp.ID_de_competence
      WHERE e.code_de_Session = ? AND e.Matricule = ?
      ORDER BY comp.Competence_a_Acquerir
    `;
    const evaluations = await executeQuery(evaluationsQuery, [sessionId, matricule]);

    // Calculate overall average
    const totalScore = evaluations.reduce((sum, evaluation) => sum + parseFloat(evaluation.Score), 0);
    const averageScore = evaluations.length > 0 ? (totalScore / evaluations.length).toFixed(2) : 0;
    const isAdmitted = parseFloat(averageScore) >= 10;

    return {
      participant: participantInfo[0],
      evaluations,
      summary: {
        totalCompetences: evaluations.length,
        averageScore: parseFloat(averageScore),
        isAdmitted,
        admissionThreshold: 10
      }
    };
  }

  static async getSessionCompetences(sessionId) {
    const query = `
      SELECT 
        comp.ID_de_competence,
        comp.Competence_a_Acquerir
      FROM Competences comp
      INNER JOIN Competence_de_catalogue cc ON comp.ID_de_competence = cc.ID_de_competence
      INNER JOIN Sessions_de_Formation s ON cc.ID_de_catalogue = s.ID_de_catalogue
      WHERE s.Code_de_Session = ?
      ORDER BY comp.Competence_a_Acquerir
    `;

    return await executeQuery(query, [sessionId]);
  }

  static async getSessionEvaluationMatrix(sessionId) {
    // Get participants
    const participantsQuery = `
      SELECT a.Matricule, a.Nom
      FROM Agent a
      INNER JOIN Participants p ON a.Matricule = p.Matricule
      WHERE p.Code_de_Session = ?
      ORDER BY a.Nom
    `;
    const participants = await executeQuery(participantsQuery, [sessionId]);

    // Get competences
    const competences = await this.getSessionCompetences(sessionId);

    // Get all evaluations
    const evaluationsQuery = `
      SELECT Matricule, ID_de_competence, Score
      FROM Evaluation
      WHERE code_de_Session = ?
    `;
    const evaluations = await executeQuery(evaluationsQuery, [sessionId]);

    // Build matrix
    const matrix = participants.map(participant => {
      const participantEvaluations = competences.map(competence => {
        const evaluation = evaluations.find(
          e => e.Matricule === participant.Matricule && e.ID_de_competence === competence.ID_de_competence
        );
        return {
          competenceId: competence.ID_de_competence,
          competence: competence.Competence_a_Acquerir,
          score: evaluation ? parseFloat(evaluation.Score) : null
        };
      });

      const scores = participantEvaluations.filter(e => e.score !== null).map(e => e.score);
      const average = scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2) : null;

      return {
        matricule: participant.Matricule,
        nom: participant.Nom,
        evaluations: participantEvaluations,
        average: average ? parseFloat(average) : null,
        isAdmitted: average ? parseFloat(average) >= 10 : null
      };
    });

    return {
      participants: matrix,
      competences,
      sessionId
    };
  }
}

module.exports = Evaluation;
