import { PartialType } from '@nestjs/swagger';
import {
  IsValidArrayNumber,
  IsValidEnum,
  IsValidNumber,
  IsValidText,
} from 'common';
import { AudienceType, PostReactionType } from 'shared';
import { PaginationReqDto } from '../../../../common/dtos/pagination.dto';

export class GetListMyPostUserReqDto extends PaginationReqDto {}

export class GetListPostUserReqDto extends PaginationReqDto {
  @IsValidNumber({ required: false })
  userId?: number;
}

export class ReactPostUserReqDto {
  @IsValidEnum({ enum: PostReactionType })
  type: PostReactionType;

  @IsValidNumber({ min: 1 })
  postId: number;
}

export class CreatePostUserReqDto {
  @IsValidText({ maxLength: 10000 })
  content: string;

  @IsValidEnum({ enum: AudienceType })
  audienceType: AudienceType;

  @IsValidArrayNumber({ required: false })
  fileIds?: number[];
}

export class UpdatePostUserReqDto extends PartialType(CreatePostUserReqDto) {}

export class LikePostUserReqDto {
  @IsValidNumber({ min: 1 })
  postId: number;
}
