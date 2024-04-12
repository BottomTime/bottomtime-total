import { Entity, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('log_entries')
export class LogEntryEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  // Who?
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  // What?

  // Where?
  /*
    - Maybe a site?
    - Maybe a specified location?
    - This has to be pretty flexible
  */

  // When?
  /*
    - Need a time/date w/ a timezone
    - Need to consider other timing as well... I think everything should be relevant to the start time.
    - How do I define start time though? Is it when the user enters the water? When they descend? Can I extract this from dive computer data?
  */

  // Why?

  // How?
}
