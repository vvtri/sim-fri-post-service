import { PartialType } from '@nestjs/swagger';
import {
  IsValidArrayNumber,
  IsValidEnum,
  IsValidNumber,
  IsValidText,
  PaginationReqDto,
} from 'common';
import { AudienceType } from 'shared';

export class GetListMyPostUserReqDto extends PaginationReqDto {}

export class GetListPostUserReqDto extends PaginationReqDto {
  @IsValidNumber({ required: false })
  userId?: number;
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
