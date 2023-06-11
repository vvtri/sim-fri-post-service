import { Module } from '@nestjs/common';
import { TypeOrmCustomModule } from 'common';
import { UserProfileRepository } from '../auth/repositories/user-profile.repository';
import { FileRepository } from '../file/repositories/file.repository';
import { PostRepository } from '../post/repositories/post.repository';
import { CommentUserController } from './controllers/user/comment.user.controller';
import { CommentFileRepository } from './repositories/comment-file.repository';
import { CommentReactionRepository } from './repositories/comment-reaction.repository';
import { CommentTreeRepository } from './repositories/comment-tree.repository';
import { CommentRepository } from './repositories/comment.repository';
import { CommentUserService } from './services/user/comment.user.service';

@Module({
  imports: [
    TypeOrmCustomModule.forFeature([
      CommentRepository,
      CommentTreeRepository,
      CommentFileRepository,
      CommentReactionRepository,
      PostRepository,
      UserProfileRepository,
      FileRepository,
    ]),
  ],
  controllers: [CommentUserController],
  providers: [CommentUserService],
})
export class CommentModule {}
