import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { OperatorEntity } from './operators.entity';
import { UserEntity } from './user.entity';

@Entity('dive_operator_team_members')
@Index(['operator', 'teamMember'], { unique: true })
export class OperatorTeamMemberEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null = null;

  @Column({ type: 'timestamp', nullable: true })
  joined: Date | null = null;

  @ManyToOne(() => OperatorEntity, (operator) => operator.teamMembers, {
    onDelete: 'CASCADE',
  })
  operator?: OperatorEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  teamMember?: UserEntity;
}
