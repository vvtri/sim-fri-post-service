import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { PostReactionType } from 'shared';
import { DataSource } from 'typeorm';
import { PostReaction } from '../entities/post-reaction.entity';

@Injectable()
export class PostReactionRepository extends BaseRepository<PostReaction> {
  constructor(dataSource: DataSource) {
    super(PostReaction, dataSource);
  }

  async getReactionCount(postId: number) {
    const { totalCount, likeCount, loveCount, angryCount } =
      (await this.createQueryBuilder('pr')
        .where('pr.postId = :postId', { postId })
        .select('count(*)::int as "totalCount"')
        .addSelect(
          `(count(*) FILTER (WHERE type = '${PostReactionType.LIKE}'))::int as "likeCount"`,
        )
        .addSelect(
          `(count(*) FILTER (WHERE type = '${PostReactionType.LOVE}'))::int as "loveCount"`,
        )
        .addSelect(
          `(count(*) FILTER (WHERE type = '${PostReactionType.ANGRY}'))::int as "angryCount"`,
        )
        .getRawOne<Record<string, number>>()) || {};

    return { totalCount, likeCount, loveCount, angryCount };
  }
}
