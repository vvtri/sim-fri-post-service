import { BaseEntity } from 'common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { File } from '../../file/entities/file.entity';
import { Post } from './post.entity';

@Entity()
export class PostFile extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // join user
  @Column()
  postId: number;

  @ManyToOne(() => Post, (p) => p.postFiles)
  @JoinColumn()
  post: Post;
  // end join user

  // join user
  @Column()
  fileId: number;

  @ManyToOne(() => File, (u) => u.postFiles)
  @JoinColumn()
  file: File;
  // end join user
}
