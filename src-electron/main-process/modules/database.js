import fs from 'fs'
import path from 'path'

/**
 * Get the default empty database structure
 */
export function getDefaultDatabase() {
  return { videos: [], musics: [] }
}

/**
 * Ensure the database file exists, creating it if necessary
 * @param {string} basePath - Base path for the app data (e.g., ~/Downloads/Ytdown/)
 * @returns {string} Path to the database file
 */
export function ensureDatabaseExists(basePath) {
  const dbPath = path.join(basePath, 'database/ytdown.json')
  const dbDir = path.join(basePath, 'database')

  // Create directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Create file if it doesn't exist
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(getDefaultDatabase()))
  }

  return dbPath
}

/**
 * Read and parse the database file
 * @param {string} basePath - Base path for the app data
 * @returns {Object} Database contents
 */
export function readDatabase(basePath) {
  const dbPath = ensureDatabaseExists(basePath)
  try {
    const content = fs.readFileSync(dbPath, 'utf-8')
    if (!content || content.trim() === '') {
      return getDefaultDatabase()
    }
    return JSON.parse(content)
  } catch (err) {
    console.error('Error reading database:', err)
    return getDefaultDatabase()
  }
}

/**
 * Write data to the database file
 * @param {string} basePath - Base path for the app data
 * @param {Object} data - Data to write
 */
export function writeDatabase(basePath, data) {
  const dbPath = ensureDatabaseExists(basePath)
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error writing database:', err)
  }
}

/**
 * Insert a record into the database
 * @param {string} basePath - Base path for the app data
 * @param {Object} record - Record to insert
 * @param {string} type - 'mp3' for musics, anything else for videos
 */
export function insertToDatabase(basePath, record, type) {
  const db = readDatabase(basePath)
  if (type === 'mp3') {
    db.musics.push(record)
  } else {
    db.videos.push(record)
  }
  writeDatabase(basePath, db)
}

export default {
  getDefaultDatabase,
  ensureDatabaseExists,
  readDatabase,
  writeDatabase,
  insertToDatabase
}
