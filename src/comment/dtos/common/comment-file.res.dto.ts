import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { CommentFile } from '../../entities/comment-file.entity';
import { CommentResDto } from './comment.res.dto';

export interface CommentFileResDtoParams {
  data?: CommentFile;
}

export class CommentFileResDto {
  id: number;
  fileId: number;
  file: FileResDto;
  commentId: number;
  comment: CommentResDto;

  static mapProperty(
    dto: CommentFileResDto,
    { data }: CommentFileResDtoParams,
  ) {
    dto.id = data.id;
    dto.fileId = data.fileId;
    dto.commentId = data.commentId;
  }

  static forUser(params: CommentFileResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new CommentFileResDto();

    this.mapProperty(result, params);

    result.file = FileResDto.forUser({ data: data.file });
    result.comment = CommentResDto.forUser({ data: data.comment });

    return result;
  }
}
