import { Module } from '@nestjs/common';
import { TypeOrmCustomModule } from 'common';
import { UserRepository } from '../auth/repositories/user.repository';
import { PostUserController } from './controllers/user/post.user.controller';
import { PostFileRepository } from './repositories/post-file.repository';
import { PostRepository } from './repositories/post.repository';
import { PostUserService } from './services/user/post.user.service';

@Module({
  imports: [
    TypeOrmCustomModule.forFeature([
      PostRepository,
      UserRepository,
      PostFileRepository,
    ]),
  ],
  controllers: [PostUserController],
  providers: [PostUserService],
})
export class PostModule {}
