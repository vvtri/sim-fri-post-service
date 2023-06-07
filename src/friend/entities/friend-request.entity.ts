import { BaseEntity } from 'common';
import { FriendRequestStatus } from 'shared';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class FriendRequest extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'enum', enum: FriendRequestStatus })
  status: FriendRequestStatus;

  @Column()
  requesterId: number;

  @ManyToOne(() => User, (u) => u.friendRequesters)
  @JoinColumn()
  requester: User;

  @Column()
  beRequestedId: number;

  @ManyToOne(() => User, (u) => u.friendBeRequesteds)
  @JoinColumn()
  beRequested: User;
}
