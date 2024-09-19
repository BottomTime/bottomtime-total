import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('invalid_tokens')
export class InvalidTokenEntity {
  @PrimaryColumn('varchar', { length: 255 })
  token: string = '';

  @Column('timestamp')
  @Index()
  invalidated: Date = new Date();
}
