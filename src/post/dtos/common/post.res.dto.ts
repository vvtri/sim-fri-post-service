import { AudienceType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { Post } from '../../entities/post.entity';

export interface PostResDtoParams {
  data?: Post;
}

export class PostResDto {
  id: number;
  content: string;
  audienceType: AudienceType;
  user: UserResDto;
  files: FileResDto[];

  static mapProperty(dto: PostResDto, { data }: PostResDtoParams) {
    dto.id = data.id;
    dto.content = data.content;
    dto.audienceType = data.audienceType;
  }

  static forUser(params: PostResDtoParams) {
    const { data } = params;

    if (!data) return null;
    const result = new PostResDto();

    this.mapProperty(result, params);

    result.user = UserResDto.forUser({ data: data.user });
    result.files = data.postFiles
      ?.sort((a, b) => a.id - b.id)
      ?.map((item) => FileResDto.forUser({ data: item.file }))
      .filter(Boolean);

    return result;
  }
}
