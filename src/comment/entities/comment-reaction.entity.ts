import { BaseEntity, PartialIndexWithSoftDelete } from 'common';
import { CommentReactionType } from 'shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Comment } from './comment.entity';

@Entity()
@PartialIndexWithSoftDelete(['commentId', 'userId'], { unique: true })
export class CommentReaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: CommentReactionType })
  type: CommentReactionType;

  // join comment
  @Column()
  commentId: number;

  @ManyToOne(() => Comment, (c) => c.commentReactions)
  @JoinColumn()
  comment: Comment;
  // end join comment

  // join user
  @Column()
  userId: number;

  @ManyToOne(() => User, (u) => u.commentReactions)
  @JoinColumn()
  user: User;
  // end join user
}
