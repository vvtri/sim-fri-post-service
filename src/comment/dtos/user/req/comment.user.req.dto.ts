import { OmitType, PartialType } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import {
  IsValidArrayNumber,
  IsValidEnum,
  IsValidNumber,
  IsValidText,
} from 'common';
import { CommentReactionType } from 'shared';
import { PaginationReqDto } from '../../../../common/dtos/pagination.dto';

export class GetListCommentUserReqDto extends PaginationReqDto {
  @IsValidNumber({ min: 1 })
  postId: number;
}

export class GetListReplyCommentUserReqDto extends PaginationReqDto {
  @IsValidNumber({ min: 1 })
  parentId: number;
}

export class CreateCommentUserReqDto {
  @IsValidText({ maxLength: 10000 })
  content: string;

  @IsValidArrayNumber({ required: false })
  fileIds?: number[];

  @IsValidNumber({ min: 1, required: false })
  @ValidateIf(({ postId }) => !postId)
  parentId?: number;

  @IsValidNumber({ min: 1 })
  @ValidateIf(({ commentId }) => !commentId)
  postId: number;
}

export class UpdateCommentUserReqDto extends PartialType(
  OmitType(CreateCommentUserReqDto, ['parentId', 'postId']),
) {
  @IsValidNumber({ min: 1 })
  id: number;
}

export class ReactCommentUserReqDto {
  @IsValidNumber({ min: 1 })
  commentId: number;

  @IsValidEnum({ enum: CommentReactionType })
  type: CommentReactionType;
}

export class DeleteReactCommentUserReqDto {
  @IsValidNumber({ min: 1 })
  commentId: number;
}
