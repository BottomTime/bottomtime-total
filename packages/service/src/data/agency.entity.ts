import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('agencies')
export class AgencyEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'integer', nullable: true })
  @Index()
  ordinal: number | null = null;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string = '';

  @Column({ type: 'varchar', length: 200, nullable: true })
  longName: string | null = null;

  @Column({ type: 'varchar', length: 250 })
  logo: string = '';

  @Column({ type: 'varchar', length: 250 })
  website: string = '';
}
