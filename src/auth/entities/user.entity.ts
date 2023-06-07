import { BaseEntity } from 'common';
import { UserStatus } from 'shared';
import { Column, Entity, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { File } from '../../file/entities/file.entity';
import { FriendRequest } from '../../friend/entities/friend-request.entity';
import { PostReaction } from '../../post/entities/post-reaction.entity';
import { Post } from '../../post/entities/post.entity';
import { UserProfile } from './user-profile.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'enum', enum: UserStatus })
  status: UserStatus;

  @Column({ name: 'phone_number', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @OneToMany(() => File, (f) => f.user)
  files: File[];

  @OneToMany(() => Post, (p) => p.user)
  posts: Post[];

  @OneToMany(() => PostReaction, (p) => p.user)
  postReactions: PostReaction[];

  @OneToOne(() => UserProfile, (up) => up.user)
  userProfile: UserProfile;

  @OneToMany(() => FriendRequest, (f) => f.requester)
  friendRequesters: FriendRequest[];

  @OneToMany(() => FriendRequest, (f) => f.beRequested)
  friendBeRequesteds: FriendRequest[];
}
