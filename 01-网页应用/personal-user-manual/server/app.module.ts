import { APP_FILTER } from '@nestjs/core';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { VoiceModule } from './modules/voice/voice.module';
import { TimerModule } from './modules/timer/timer.module';
import { ReviewModule } from './modules/review/review.module';
import { ManualModule } from './modules/manual/manual.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AppAuthMiddleware } from './common/middleware/app-auth.middleware';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    AuthModule,
    VoiceModule,
    TimerModule,
    ReviewModule,
    ManualModule,
    FeedbackModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppAuthMiddleware).forRoutes('*');
  }
}
