import { Module } from '@nestjs/common';
import { TypeOrmCustomModule } from 'common';
import { UserRepository } from '../auth/repositories/user.repository';
import { CommentModule } from '../comment/comment.module';
import { CommentReactionRepository } from '../comment/repositories/comment-reaction.repository';
import { CommentRepository } from '../comment/repositories/comment.repository';
import { FriendRequestRepository } from '../friend/repositories/friend-request.repository';
import { PostUserController } from './controllers/user/post.user.controller';
import { PostFileRepository } from './repositories/post-file.repository';
import { PostReactionRepository } from './repositories/post-reaction.repository';
import { PostRepository } from './repositories/post.repository';
import { PostUserService } from './services/user/post.user.service';

@Module({
  imports: [
    TypeOrmCustomModule.forFeature([
      PostRepository,
      UserRepository,
      PostFileRepository,
      CommentRepository,
      PostReactionRepository,
      CommentReactionRepository,
      FriendRequestRepository,
    ]),
    CommentModule,
  ],
  controllers: [PostUserController],
  providers: [PostUserService],
})
export class PostModule {}
