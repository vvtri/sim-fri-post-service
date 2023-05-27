import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { PostFile } from '../entities/post-file.entity';

@Injectable()
export class PostFileRepository extends BaseRepository<PostFile> {
  constructor(dataSource: DataSource) {
    super(PostFile, dataSource);
  }
}
