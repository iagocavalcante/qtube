import fs from "fs";
import path from "path";

/**
 * Get the default empty database structure
 */
export function getDefaultDatabase() {
  return { videos: [], musics: [] };
}

/**
 * Ensure the database file exists, creating it if necessary
 * @param {string} basePath - Base path for the app data (e.g., ~/Downloads/Ytdown/)
 * @returns {string} Path to the database file
 */
export function ensureDatabaseExists(basePath) {
  const dbPath = path.join(basePath, "database/ytdown.json");
  const dbDir = path.join(basePath, "database");

  // Create directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(getDefaultDatabase()));
  }

  return dbPath;
}

/**
 * Read and parse the database file
 * @param {string} basePath - Base path for the app data
 * @returns {Object} Database contents
 */
export function readDatabase(basePath) {
  const dbPath = ensureDatabaseExists(basePath);
  const backupPath = dbPath + ".backup";
  try {
    const content = fs.readFileSync(dbPath, "utf-8");

    if (!content || content.trim() === "") {
      // try backup if main db empty
      if (fs.existsSync(backupPath)) {
        const backupContent = fs.readFileSync(backupPath, "utf-8");
        if (backupContent && backupContent.trim() !== "") {
          console.warn("Main database empty, restoring from backup");
          const backupData = JSON.parse(backupContent);
          // restore backup to main DB
          fs.writeFileSync(dbPath, backupContent);
          return backupData;
        }
      }
      return getDefaultDatabase();
    }
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database:", err);

    // Try to restore from backup
    if (fs.existsSync(backupPath)) {
      try {
        const backupContent = fs.readFileSync(backupPath, "utf-8");
        const backupData = JSON.parse(backupContent);
        console.warn("Main database corrupted, restoring from backup");

        // Restore backup to main database
        fs.writeFileSync(dbPath, backupContent);
        return backupData;
      } catch (backupErr) {
        console.error("Backup also corrupted:", backupErr);
      }
    }

    // Both main and backup failed, return empty
    console.error("Database recovery failed, returning empty database");
    return getDefaultDatabase();
  }
}

/**
 * Write data to the database file
 * @param {string} basePath - Base path for the app data
 * @param {Object} data - Data to write
 */
export function writeDatabase(basePath, data) {
  const dbPath = ensureDatabaseExists(basePath);
  const backupPath = dbPath + ".backup";
  const tempPath = dbPath + ".tmp";

  try {
    // Create backup of current database before writing
    if (fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, backupPath);
      } catch (backupErr) {
        console.warn("Failed to create backup:", backupErr);
        // Continue anyway, don't block the write
      }
    }

    // Write to temporary file first
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, jsonData);

    // Verify the temporary file is valid JSON
    const verifyContent = fs.readFileSync(tempPath, "utf-8");
    const verifyData = JSON.parse(verifyContent);

    if (!verifyData || !verifyData.videos || !verifyData.musics) {
      throw new Error("Database verification failed: invalid structure");
    }

    // Atomic move: rename temp file to actual database
    fs.renameSync(tempPath, dbPath);

    console.info("Database written successfully");
  } catch (err) {
    console.error("Error writing database:", err);

    // Clean up temp file if exists
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupErr) {
        console.warn("Failed to clean up temp file:", cleanupErr);
      }
    }

    // Try to restore from backup
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, dbPath);
        console.warn("Database write failed, restored from backup");
      } catch (restoreErr) {
        console.error("Failed to restore from backup:", restoreErr);
      }
    }

    throw new Error(`Database write failed: ${err.message}`);
  }
}

/**
 * Insert a record into the database
 * @param {string} basePath - Base path for the app data
 * @param {Object} record - Record to insert
 * @param {string} type - 'mp3' for musics, anything else for videos
 */
export function insertToDatabase(basePath, record, type) {
  const db = readDatabase(basePath);
  if (type === "mp3") {
    db.musics.push(record);
  } else {
    db.videos.push(record);
  }
  writeDatabase(basePath, db);
}

export default {
  getDefaultDatabase,
  ensureDatabaseExists,
  readDatabase,
  writeDatabase,
  insertToDatabase,
};
