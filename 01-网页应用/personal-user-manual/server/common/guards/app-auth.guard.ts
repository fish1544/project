import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { NEED_APP_LOGIN_KEY } from '../decorators/need-app-login.decorator';

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const needLogin = this.reflector.getAllAndOverride<boolean>(
      NEED_APP_LOGIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!needLogin) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!request.appUserId) {
      throw new UnauthorizedException('未登录或登录已过期');
    }

    return true;
  }
}
