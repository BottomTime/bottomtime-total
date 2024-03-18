import { TankMaterial } from '@bottomtime/api';

import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('tanks')
export class TankEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, (user) => user.tanks, { onDelete: 'CASCADE' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string = '';

  @Column({ type: 'enum', enum: TankMaterial })
  material: TankMaterial = TankMaterial.Aluminum;

  @Column({ type: 'float' })
  workingPressure: number = 0;

  @Column({ type: 'float' })
  volume: number = 0;
}
