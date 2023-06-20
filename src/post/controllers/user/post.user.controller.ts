import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrefixType } from 'common';
import { User } from '../../../auth/entities/user.entity';
import {
  AuthenticateUser,
  CurrentUser,
} from '../../../common/decorators/auth.decorator';
import { PaginationResponse } from '../../../common/decorators/swagger.decorator';
import { PostResDto } from '../../dtos/common/post.res.dto';
import {
  CreatePostUserReqDto,
  DeleteReactPostUserReqDto,
  GetDetailPostUserReqDto,
  GetListPostUserReqDto,
  ReactPostUserReqDto,
} from '../../dtos/user/req/post.user.req.dto';
import { PostUserService } from '../../services/user/post.user.service';

@Controller(`${PrefixType.USER}/post`)
@AuthenticateUser()
@ApiTags('Post user')
export class PostUserController {
  constructor(private postUserService: PostUserService) {}

  @Get(':id')
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetDetailPostUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.postUserService.getDetail(id, query, user);
  }

  @Get()
  @PaginationResponse(PostResDto)
  getListPosts(
    @Query() query: GetListPostUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.postUserService.getListPosts(query, user);
  }

  @Post('react')
  react(@Body() body: ReactPostUserReqDto, @CurrentUser() user: User) {
    return this.postUserService.reactPost(body, user);
  }

  @Post()
  create(@Body() body: CreatePostUserReqDto, @CurrentUser() user: User) {
    return this.postUserService.create(body, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePostUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.postUserService.update(id, body, user);
  }

  @Delete('react')
  deleteReact(
    @Body() body: DeleteReactPostUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.postUserService.deleteReactPost(body, user);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.postUserService.delete(id, user);
  }
}
