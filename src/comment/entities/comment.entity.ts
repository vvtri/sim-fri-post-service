import { BaseEntity } from 'common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { CommentFile } from './comment-file.entity';
import { CommentReaction } from './comment-reaction.entity';

@Entity()
@Tree('materialized-path', {})
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 2000 })
  content: string;

  // join post
  @Column()
  postId: number;

  @ManyToOne(() => Post, (p) => p.comments)
  @JoinColumn()
  post: Post;
  // end join post

  @TreeChildren()
  children: Comment[];

  @Column({ nullable: true })
  parentId: number;

  @TreeParent()
  @JoinColumn()
  parent: Comment;

  mpath?: string;

  // join user
  @Column()
  userId: number;

  @ManyToOne(() => User, (u) => u.comments)
  @JoinColumn()
  user: User;
  // end join user

  @OneToMany(() => CommentFile, (cf) => cf.comment)
  commentFiles: CommentFile[];

  @OneToMany(() => CommentReaction, (cr) => cr.comment)
  commentReactions: CommentReaction[];
}
