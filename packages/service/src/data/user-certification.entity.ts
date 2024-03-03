import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
export class UserCertificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, (user) => user.certifications, {
    onDelete: 'CASCADE',
  })
  user: UserEntity = new UserEntity();

  @Column({ type: 'varchar', length: 100 })
  agency: string = '';

  @Column({ type: 'varchar', length: 200 })
  course: string = '';

  @Column({ type: 'timestamp' })
  date?: Date;
}
