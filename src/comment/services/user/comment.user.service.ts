import { Injectable } from '@nestjs/common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { UserProfileRepository } from '../../../auth/repositories/user-profile.repository';
import { waitAndRetry } from '../../../common/utils/index.util';
import { FileRepository } from '../../../file/repositories/file.repository';
import { PostRepository } from '../../../post/repositories/post.repository';
import { CommentReactionResDto } from '../../dtos/common/comment-reaction.res.dto';
import { CommentResDto } from '../../dtos/common/comment.res.dto';
import {
  CreateCommentUserReqDto,
  GetListCommentUserReqDto,
  GetListReplyCommentUserReqDto,
  ReactCommentUserReqDto,
  UpdateCommentUserReqDto,
} from '../../dtos/user/req/comment.user.req.dto';
import { CommentFile } from '../../entities/comment-file.entity';
import { CommentFileRepository } from '../../repositories/comment-file.repository';
import { CommentReactionRepository } from '../../repositories/comment-reaction.repository';
import { CommentTreeRepository } from '../../repositories/comment-tree.repository';
import { CommentRepository } from '../../repositories/comment.repository';

@Injectable()
export class CommentUserService {
  constructor(
    private postRepo: PostRepository,
    private commentRepo: CommentRepository,
    private commentTreeRepo: CommentTreeRepository,
    private commentReactionRepo: CommentReactionRepository,
    private commentFileRepo: CommentFileRepository,
    private userProfileRepo: UserProfileRepository,
    private fileRepo: FileRepository,
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
        const comment = await this.commentRepo.findOne({
          where: { id: item.id },
          relations: {
            commentFiles: { file: true },
            user: { userProfile: { avatar: true } },
          },
        });
        const reactionCount = await this.commentReactionRepo.getReactionCount(
          item.id,
        );
        const childCount = await this.commentRepo.countDirectChild(comment);
        const myReaction = await this.commentReactionRepo.findOneBy({
          userId: user.id,
          commentId: item.id,
        });

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

    // todo: check if user can see comments

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
        const comment = await this.commentRepo.findOne({
          where: { id: item.id },
          relations: {
            commentFiles: { file: true },
            user: { userProfile: { avatar: true } },
          },
        });
        const reactionCount = await this.commentReactionRepo.getReactionCount(
          item.id,
        );
        const childCount =
          (await this.commentTreeRepo.countDescendants(comment)) - 1;

        return CommentResDto.forUser({
          data: comment,
          reactionCount,
          childCount,
        });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async reactComment(dto: ReactCommentUserReqDto, user: User) {
    const { commentId, type } = dto;

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

    return CommentReactionResDto.forUser({ data: reaction });
  }

  @Transactional()
  async create(dto: CreateCommentUserReqDto, user: User) {
    const { content, postId, commentId, fileIds } = dto;

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

    return CommentResDto.forUser({ data: comment });
  }

  @Transactional()
  async update(dto: UpdateCommentUserReqDto, user: User) {
    const { id, content, fileIds } = dto;

    let comment = await this.commentRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
      relations: { commentFiles: { file: true } },
    });
    //test
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

    return CommentResDto.forUser({ data: comment });
  }

  @Transactional()
  async delete(id: number, user: User) {
    const comment = await this.commentRepo.findOneOrThrowNotFoundExc({
      where: { id, userId: user.id },
    });

    await this.commentRepo.softDelete(comment);
    await this.commentFileRepo.softDelete({ commentId: id });
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
}
