import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { CommentReactionType } from 'shared';
import { DataSource } from 'typeorm';
import { CommentReaction } from '../entities/comment-reaction.entity';

@Injectable()
export class CommentReactionRepository extends BaseRepository<CommentReaction> {
  constructor(dataSource: DataSource) {
    super(CommentReaction, dataSource);
  }

  async getReactionCount(commentId: number) {
    const { totalCount, likeCount, loveCount, angryCount } =
      (await this.createQueryBuilder('cr')
        .where('cr.commentId = :commentId', { commentId })
        .select('count(*)::int as "totalCount"')
        .addSelect(
          `(count(*) FILTER (WHERE type = '${CommentReactionType.LIKE}'))::int as "likeCount"`,
        )
        .addSelect(
          `(count(*) FILTER (WHERE type = '${CommentReactionType.LOVE}'))::int as "loveCount"`,
        )
        .addSelect(
          `(count(*) FILTER (WHERE type = '${CommentReactionType.ANGRY}'))::int as "angryCount"`,
        )
        .getRawOne<Record<string, number>>()) || {};

    return { totalCount, likeCount, loveCount, angryCount };
  }
}
