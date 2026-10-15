import { Module } from '@nestjs/common';

import { FocusController } from './focus.controller';
import { FocusService } from './focus.service';

@Module({
  controllers: [FocusController],
  providers: [FocusService],
  imports: [],
})
export class FocusModule {}
