import { Injectable } from '@nestjs/common';
import { ExpectationFailedExc } from 'common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { AudienceType, FriendRequestStatus } from 'shared';
import { Brackets, IsNull } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { CommentReaction } from '../../../comment/entities/comment-reaction.entity';
import { CommentReactionRepository } from '../../../comment/repositories/comment-reaction.repository';
import { CommentRepository } from '../../../comment/repositories/comment.repository';
import { FriendRequestRepository } from '../../../friend/repositories/friend-request.repository';
import { PostReactionResDto } from '../../dtos/common/post-reaction.res.dto';
import { PostResDto, PostResDtoParams } from '../../dtos/common/post.res.dto';
import {
  CreatePostUserReqDto,
  GetListPostUserReqDto,
  ReactPostUserReqDto,
  UpdatePostUserReqDto,
} from '../../dtos/user/req/post.user.req.dto';
import { PostFile } from '../../entities/post-file.entity';
import { PostFileRepository } from '../../repositories/post-file.repository';
import { PostReactionRepository } from '../../repositories/post-reaction.repository';
import { PostRepository } from '../../repositories/post.repository';

@Injectable()
export class PostUserService {
  constructor(
    private postRepo: PostRepository,
    private postFileRepo: PostFileRepository,
    private commentRepo: CommentRepository,
    private postReactionRepo: PostReactionRepository,
    private commentReactionRepo: CommentReactionRepository,
    private friendRequestRepo: FriendRequestRepository,
  ) {}

  @Transactional()
  async getListPosts(dto: GetListPostUserReqDto, user: User) {
    const { limit, page, userId } = dto;

    const isMyPosts = user.id === userId;
    const friendIds: Set<number> = new Set();
    friendIds.add(user.id);

    const friends = await this.friendRequestRepo.findBy([
      { beRequestedId: user.id, status: FriendRequestStatus.ACCEPTED },
      { requesterId: user.id, status: FriendRequestStatus.ACCEPTED },
    ]);

    for (const friend of friends) {
      if (friend.beRequestedId !== user.id) friendIds.add(friend.beRequestedId);
      if (friend.requesterId !== user.id) friendIds.add(friend.requesterId);
    }

    const qb = this.postRepo
      .createQueryBuilder('p')
      .groupBy('p.id')
      .select('p.id')
      .orderBy('p.createdAt', 'DESC')
      .where(
        new Brackets((qb2) => {
          qb2.where(`p.audienceType = '${AudienceType.PUBLIC}'`);

          qb2.orWhere(
            new Brackets((qb3) => {
              qb3
                .where(`p.user_id IN (:...friendIds)`, {
                  friendIds: Array.from(friendIds),
                })
                .andWhere(`p.audienceType = '${AudienceType.FRIEND}'`);
            }),
          );

          qb2.orWhere(
            new Brackets((qb3) => {
              qb3
                .where(`p.user_id = ${user.id}`)
                .andWhere(`p.audienceType = '${AudienceType.ONLY_ME}'`);
            }),
          );
        }),
      );

    if (userId) {
      qb.andWhere('p.userId = :userId', { userId });
    }

    const { items, meta } = await paginate(qb, { page, limit });

    const result = await Promise.all(
      items.map(async (item) => {
        const post = await this.postRepo.findOne({
          where: { id: item.id },
          relations: {
            postFiles: { file: true },
            user: { userProfile: { avatar: true } },
          },
        });

        const [firstComment, reactionCount, totalCommentCount, myReaction] =
          await Promise.all([
            this.commentRepo.findFirst({
              where: { postId: item.id, parentId: IsNull() },
              relations: {
                user: { userProfile: { avatar: true } },
                commentFiles: { file: true },
              },
              order: { createdAt: 'DESC' },
            }),
            this.postReactionRepo.getReactionCount(item.id),
            this.commentRepo.countDirectPostComment(item.id),
            this.postReactionRepo.findOneBy({
              postId: item.id,
              userId: user.id,
            }),
          ]);

        let commentReactionCount: PostResDtoParams['commentReactionCount'];
        let myCommentReaction: CommentReaction;
        if (firstComment) {
          commentReactionCount =
            await this.commentReactionRepo.getReactionCount(firstComment.id);
          myCommentReaction = await this.commentReactionRepo.findOneBy({
            commentId: firstComment.id,
            userId: user.id,
          });
        }

        return PostResDto.forUser({
          data: post,
          isMutable: isMyPosts,
          firstComment,
          reactionCount,
          totalCommentCount,
          myReaction,
          commentReactionCount,
          myCommentReaction,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getDetail(id: number, user: User) {
    const post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id },
      relations: {
        postFiles: { file: true },
        user: { userProfile: true },
        comments: true,
      },
    });

    switch (post.audienceType) {
      case AudienceType.ONLY_ME:
        if (user.id !== post.userId)
          throw new ExpectationFailedExc({ statusCode: 1 }); //todo
      case AudienceType.FRIEND:
        const isFriend = true;
        if (!isFriend) throw new ExpectationFailedExc({ statusCode: 1 });
    }

    // return PostResDto.forUser({ data: post });
  }

  @Transactional()
  async reactPost(dto: ReactPostUserReqDto, user: User) {
    const { postId, type } = dto;

    let reaction = await this.postReactionRepo.findOneBy({
      postId,
      userId: user.id,
    });

    if (!reaction) {
      reaction = this.postReactionRepo.create({
        postId,
        userId: user.id,
      });
    }

    reaction.type = type;

    await this.postReactionRepo.save(reaction);

    return PostReactionResDto.forUser({ data: reaction });
  }

  @Transactional()
  async create(dto: CreatePostUserReqDto, user: User) {
    const { audienceType, content, fileIds } = dto;

    const post = this.postRepo.create({
      content,
      audienceType,
      userId: user.id,
    });
    await this.postRepo.save(post);

    if (fileIds?.length) {
      await this.saveFileIds(post.id, fileIds, []);
    }

    return this.getDetail(post.id, user);
  }

  @Transactional()
  async update(id: number, dto: UpdatePostUserReqDto, user: User) {
    const { audienceType, content, fileIds } = dto;

    let post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
      relations: { postFiles: true },
    });

    post = this.postRepo.create({
      ...post,
      ...(content && { content }),
      ...(audienceType && { audienceType }),
    });
    await this.postRepo.save(post);

    if (fileIds?.length) {
      await this.saveFileIds(post.id, fileIds, post.postFiles);
    }

    return this.getDetail(id, user);
  }

  @Transactional()
  async delete(id: number, user: User) {
    const post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
      relations: { postFiles: true },
    });

    await this.postRepo.softDelete(post);
    await this.postFileRepo.softDelete(post.postFiles.map((item) => item.id));
  }

  private async saveFileIds(
    postId: number,
    dtos: number[],
    entities: PostFile[],
  ) {
    const entityIdsToDel: number[] = [];
    const entitiesToInsert: PostFile[] = [];

    for (const entity of entities) {
      const dto = dtos.find((item) => item === entity.fileId);

      if (!dto) entityIdsToDel.push(entity.id);
    }

    for (const dto of dtos) {
      let entity = entities.find((item) => item.fileId === dto);

      if (!entity) {
        entity = this.postFileRepo.create({
          postId,
          fileId: dto,
        });
        entitiesToInsert.push(entity);
      }
    }

    await Promise.all([
      entityIdsToDel.length && this.postFileRepo.softDelete(entityIdsToDel),
      entitiesToInsert.length && this.postFileRepo.save(entitiesToInsert),
    ]);
  }
}
