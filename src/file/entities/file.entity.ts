import { BaseEntity } from 'common';
import { AudienceType, FileType } from 'shared';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { UserProfile } from '../../auth/entities/user-profile.entity';
import { User } from '../../auth/entities/user.entity';
import { CommentFile } from '../../comment/entities/comment-file.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { PostFile } from '../../post/entities/post-file.entity';

@Entity()
export class File extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ length: 255 })
  key: string;

  @Column({ length: 255 })
  bucket: string;

  @Column({ default: 0 })
  size: string;

  @Column({ type: 'enum', enum: AudienceType })
  audienceType: AudienceType;

  @Column({ type: 'enum', enum: FileType })
  fileType: FileType;

  // join user
  @Column()
  userId: number;

  @ManyToOne(() => User, (u) => u.files)
  @JoinColumn()
  user: User;
  // end join user

  @OneToMany(() => PostFile, (pf) => pf.post)
  postFiles: PostFile[];

  @OneToOne(() => UserProfile, (up) => up.avatar)
  userProfile: UserProfile;

  @OneToMany(() => CommentFile, (cf) => cf.file)
  commentFiles: Comment[];
}
