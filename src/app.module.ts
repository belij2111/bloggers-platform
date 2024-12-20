import { configModule } from './config-dynamic-module';
import { DynamicModule, Module } from '@nestjs/common';
import { TestingModule } from './features/testing/testing.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './features/bloggers-platform/bloggers-platform.module';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { CoreConfig } from './core/core.config';
import { CoreModule } from './core/core.module';
import { NotificationsModule } from './features/notifications/notifications.module';

@Module({
  imports: [
    configModule,
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.mongoURI;
        return {
          uri: uri,
        };
      },
      inject: [CoreConfig],
    }),
    CoreModule,
    UserAccountsModule,
    BloggersPlatformModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    const testingModule: any[] = [];
    if (coreConfig.includeTestingModule) {
      testingModule.push(TestingModule);
    }
    return {
      module: AppModule,
      imports: testingModule,
    };
  }
}
