import { SetMetadata } from '@nestjs/common';

export const NEED_APP_LOGIN_KEY = 'needAppLogin';

export const NeedAppLogin = () => SetMetadata(NEED_APP_LOGIN_KEY, true);
