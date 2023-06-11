import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { PostFile } from '../../entities/post-file.entity';
import { PostResDto } from './post.res.dto';

export interface PostFileResDtoParams {
  data?: PostFile;
}

export class PostFileResDto {
  id: number;
  postId: number;
  post: PostResDto;
  fileId: number;
  file: FileResDto;

  static mapProperty(dto: PostFileResDto, { data }: PostFileResDtoParams) {
    dto.id = data.id;
    dto.postId = data.postId;
    dto.fileId = data.fileId;
  }

  static forUser(params: PostFileResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new PostFileResDto();

    this.mapProperty(result, params);

    result.post = PostResDto.forUser({ data: data.post });
    result.file = FileResDto.forUser({ data: data.file });

    return result;
  }
}
