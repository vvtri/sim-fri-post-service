import { CommentReactionType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { CommentReaction } from '../../entities/comment-reaction.entity';
import { CommentResDto } from './comment.res.dto';

export interface CommentReactionResDtoParams {
  data?: CommentReaction;
}

export class CommentReactionResDto {
  id: number;
  type: CommentReactionType;
  commentId: number;
  comment: CommentResDto;
  userId: number;
  user: UserResDto;

  static mapProperty(
    dto: CommentReactionResDto,
    { data }: CommentReactionResDtoParams,
  ) {
    dto.id = data.id;
    dto.type = data.type;
    dto.commentId = data.commentId;
    dto.userId = data.userId;
  }

  static forUser(params: CommentReactionResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new CommentReactionResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.comment = CommentResDto.forUser({ data: data.comment });

    return result;
  }
}
