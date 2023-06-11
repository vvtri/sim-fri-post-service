import { Injectable } from '@nestjs/common';
import { DataSource, TreeRepository } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentTreeRepository extends TreeRepository<Comment> {
  constructor(dataSource: DataSource) {
    super(Comment, dataSource.createEntityManager());
  }
}
