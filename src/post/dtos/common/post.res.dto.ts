import { AudienceType } from 'shared';
import { UserResDto } from '../../../auth/dtos/common/res/user.res.dto';
import { FileResDto } from '../../../file/dtos/common/file.res.dto';
import { Post } from '../../entities/post.entity';

export interface PostResDtoParams {
  data?: Post;
  isMutable?: boolean;
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

  static mapProperty(dto: PostResDto, { data, isMutable }: PostResDtoParams) {
    dto.id = data.id;
    dto.content = data.content;
    dto.audienceType = data.audienceType;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;
    dto.isMutable = isMutable || false;
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
