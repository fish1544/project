import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AppAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
