import { Injectable } from '@nestjs/common';
import { ApiExtraModels } from '@nestjs/swagger';
import { ExpectationFailedExc, PaginationResDto } from 'common';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import { AudienceType } from 'shared';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../../auth/entities/user.entity';
import { PostResDto } from '../../dtos/common/post.res.dto';
import {
  CreatePostUserReqDto,
  GetListPostUserReqDto,
  UpdatePostUserReqDto,
} from '../../dtos/user/req/post.user.req.dto';
import { PostFile } from '../../entities/post-file.entity';
import { PostFileRepository } from '../../repositories/post-file.repository';
import { PostRepository } from '../../repositories/post.repository';

@Injectable()
@ApiExtraModels(PaginationResDto)
export class PostUserService {
  constructor(
    private postRepo: PostRepository,
    private postFileRepo: PostFileRepository,
  ) {}

  @Transactional()
  async getMyPosts(dto: GetListPostUserReqDto, user: User) {
    const { limit, page } = dto;

    const qb = this.postRepo
      .createQueryBuilder('p')
      .where('p.userId = :userId', { userId: user.id });

    const { items, meta } = await paginate(qb, { page, limit });

    const result = items.map((item) => PostResDto.forUser({ data: item }));

    return new Pagination(result, meta);
  }

  @Transactional()
  async getListPosts(dto: GetListPostUserReqDto, user: User) {
    const { limit, page, userId } = dto;

    const isFriend = true;
    const audienceTypes = [AudienceType.PUBLIC];
    if (isFriend) {
      audienceTypes.push(AudienceType.FRIEND);
    }

    const qb = this.postRepo
      .createQueryBuilder('p')
      .where('p.audienceType IN (:...audienceTypes)', { audienceTypes })
      .groupBy('p.id')
      .select('p.id');

    if (userId) {
      qb.andWhere('p.userId = :userId', { userId });
    }

    const { items, meta } = await paginate(qb, { page, limit });

    const result = await Promise.all(
      items.map(async (item) => {
        const post = await this.postRepo.findOne({
          where: { id: item.id },
          relations: { postFiles: { file: true }, user: { userProfile: true } },
        });
        return PostResDto.forUser({ data: post });
      }),
    );

    return new Pagination(result, meta);
  }

  @Transactional()
  async getDetail(id: number, user: User) {
    const post = await this.postRepo.findOneOrThrowNotFoundExc({
      where: { id },
      relations: { postFiles: { file: true }, user: { userProfile: true } },
    });

    switch (post.audienceType) {
      case AudienceType.ONLY_ME:
        if (user.id !== post.userId)
          throw new ExpectationFailedExc({ statusCode: 1 }); //todo
      case AudienceType.FRIEND:
        const isFriend = true;
        if (!isFriend) throw new ExpectationFailedExc({ statusCode: 1 });
    }

    return PostResDto.forUser({ data: post });
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
