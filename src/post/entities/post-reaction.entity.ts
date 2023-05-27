import { BaseEntity } from 'common';
import { PostReactionType } from 'shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Post } from './post.entity';

@Entity()
export class PostReaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: PostReactionType })
  type: PostReactionType;

  // join user
  @Column()
  userId: number;

  @ManyToOne(() => User, (p) => p.postReactions)
  @JoinColumn()
  user: User;
  // end join user

  // join post
  @Column()
  postId: number;

  @ManyToOne(() => Post, (u) => u.postReactions)
  @JoinColumn()
  post: Post;
  // end join post
}
