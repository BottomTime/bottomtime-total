import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
@Index(['provider', 'providerId'], { unique: true })
export class UserOAuthEntity {
  @Column()
  provider: string = '';

  @Column()
  providerId: string = '';

  @ManyToOne(() => UserEntity, (user) => user.oauth, { onDelete: 'CASCADE' })
  user: UserEntity = new UserEntity();
}
