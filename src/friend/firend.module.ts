import { Module } from '@nestjs/common';
import { TypeOrmCustomModule } from 'common';
import { UserRepository } from '../auth/repositories/user.repository';
import { FriendRequestRepository } from './repositories/friend-request.repository';
import { FriendRequestListenerService } from './services/friend-request-listener.service';

@Module({
  imports: [
    TypeOrmCustomModule.forFeature([FriendRequestRepository, UserRepository]),
  ],
  providers: [FriendRequestListenerService],
})
export class FriendModule {}
