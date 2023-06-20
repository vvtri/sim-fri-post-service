import { AudienceType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { CommentResDto } from '../../../comment/dtos/common/comment.res.dto';
import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { PostReaction } from '../../entities/post-reaction.entity';
import { Post } from '../../entities/post.entity';
import { PostReactionResDto } from './post-reaction.res.dto';

export interface PostResDtoParams {
  data?: Post;
  firstComment?: CommentResDto;
  reactionCount?: {
    totalCount: number;
    likeCount: number;
    loveCount: number;
    angryCount: number;
  };
  totalCommentCount?: number;
  myReaction?: PostReaction;
  totalDirectCommentCount?: number;
}

export class PostResDto {
  id: number;
  content: string;
  audienceType: AudienceType;
  user: UserResDto;
  files: FileResDto[];
  createdAt: Date;
  updatedAt: Date;
  comments: CommentResDto;
  firstComment: CommentResDto;
  totalCount = 0;
  likeCount = 0;
  loveCount = 0;
  angryCount = 0;
  totalCommentCount = 0;
  totalDirectCommentCount = 0;
  myReaction: PostReactionResDto;

  static mapProperty(
    dto: PostResDto,
    {
      data,
      totalDirectCommentCount,
      reactionCount,
      totalCommentCount,
      firstComment,
    }: PostResDtoParams,
  ) {
    dto.id = data.id;
    dto.content = data.content;
    dto.audienceType = data.audienceType;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;
    dto.totalCommentCount = totalCommentCount;
    dto.totalDirectCommentCount = totalDirectCommentCount;
    dto.firstComment = firstComment;

    if (reactionCount) {
      dto.totalCount = reactionCount.totalCount;
      dto.likeCount = reactionCount.likeCount;
      dto.angryCount = reactionCount.angryCount;
      dto.loveCount = reactionCount.loveCount;
    }
  }

  static forUser(params: PostResDtoParams) {
    const { data, firstComment, myReaction } = params;

    if (!data) return null;
    const result = new PostResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.files = data.postFiles
      ?.sort((a, b) => a.id - b.id)
      ?.map((item) => FileResDto.forUser({ data: item.file }))
      .filter(Boolean);
    result.myReaction = PostReactionResDto.forUser({ data: myReaction });

    return result;
  }
}
