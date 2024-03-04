import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('user_oauth')
@Index(['provider', 'providerId'], { unique: true })
export class UserOAuthEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column()
  provider: string = '';

  @Column()
  providerId: string = '';

  @ManyToOne(() => UserEntity, (user) => user.oauth, { onDelete: 'CASCADE' })
  user: UserEntity = new UserEntity();
}
