import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { MailService } from './mail.service';
import { DataController } from './data.controller';
import { DataService as BackendDataService } from './data.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 5,
      },
    ]),
  ],
  controllers: [AppController, ContactController, DataController],
  providers: [
    AppService,
    ContactService,
    MailService,
    BackendDataService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
