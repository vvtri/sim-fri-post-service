import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { CommentFile } from '../entities/comment-file.entity';

@Injectable()
export class CommentFileRepository extends BaseRepository<CommentFile> {
  constructor(dataSource: DataSource) {
    super(CommentFile, dataSource);
  }
}
