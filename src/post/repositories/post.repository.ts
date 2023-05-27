import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostRepository extends BaseRepository<Post> {
  constructor(dataSource: DataSource) {
    super(Post, dataSource);
  }
}
