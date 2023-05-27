import { BaseEntity } from 'common';
import { AudienceType } from 'shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { PostFile } from './post-file.entity';
import { PostReaction } from './post-reaction.entity';

@Entity()
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 2000 })
  content: string;

  @Column({ enum: AudienceType, type: 'enum' })
  audienceType: AudienceType;

  // join user
  @Column()
  userId: number;

  @ManyToOne(() => User, (u) => u.posts)
  @JoinColumn()
  user: User;
  // end join user

  @OneToMany(() => PostFile, (pf) => pf.post)
  postFiles: PostFile[];

  @OneToMany(() => PostReaction, (pr) => pr.post)
  postReactions: PostReaction[];
}
