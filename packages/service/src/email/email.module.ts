import { DynamicModule, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { IMailClient, MailClientService } from './interfaces';

@Module({})
export class EmailModule {
  private static mailClient: IMailClient | undefined;
  private static baseModule: Partial<DynamicModule> = {
    imports: [],
    providers: [
      {
        provide: MailClientService,
        useFactory: () => {
          if (!EmailModule.mailClient) {
            throw new Error(
              'Mail client not initialized Did you remember to call EmailModule.forRoot()?',
            );
          }
          return EmailModule.mailClient;
        },
      },
      EmailService,
    ],
    exports: [EmailService],
  };

  static forRoot(mailClient: IMailClient): DynamicModule {
    EmailModule.mailClient = mailClient;
    return {
      module: EmailModule,
      ...EmailModule.baseModule,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: EmailModule,
      ...EmailModule.baseModule,
    };
  }
}
