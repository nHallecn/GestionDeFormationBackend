// In config/database.js - REPLACE the content of this file

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'training_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Création du pool de connexions
const pool = mysql.createPool(dbConfig);

// --- NEW: VARIABLE TO MANAGE TRANSACTION STATE ---
// This will hold the connection when a transaction is active.
let transactionConnection = null;

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion à la base de données MySQL établie avec succès');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// --- MODIFIED: executeQuery to be transaction-aware ---
const executeQuery = async (query, params = []) => {
  // Use the dedicated transaction connection if it exists, otherwise use the pool
  const connection = transactionConnection || pool;
  try {
    // Use .query for compatibility with both pool and connection objects
    const [rows] = await connection.query(query, params);
    return rows;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête:', error);
    throw error;
  }
};

// --- NEW: TRANSACTION HANDLING FUNCTIONS ---

/**
 * Begins a new database transaction.
 */
const beginTransaction = async () => {
  if (transactionConnection) {
    throw new Error('Transaction already in progress.');
  }
  transactionConnection = await pool.getConnection();
  await transactionConnection.beginTransaction();
};

/**
 * Commits the current active transaction.
 */
const commit = async () => {
  if (!transactionConnection) {
    throw new Error('No active transaction to commit.');
  }
  await transactionConnection.commit();
  transactionConnection.release();
  transactionConnection = null;
};

/**
 * Rolls back the current active transaction.
 */
const rollback = async () => {
  if (!transactionConnection) {
    throw new Error('No active transaction to roll back.');
  }
  await transactionConnection.rollback();
  transactionConnection.release();
  transactionConnection = null;
};

// --- UNCHANGED: Your createTables function ---
const createTables = async () => {
  const tables = [
    // (Your table creation queries are here and remain unchanged)
    `CREATE TABLE IF NOT EXISTS Agent (
      Matricule VARCHAR(50) PRIMARY KEY,
      Nom VARCHAR(100) NOT NULL,
      Fonction VARCHAR(100),
      date_d_embauche DATE
    )`,
    `CREATE TABLE IF NOT EXISTS Catalogue_de_Formation (
      ID_de_catalogue INT AUTO_INCREMENT PRIMARY KEY,
      Nom VARCHAR(200) NOT NULL,
      Description TEXT,
      Objectif_Pedagogique TEXT,
      Prerequis TEXT,
      Categorie ENUM('certifiant', 'non certifiant') NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Competences (
      ID_de_competence INT AUTO_INCREMENT PRIMARY KEY,
      Competence_a_Acquerir VARCHAR(200) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Competence_de_catalogue (
      ID_de_catalogue INT,
      ID_de_competence INT,
      PRIMARY KEY (ID_de_catalogue, ID_de_competence),
      FOREIGN KEY (ID_de_catalogue) REFERENCES Catalogue_de_Formation(ID_de_catalogue) ON DELETE CASCADE,
      FOREIGN KEY (ID_de_competence) REFERENCES Competences(ID_de_competence) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Cabinet (
      ID_de_cabinet INT AUTO_INCREMENT PRIMARY KEY,
      Nom VARCHAR(200) NOT NULL,
      telephone VARCHAR(20),
      Emplacement VARCHAR(200)
    )`,
    `CREATE TABLE IF NOT EXISTS Formateur (
      matricule VARCHAR(50) PRIMARY KEY,
      Domain VARCHAR(200),
      FOREIGN KEY (matricule) REFERENCES Agent(Matricule) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Sessions_de_Formation (
      Code_de_Session INT AUTO_INCREMENT PRIMARY KEY,
      ID_de_catalogue INT NOT NULL,
      Date_de_Debut DATE NOT NULL,
      Date_de_Fin DATE NOT NULL,
      Type ENUM('interne', 'externe') NOT NULL,
      statut ENUM('encours', 'terminé') NOT NULL DEFAULT 'encours',
      ID_du_cabinet INT,
      Matricule_du_formateur VARCHAR(50),
      FOREIGN KEY (ID_de_catalogue) REFERENCES Catalogue_de_Formation(ID_de_catalogue),
      FOREIGN KEY (ID_du_cabinet) REFERENCES Cabinet(ID_de_cabinet),
      FOREIGN KEY (Matricule_du_formateur) REFERENCES Formateur(matricule)
    )`,
    `CREATE TABLE IF NOT EXISTS Participants (
      Matricule VARCHAR(50),
      Code_de_Session INT,
      PRIMARY KEY (Matricule, Code_de_Session),
      FOREIGN KEY (Matricule) REFERENCES Agent(Matricule) ON DELETE CASCADE,
      FOREIGN KEY (Code_de_Session) REFERENCES Sessions_de_Formation(Code_de_Session) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Presence (
      Code_de_Session INT,
      Matricule VARCHAR(50),
      Date DATE,
      statut ENUM('present', 'absent'),
      PRIMARY KEY (Code_de_Session, Matricule, Date),
      FOREIGN KEY (Code_de_Session) REFERENCES Sessions_de_Formation(Code_de_Session) ON DELETE CASCADE,
      FOREIGN KEY (Matricule) REFERENCES Agent(Matricule) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS Evaluation (
      code_de_Session INT,
      Matricule VARCHAR(50),
      ID_de_competence INT,
      Score DECIMAL(4,2),
      PRIMARY KEY (code_de_Session, Matricule, ID_de_competence),
      FOREIGN KEY (code_de_Session) REFERENCES Sessions_de_Formation(Code_de_Session) ON DELETE CASCADE,
      FOREIGN KEY (Matricule) REFERENCES Agent(Matricule) ON DELETE CASCADE,
      FOREIGN KEY (ID_de_competence) REFERENCES Competences(ID_de_competence) ON DELETE CASCADE
    )`
  ];

  try {
    for (const table of tables) {
      await executeQuery(table);
    }
    console.log('✅ Tables créées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
};

// --- MODIFIED: module.exports to include new functions ---
module.exports = {
  pool,
  executeQuery,
  testConnection,
  createTables,
  beginTransaction, // Add this
  commit,           // Add this
  rollback          // Add this
};
