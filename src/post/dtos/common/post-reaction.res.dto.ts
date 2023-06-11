import { PostReactionType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { PostReaction } from '../../entities/post-reaction.entity';
import { PostResDto } from './post.res.dto';

export interface PostReactionResDtoParams {
  data?: PostReaction;
}

export class PostReactionResDto {
  id: number;
  type: PostReactionType;
  userId: number;
  user: UserResDto;
  postId: number;
  post: PostResDto;

  static mapProperty(
    dto: PostReactionResDto,
    { data }: PostReactionResDtoParams,
  ) {
    dto.id = data.id;
    dto.type = data.type;
    dto.postId = data.postId;
    dto.userId = data.userId;
  }

  static forUser(params: PostReactionResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new PostReactionResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.post = PostResDto.forUser({ data: data.post });

    return result;
  }
}
