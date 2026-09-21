import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(
    private documents: DocumentsService,
    private storage: StorageService,
    private prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.documents.list(user, status);
  }

  @Get('my-submissions')
  mySubmissions(@CurrentUser() user: any) {
    return this.documents.mySubmissions(user);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documents.get(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: any) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || !this.storage.exists(doc.storageKey)) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'File not found' });
    }
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    return res.send(this.storage.read(doc.storageKey));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.documents.upload(user, file, body);
  }

  @Post(':id/submit')
  submit(@CurrentUser() user: any, @Param('id') id: string) {
    return this.documents.submit(user, id);
  }
}
