import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    if (file.buffer) {
      await fs.promises.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, filePath);
    }

    return filename;
  }

  exists(storageKey: string): boolean {
    const filePath = path.join(this.uploadDir, path.basename(storageKey));
    return fs.existsSync(filePath);
  }

  read(storageKey: string): Buffer {
    const filePath = path.join(this.uploadDir, path.basename(storageKey));
    return fs.readFileSync(filePath);
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadDir, path.basename(storageKey));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
