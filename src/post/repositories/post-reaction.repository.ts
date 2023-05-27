import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { PostReaction } from '../entities/post-reaction.entity';

@Injectable()
export class PostReactionRepository extends BaseRepository<PostReaction> {
  constructor(dataSource: DataSource) {
    super(PostReaction, dataSource);
  }
}
