import { Injectable } from '@nestjs/common';
import { KafkaProducer } from '@vvtri/nestjs-kafka';
import {
  DeletePostReactionKafkaPayload,
  ExpectationFailedExc,
  KAFKA_TOPIC,
  SavePostReactionKafkaPayload,
} from 'common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { AudienceType, FriendRequestStatus } from 'shared';
import { Brackets, IsNull } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { CommentResDto } from '../../../comment/dtos/common/comment.res.dto';
import { CommentReactionRepository } from '../../../comment/repositories/comment-reaction.repository';
import { CommentRepository } from '../../../comment/repositories/comment.repository';
import { CommentUserService } from '../../../comment/services/user/comment.user.service';
import { FriendRequestRepository } from '../../../friend/repositories/friend-request.repository';
import { PostReactionResDto } from '../../dtos/common/post-reaction.res.dto';
import { PostResDto } from '../../dtos/common/post.res.dto';
import {
  CreatePostUserReqDto,
  DeleteReactPostUserReqDto,
  GetDetailPostUserReqDto,
  GetListPostUserReqDto,
  ReactPostUserReqDto,
  UpdatePostUserReqDto,
} from '../../dtos/user/req/post.user.req.dto';
import { PostFile } from '../../entities/post-file.entity';
import { PostReaction } from '../../entities/post-reaction.entity';
import { Post } from '../../entities/post.entity';
import { PostFileRepository } from '../../repositories/post-file.repository';
import { PostReactionRepository } from '../../repositories/post-reaction.repository';
import { PostRepository } from '../../repositories/post.repository';

@Injectable()
export class PostUserService {
  constructor(
    private kafkaProducer: KafkaProducer,
    private commentUserService: CommentUserService,

    private postRepo: PostRepository,
    private postFileRepo: PostFileRepository,
    private commentRepo: CommentRepository,
    private postReactionRepo: PostReactionRepository,
    private commentReactionRepo: CommentReactionRepository,
    private friendRequestRepo: FriendRequestRepository,
  ) {}

