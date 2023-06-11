import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { DataSource } from 'typeorm';
import { Comment } from '../entities/comment.entity';

@Injectable()
export class CommentRepository extends BaseRepository<Comment> {
  constructor(dataSource: DataSource) {
    super(Comment, dataSource);

    this.metadata.columns = this.metadata.columns.map((x) => {
      if (x.databaseName === 'mpath') {
        x.isVirtual = false;
      }
      return x;
    });
  }

  async countChild(commentId: number) {
    return await this.countBy({ parentId: commentId });
  }

  async countDirectChild(parent: Comment) {
    const count = await this.createQueryBuilder('c')
      .where('c.parentId = :parentId', { parentId: parent.id })
      .andWhere(`c.mpath ~ '${parent.mpath}[^.]*.$'`)
      .orderBy('c.createdAt', 'DESC')
      .getCount();

    return count;
  }

  async countDirectPostComment(postId: number) {
    const count = await this.createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .andWhere(`c.mpath ~ '^[^.]*.$'`)
      .orderBy('c.createdAt', 'DESC')
      .getCount();

    return count;
  }
}
