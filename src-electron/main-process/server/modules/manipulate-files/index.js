import fs from "fs";

export const createDir = (directory) => {
  try {
    fs.mkdirSync(directory, { recursive: true });
  } catch (err) {
    throw new Error(`Failed to create directory: ${err.message}`);
  }
};