  @Transactional()
  async getListPosts(dto: GetListPostUserReqDto, user: User) {
    const { limit, page, userId, excludeMe } = dto;
    let { searchText } = dto;

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
      .orderBy(
        'case when p.userId IN (:...friendIds) then 2 else 1 end',
        'DESC',
      )
      .addOrderBy('p.createdAt', 'DESC')
      .where(
        new Brackets((qb2) => {
          qb2.where(`p.audienceType = '${AudienceType.PUBLIC}'`);

          qb2.orWhere(
            new Brackets((qb3) => {
              qb3
                .where(`p.userId IN (:...friendIds)`, {
                  friendIds: Array.from(friendIds),
                })
                .andWhere(`p.audienceType = '${AudienceType.FRIEND}'`);
            }),
          );

          qb2.orWhere(
            new Brackets((qb3) => {
              qb3
                .where(`p.userId = ${user.id}`)
                .andWhere(`p.audienceType = '${AudienceType.ONLY_ME}'`);
            }),
          );
        }),
      );

    if (userId) {
      qb.andWhere('p.userId = :userId', { userId });
    }

    if (excludeMe) qb.andWhere(`p.userId != ${user.id}`);

    if (searchText) {
      searchText = `%${searchText}%`;

      qb.andWhere('p.content ILIKE :searchText', { searchText });
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

        const subData = await this.getPostSubData(item.id, user);

        return PostResDto.forUser({
          data: post,
          ...subData,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getDetail(id: number, dto: GetDetailPostUserReqDto, user: User) {
    const { commentId } = dto;

    const post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id },
      relations: {
        postFiles: { file: true },
        user: { userProfile: { avatar: true } },
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

    const subData = await this.getPostSubData(id, user, commentId);

    return PostResDto.forUser({
      data: post,
      ...subData,
    });
  }

  @Transactional()
  async reactPost(dto: ReactPostUserReqDto, user: User) {
    const { postId, type } = dto;

    const post = await this.postRepo.findOneByOrThrowNotFoundExc({
      id: postId,
    });

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

    await this.sendPostReactionSavedKafka(post, reaction);

    return PostReactionResDto.forUser({ data: reaction });
  }

  @Transactional()
  async deleteReactPost(dto: DeleteReactPostUserReqDto, user: User) {
    const { postId } = dto;

    const postReaction =
      await this.postReactionRepo.findOneByOrThrowNotFoundExc({
        postId,
        userId: user.id,
      });

    await this.postReactionRepo.softDelete({
      postId,
      userId: user.id,
    });

    await this.sendPostReactionDeletedKafka(postReaction.id);
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

    if (Array.isArray(fileIds)) {
      await this.saveFiles(post.id, fileIds, []);
    }

    return this.getDetail(post.id, {}, user);
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

    if (Array.isArray(fileIds)) {
      await this.saveFiles(post.id, fileIds, post.postFiles);
    }

    return this.getDetail(id, {}, user);
  }

  @Transactional()
  async delete(id: number, user: User) {
    const post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
      relations: {
        postFiles: true,
        postReactions: true,
        comments: { commentReactions: true },
      },
    });

    await Promise.all([
      this.postRepo.softDelete(post.id),
      this.postReactionRepo.softDelete({ postId: id }),
      this.commentRepo.softDelete({ postId: id }),
      this.postFileRepo.softDelete({ postId: id }),
    ]);

    await Promise.all([
      ...post.postReactions.map((item) =>
        this.sendPostReactionDeletedKafka(item.id),
      ),
      ...post.comments.map(async (item) => {
        await Promise.all(
          item.commentReactions.map(async (item2) => {
            await this.commentUserService.sendCommentReactionDeletedKafka(
              item2.id,
            );
          }),
        );
        await this.commentUserService.sendCommentDeletedKafka(item.id);
      }),
    ]);
  }

  private async saveFiles(
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

  private async getPostSubData(postId: number, user: User, commentId?: number) {
    const [
      reactionCount,
      totalDirectCommentCount,
      totalCommentCount,
      myReaction,
    ] = await Promise.all([
      this.postReactionRepo.getReactionCount(postId),
      this.commentRepo.countDirectPostComment(postId),
      this.commentRepo.countBy({ postId }),
      this.postReactionRepo.findOneBy({
        postId: postId,
        userId: user.id,
      }),
    ]);

    let firstComment: CommentResDto;

    if (commentId) {
      firstComment = await this.commentUserService.getParentsTree(
        commentId,
        user,
      );
    } else {
      const comment = await this.commentRepo.findFirst({
        where: { postId: postId, parentId: IsNull() },
        relations: {
          user: { userProfile: { avatar: true } },
          commentFiles: { file: true },
        },
        order: { createdAt: 'DESC' },
      });

      if (comment) {
        const commentData = await this.commentUserService.getCommentData(
          comment.id,
          user.id,
        );

        firstComment = CommentResDto.forUser({
          data: comment,
          ...commentData,
        });
      }
    }

    return {
      firstComment,
      reactionCount,
      totalCommentCount,
      totalDirectCommentCount,
      myReaction,
    };
  }

  private async sendPostReactionSavedKafka(
    post: Post,
    postReaction: PostReaction,
  ) {
    const kafkaPayload = new SavePostReactionKafkaPayload({
      id: postReaction.id,
      createdAt: postReaction.createdAt,
      postContent: post.content,
      postId: post.id,
      postOwnerId: post.userId,
      type: postReaction.type,
      updatedAt: postReaction.updatedAt,
      userId: postReaction.userId,
    });

    await this.kafkaProducer.send<SavePostReactionKafkaPayload>({
      topic: KAFKA_TOPIC.POST_REACTION_SAVED,
      messages: [{ value: kafkaPayload, key: String(postReaction.id) }],
    });
  }

  private async sendPostReactionDeletedKafka(postReactionId: number) {
    const kafkaPayload = new DeletePostReactionKafkaPayload({
      id: postReactionId,
    });

    await this.kafkaProducer.send<DeletePostReactionKafkaPayload>({
      topic: KAFKA_TOPIC.POST_REACTION_DELETED,
      messages: [{ value: kafkaPayload, key: String(postReactionId) }],
    });
  }
}
