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
import { CommentResDto } from '../../dtos/common/comment.res.dto';
import {
  CreateCommentUserReqDto,
  GetListCommentUserReqDto,
  GetListReplyCommentUserReqDto,
  ReactCommentUserReqDto,
  UpdateCommentUserReqDto,
} from '../../dtos/user/req/comment.user.req.dto';
import { CommentUserService } from '../../services/user/comment.user.service';

@Controller(`${PrefixType.USER}/comment`)
@AuthenticateUser()
@ApiTags('Comment User')
export class CommentUserController {
  constructor(private commentUserService: CommentUserService) {}

  @Get('/')
  @PaginationResponse(CommentResDto)
  getList(@Query() dto: GetListCommentUserReqDto, @CurrentUser() user: User) {
    return this.commentUserService.getList(dto, user);
  }

  @Get('/reply')
  getListReply(
    @Query() dto: GetListReplyCommentUserReqDto,
    @CurrentUser() user: User,
  ) {
    return this.commentUserService.getListReply(dto, user);
  }

  @Post('react')
  react(@Body() body: ReactCommentUserReqDto, @CurrentUser() user: User) {
    return this.commentUserService.reactComment(body, user);
  }

  @Post()
  create(@Body() body: CreateCommentUserReqDto, @CurrentUser() user: User) {
    return this.commentUserService.create(body, user);
  }

  @Patch('')
  update(@Body() body: UpdateCommentUserReqDto, @CurrentUser() user: User) {
    return this.commentUserService.update(body, user);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.commentUserService.delete(id, user);
  }
}
