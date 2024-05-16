import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('achievements')
export class AchievementEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 200 })
  name: string = '';

  @Column({ type: 'varchar', length: 2000 })
  description: string = '';
}
