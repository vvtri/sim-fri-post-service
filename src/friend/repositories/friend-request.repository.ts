import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'common';
import { FriendRequestStatus } from 'shared';
import { DataSource } from 'typeorm';
import { FriendRequest } from '../entities/friend-request.entity';

@Injectable()
export class FriendRequestRepository extends BaseRepository<FriendRequest> {
  constructor(dataSource: DataSource) {
    super(FriendRequest, dataSource);
  }

  async isFriend(user1Id: number, user2Id: number) {
    if (user1Id === user2Id) return true;

    const result = await this.exist({
      where: [
        {
          requesterId: user1Id,
          beRequestedId: user2Id,
          status: FriendRequestStatus.ACCEPTED,
        },
        {
          beRequestedId: user1Id,
          requesterId: user2Id,
          status: FriendRequestStatus.ACCEPTED,
        },
      ],
    });

    return result;
  }
}
