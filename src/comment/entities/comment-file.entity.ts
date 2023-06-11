import { BaseEntity } from 'common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { File } from '../../file/entities/file.entity';
import { Comment } from './comment.entity';

@Entity()
export class CommentFile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // join file
  @Column()
  fileId: number;

  @ManyToOne(() => File, (p) => p.commentFiles)
  @JoinColumn()
  file: File;
  // end join file

  // join comment
  @Column()
  commentId: number;

  @ManyToOne(() => Comment, (c) => c.commentFiles)
  @JoinColumn()
  comment: Comment;
  // end join comment
}
