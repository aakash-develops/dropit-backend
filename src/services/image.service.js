import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

/**
 * Compresses incoming file buffers to .webp and writes to disk.
 * Returns relative path stored in MongoDB.
 */
export const saveAndOptimizeImage = async (fileBuffer, folder = "kyc") => {
  const targetDir = path.join(process.cwd(), "uploads", folder);

  // Automatically create /uploads/kyc folder if missing
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const filepath = path.join(targetDir, filename);

  // Resize max width to 1200px and compress WebP quality to 80%
  await sharp(fileBuffer)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath);

  return `/uploads/${folder}/${filename}`;
};