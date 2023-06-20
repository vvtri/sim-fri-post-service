import { Injectable } from '@nestjs/common';
import { KafkaProducer } from '@vvtri/nestjs-kafka';
import {
  DeleteCommentKafkaPayload,
  DeleteCommentReactionKafkaPayload,
  ExpectationFailedExc,
  KAFKA_TOPIC,
  SaveCommentKafkaPayload,
  SaveCommentReactionKafkaPayload,
} from 'common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { AudienceType } from 'shared';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { UserProfileRepository } from '../../../auth/repositories/user-profile.repository';
import { waitAndRetry } from '../../../common/utils/index.util';
import { FileRepository } from '../../../file/repositories/file.repository';
import { FriendRequestRepository } from '../../../friend/repositories/friend-request.repository';
import { Post } from '../../../post/entities/post.entity';
import { PostRepository } from '../../../post/repositories/post.repository';
import { CommentReactionResDto } from '../../dtos/common/comment-reaction.res.dto';
import { CommentResDto } from '../../dtos/common/comment.res.dto';
import {
  CreateCommentUserReqDto,
  DeleteReactCommentUserReqDto,
  GetListCommentUserReqDto,
  GetListReplyCommentUserReqDto,
  ReactCommentUserReqDto,
  UpdateCommentUserReqDto,
} from '../../dtos/user/req/comment.user.req.dto';
import { CommentFile } from '../../entities/comment-file.entity';
import { CommentReaction } from '../../entities/comment-reaction.entity';
import { Comment } from '../../entities/comment.entity';
import { CommentFileRepository } from '../../repositories/comment-file.repository';
import { CommentReactionRepository } from '../../repositories/comment-reaction.repository';
import { CommentTreeRepository } from '../../repositories/comment-tree.repository';
import { CommentRepository } from '../../repositories/comment.repository';

@Injectable()
export class CommentUserService {
  constructor(
    private kafkaProducer: KafkaProducer,

    private postRepo: PostRepository,
    private commentRepo: CommentRepository,
    private commentTreeRepo: CommentTreeRepository,
    private commentReactionRepo: CommentReactionRepository,
    private commentFileRepo: CommentFileRepository,
    private userProfileRepo: UserProfileRepository,
    private fileRepo: FileRepository,
    private friendRequestRepo: FriendRequestRepository,
  ) {}

