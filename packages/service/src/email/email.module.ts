import { DynamicModule, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { IMailClient, MailClientService } from './interfaces';

@Module({})
export class EmailModule {
  static register(mailClient: IMailClient): DynamicModule {
    return {
      module: EmailModule,
      imports: [],
      providers: [
        {
          provide: MailClientService,
          useValue: mailClient,
        },
        EmailService,
      ],
      controllers: [],
      exports: [EmailService],
    };
  }
}
