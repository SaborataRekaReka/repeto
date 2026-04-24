import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_PRIVATE_DIRS = ['certificates', 'homework'] as const;
type PrivateDir = (typeof ALLOWED_PRIVATE_DIRS)[number];

/**
 * Serves files from private upload directories (certificates, homework).
 * Requires authentication — the global JwtAuthGuard protects all routes
 * that are not marked @Public().
 */
@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Get(':dir/:filename')
  servePrivateFile(
    @Param('dir') dir: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Whitelist check — only serve from known private dirs
    if (!(ALLOWED_PRIVATE_DIRS as readonly string[]).includes(dir)) {
      throw new NotFoundException('File not found');
    }

    // Path traversal guard — filename must not contain directory separators
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      throw new BadRequestException('Invalid filename');
    }

    const safeDir = dir as PrivateDir;
    const filePath = path.join(process.cwd(), 'uploads', safeDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(filePath);
  }
}