  @Transactional()
  async getList(dto: GetListCommentUserReqDto, user: User) {
    const { limit, page, postId } = dto;

    // check if user can see comments
    const qb = this.commentRepo
      .createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .andWhere(`c.parentId is null`)
      .groupBy('c.id')
      .select('c.id')
      .orderBy('c.createdAt', 'DESC');

    const { items, meta } = await paginate(qb, { page, limit });

    const result = await Promise.all(
      items.map(async (item) => {
        const { childCount, comment, myReaction, reactionCount } =
          await this.getCommentData(item.id, user.id);

        return CommentResDto.forUser({
          data: comment,
          reactionCount,
          childCount: childCount,
          myReaction,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getListReply(dto: GetListReplyCommentUserReqDto, user: User) {
    const { limit, page, parentId } = dto;

    const parentComment = await this.commentRepo.findOneByOrThrowNotFoundExc({
      id: parentId,
    });

    const post = await this.postRepo.findOneByOrThrowNotFoundExc({
      id: parentComment.postId,
    });
    await this.checkIfCanDoActionOnPost(post, user);

    const qb = this.commentRepo
      .createQueryBuilder('c')
      .where('c.parentId = :parentId', { parentId })
      .andWhere(`c.mpath ~ '${parentComment.mpath}[^.]*.$'`)
      .groupBy('c.id')
      .select('c.id')
      .orderBy('c.createdAt', 'ASC');

    const { items, meta } = await paginate(qb, { page, limit });

    const result = await Promise.all(
      items.map(async (item) => {
        const { childCount, comment, myReaction, reactionCount } =
          await this.getCommentData(item.id, user.id);

        return CommentResDto.forUser({
          data: comment,
          reactionCount,
          childCount,
          myReaction,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getParentsTree(commentId: number, user: User) {
    const comment = await this.commentRepo.findOneByOrThrowNotFoundExc({
      id: commentId,
    });

    const post = await this.postRepo.findOneByOrThrowNotFoundExc({
      id: comment.postId,
    });
    await this.checkIfCanDoActionOnPost(post, user);

    const commentIds = comment.mpath
      .substring(0, comment.mpath.length - 1)
      .split('.');

    const parents = await Promise.all(
      commentIds.map(async (item) => {
        const { comment, childCount, myReaction, reactionCount } =
          await this.getCommentData(Number(item), user.id);

        return CommentResDto.forUser({
          data: comment,
          childCount,
          myReaction,
          reactionCount,
        });
      }),
    );

    const result = parents[0];

    for (let i = 0; i < parents.length - 1; i++) {
      const element = parents[i];
      element.children = [parents[i + 1]];
    }

    return result;
  }

  @Transactional()
  async reactComment(dto: ReactCommentUserReqDto, user: User) {
    const { commentId, type } = dto;

    const comment = await this.commentRepo.findOneOrThrowNotFoundExc({
      where: { id: commentId },
      relations: { post: true },
    });

    await this.checkIfCanDoActionOnPost(comment.post, user);

    let reaction = await this.commentReactionRepo.findOneBy({
      commentId,
      userId: user.id,
    });

    if (!reaction) {
      reaction = this.commentReactionRepo.create({
        commentId,
        userId: user.id,
      });
    }

    reaction.type = type;

    await this.commentReactionRepo.save(reaction);

    await this.sendCommentReactionSavedKafka(comment, reaction);

    return CommentReactionResDto.forUser({ data: reaction });
  }

  @Transactional()
  async create(dto: CreateCommentUserReqDto, user: User) {
    const { content, postId, parentId: commentId, fileIds } = dto;

    const post = await this.postRepo.findOneByOrThrowNotFoundExc({
      id: postId,
    });

    await this.checkIfCanDoActionOnPost(post, user);

    const comment = this.commentRepo.create({
      content,
      postId,
      userId: user.id,
      commentFiles: [],
    });

    if (commentId) {
      const parent = await this.commentRepo.findOneByOrThrowNotFoundExc({
        id: commentId,
      });
      comment.parent = parent;
    }

    await this.commentRepo.save(comment);

    if (fileIds?.length) {
      const commentFiles = await this.saveFileIds(comment.id, fileIds, []);
      comment.commentFiles = commentFiles;
    }

    const userProfile = await this.userProfileRepo.findOne({
      where: { userId: user.id },
      relations: { avatar: true },
    });
    user.userProfile = userProfile;
    comment.user = user;

    const result = CommentResDto.forUser({ data: comment });

    await this.sendCommentSavedKafka(comment, post);

    return result;
  }

  @Transactional()
  async update(dto: UpdateCommentUserReqDto, user: User) {
    const { id, content, fileIds } = dto;

    let comment = await this.commentRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
      relations: { commentFiles: { file: true } },
    });

    const post = await this.postRepo.findOneByOrThrowNotFoundExc({
      id: comment.postId,
    });

    comment = this.commentRepo.create({
      ...comment,
      ...(content && { content }),
    });
    await this.commentRepo.save(comment);

    if (fileIds?.length) {
      await this.saveFileIds(comment.id, fileIds, comment.commentFiles);
    }

    const userProfile = await this.userProfileRepo.findOne({
      where: { userId: user.id },
      relations: { avatar: true },
    });
    user.userProfile = userProfile;
    comment.user = user;

    const result = CommentResDto.forUser({ data: comment });

    await this.sendCommentSavedKafka(comment, post);

    return result;
  }

  @Transactional()
  async delete(id: number, user: User) {
    const comment = await this.commentRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
    });

    await this.commentRepo.softDelete(id);
    await this.commentFileRepo.softDelete({ commentId: id });

    await this.sendCommentDeletedKafka(id);
  }

  @Transactional()
  async deleteReact(body: DeleteReactCommentUserReqDto, user: User) {
    const { commentId } = body;

    const commentReaction = await this.commentReactionRepo.findOneBy({
      commentId,
      userId: user.id,
    });
    if (!commentReaction) return;

    await this.commentReactionRepo.softDelete(commentReaction.id);

    await this.sendCommentReactionDeletedKafka(commentReaction.id);
  }

  private async saveFileIds(
    commentId: number,
    dtos: number[],
    entities: CommentFile[],
  ) {
    const result: CommentFile[] = [];

    const entityIdsToDel: number[] = [];
    const entitiesToInsert: CommentFile[] = [];

    for (const entity of entities) {
      const dto = dtos.find((item) => item === entity.fileId);

      if (!dto) entityIdsToDel.push(entity.id);
      else result.push(entity);
    }

    for (const dto of dtos) {
      let entity = entities.find((item) => item.fileId === dto);

      if (!entity) {
        let file = await this.fileRepo.findOne({
          where: { id: dto },
        });

        file = await waitAndRetry(3, 1000, () =>
          this.fileRepo.findOneOrThrowNotFoundExc({
            where: { id: dto },
          }),
        );

        entity = this.commentFileRepo.create({ commentId, file });
        entitiesToInsert.push(entity);
      }
    }

    await Promise.all([
      entityIdsToDel.length && this.commentFileRepo.softDelete(entityIdsToDel),
      entitiesToInsert.length && this.commentFileRepo.save(entitiesToInsert),
    ]);

    result.push(...entitiesToInsert);

    return result;
  }

  async getCommentData(commentId: number, userId: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: {
        commentFiles: { file: true },
        user: { userProfile: { avatar: true } },
      },
    });
    const reactionCount = await this.commentReactionRepo.getReactionCount(
      commentId,
    );
    const childCount = await this.commentRepo.countDirectChild(comment);
    const myReaction = await this.commentReactionRepo.findOneBy({
      userId,
      commentId: commentId,
    });

    return { comment, reactionCount, childCount, myReaction };
  }

  private async checkIfCanDoActionOnPost(post: Post, user: User) {
    switch (post.audienceType) {
      case AudienceType.PUBLIC:
        return;
      case AudienceType.ONLY_ME:
        if (post.userId === user.id) return;
        throw new ExpectationFailedExc({ statusCode: 1000 });
      case AudienceType.FRIEND:
        const isFriend = await this.friendRequestRepo.isFriend(
          post.userId,
          user.id,
        );
        if (isFriend) return;
        else throw new ExpectationFailedExc({ statusCode: 1000 });
      default:
        throw new Error(
          `Post audienceType ${post.audienceType} not implemented`,
        );
    }
  }

  private async sendCommentSavedKafka(comment: Comment, post: Post) {
    const replyUserIds: Set<number> = new Set();

    if (comment.parentId) {
      const comments = await this.commentTreeRepo.findAncestors(comment);

      comments.forEach((item) => replyUserIds.add(item.userId));
    }

    const kafkaPayload = new SaveCommentKafkaPayload({
      content: comment.content,
      createdAt: comment.createdAt,
      id: comment.id,
      parentId: comment.parentId,
      postId: comment.postId,
      postOwnerId: post.userId,
      updatedAt: comment.updatedAt,
      userId: comment.userId,
      mpath: comment.mpath,
      replyUserIds: Array.from(replyUserIds),
    });

    await this.kafkaProducer.send<SaveCommentKafkaPayload>({
      topic: KAFKA_TOPIC.COMMENT_SAVED,
      messages: [{ value: kafkaPayload, key: String(comment.id) }],
    });
  }

  private async sendCommentReactionSavedKafka(
    comment: Comment,
    commentReaction: CommentReaction,
  ) {
    const replyUserIds: Set<number> = new Set();

    if (comment.parentId) {
      const comments = await this.commentTreeRepo.findAncestors(comment);

      comments.forEach((item) => replyUserIds.add(item.userId));
    }

    const kafkaPayload = new SaveCommentReactionKafkaPayload({
      id: commentReaction.id,
      type: commentReaction.type,
      commentContent: comment.content,
      commentId: comment.id,
      commentOwnerId: comment.userId,
      userId: commentReaction.userId,
      createdAt: commentReaction.createdAt,
      updatedAt: commentReaction.updatedAt,
      postId: comment.postId,
    });

    await this.kafkaProducer.send<SaveCommentReactionKafkaPayload>({
      topic: KAFKA_TOPIC.COMMENT_REACTION_SAVED,
      messages: [{ value: kafkaPayload, key: String(commentReaction.id) }],
    });
  }

  private async sendCommentDeletedKafka(commentId: number) {
    const kafkaPayload = new DeleteCommentKafkaPayload({
      id: commentId,
    });

    await this.kafkaProducer.send<DeleteCommentKafkaPayload>({
      topic: KAFKA_TOPIC.COMMENT_DELETED,
      messages: [{ value: kafkaPayload, key: String(commentId) }],
    });
  }

  private async sendCommentReactionDeletedKafka(commentReactionId: number) {
    const kafkaPayload = new DeleteCommentReactionKafkaPayload({
      id: commentReactionId,
    });

    await this.kafkaProducer.send<DeleteCommentReactionKafkaPayload>({
      topic: KAFKA_TOPIC.COMMENT_REACTION_DELETED,
      messages: [{ value: kafkaPayload, key: String(commentReactionId) }],
    });
  }
}
