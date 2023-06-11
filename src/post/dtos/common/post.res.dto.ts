import { AudienceType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import {
  CommentResDto,
  CommentResDtoParams,
} from '../../../comment/dtos/common/comment.res.dto';
import { CommentReaction } from '../../../comment/entities/comment-reaction.entity';
import { Comment } from '../../../comment/entities/comment.entity';
import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { PostReaction } from '../../entities/post-reaction.entity';
import { Post } from '../../entities/post.entity';
import { PostReactionResDto } from './post-reaction.res.dto';

export interface PostResDtoParams {
  data?: Post;
  isMutable?: boolean;
  firstComment?: Comment;
  reactionCount?: {
    totalCount: number;
    likeCount: number;
    loveCount: number;
    angryCount: number;
  };
  commentReactionCount?: CommentResDtoParams['reactionCount'];
  totalCommentCount?: number;
  myReaction?: PostReaction;
  myCommentReaction?: CommentReaction;
}

export class PostResDto {
  id: number;
  content: string;
  audienceType: AudienceType;
  user: UserResDto;
  files: FileResDto[];
  createdAt: Date;
  updatedAt: Date;
  isMutable: boolean;
  comments: CommentResDto;
  firstComment: CommentResDto;
  totalCount = 0;
  likeCount = 0;
  loveCount = 0;
  angryCount = 0;
  totalCommentCount = 0;
  myReaction: PostReactionResDto;

  static mapProperty(
    dto: PostResDto,
    { data, isMutable, reactionCount, totalCommentCount }: PostResDtoParams,
  ) {
    dto.id = data.id;
    dto.content = data.content;
    dto.audienceType = data.audienceType;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;
    dto.isMutable = isMutable || false;
    dto.totalCommentCount = totalCommentCount;

    if (reactionCount) {
      dto.totalCount = reactionCount.totalCount;
      dto.likeCount = reactionCount.likeCount;
      dto.angryCount = reactionCount.angryCount;
      dto.loveCount = reactionCount.loveCount;
    }
  }

  static forUser(params: PostResDtoParams) {
    const {
      data,
      firstComment,
      myReaction,
      commentReactionCount,
      myCommentReaction,
    } = params;

    if (!data) return null;
    const result = new PostResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.files = data.postFiles
      ?.sort((a, b) => a.id - b.id)
      ?.map((item) => FileResDto.forUser({ data: item.file }))
      .filter(Boolean);
    result.firstComment = CommentResDto.forUser({
      data: firstComment,
      reactionCount: commentReactionCount,
      myReaction: myCommentReaction,
    });
    result.myReaction = PostReactionResDto.forUser({ data: myReaction });

    return result;
  }
}
