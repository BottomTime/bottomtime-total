import { Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { OperatorEntity } from './operators.entity';

@Entity('dive_operator_sites')
@Index(['operator', 'site'], { unique: true })
export class OperatorDiveSiteEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => OperatorEntity, (operator) => operator.diveSites, {
    onDelete: 'CASCADE',
  })
  operator: OperatorEntity = new OperatorEntity();

  @ManyToOne(() => DiveSiteEntity, (site) => site.operators, {
    onDelete: 'CASCADE',
  })
  site: DiveSiteEntity = new DiveSiteEntity();
}
