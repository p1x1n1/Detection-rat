import { Injectable } from '@nestjs/common';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Injectable()
export class FileService {
  saveFile(file: Express.Multer.File, folder = 'static'): string {
    const fileExtension = extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const saveFolder = join(__dirname, '..', '..', folder);

    if (!fs.existsSync(saveFolder)) {
      fs.mkdirSync(saveFolder, { recursive: true });
    }

    const filePath = join(saveFolder, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `/${folder}/${fileName}`.replace(/\\/g, '/');
  }
}

