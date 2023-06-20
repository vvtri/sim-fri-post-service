import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { PostResDto } from '../../../post/dtos/common/post.res.dto';
import { CommentReaction } from '../../entities/comment-reaction.entity';
import { Comment } from '../../entities/comment.entity';
import { CommentFileResDto } from './comment-file.res.dto';
import { CommentReactionResDto } from './comment-reaction.res.dto';

export interface CommentResDtoParams {
  data?: Comment;
  reactionCount?: {
    totalCount: number;
    likeCount: number;
    loveCount: number;
    angryCount: number;
  };
  childCount?: number;
  myReaction?: CommentReaction;
}

export class CommentResDto {
  id: number;
  content: string;
  mpath: string;
  postId: number;
  post: PostResDto;
  children: CommentResDto[];
  parentId: number;
  parent: CommentResDto;
  userId: number;
  user: UserResDto;
  commentFiles: CommentFileResDto[];
  commentReactions: CommentReactionResDto[];
  childCount: number;
  totalCount = 0;
  likeCount = 0;
  loveCount = 0;
  angryCount = 0;
  createdAt: Date;
  myReaction?: CommentReactionResDto;

  static mapProperty(
    dto: CommentResDto,
    { data, childCount, reactionCount }: CommentResDtoParams,
  ) {
    dto.id = data.id;
    dto.content = data.content;
    dto.postId = data.postId;
    dto.userId = data.userId;
    dto.childCount = childCount;
    dto.createdAt = data.createdAt;
    dto.parentId = data.parentId;
    dto.mpath = data.mpath;

    if (reactionCount) {
      dto.totalCount = reactionCount.totalCount;
      dto.likeCount = reactionCount.likeCount;
      dto.angryCount = reactionCount.angryCount;
      dto.loveCount = reactionCount.loveCount;
    }
  }

  static forUser(params: CommentResDtoParams) {
    const { data, myReaction } = params;

    if (!data) return null;
    const result = new CommentResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.post = PostResDto.forUser({ data: data.post });
    result.parent = CommentResDto.forUser({ data: data.parent });
    result.children = data.children
      ?.map((item) => CommentResDto.forUser({ data: item }))
      .filter(Boolean);
    result.commentFiles = data.commentFiles
      ?.map((item) => CommentFileResDto.forUser({ data: item }))
      .filter(Boolean);
    result.commentReactions = data.commentReactions
      ?.map((item) => CommentReactionResDto.forUser({ data: item }))
      .filter(Boolean);
    result.myReaction = CommentReactionResDto.forUser({ data: myReaction });

    return result;
  }
}
