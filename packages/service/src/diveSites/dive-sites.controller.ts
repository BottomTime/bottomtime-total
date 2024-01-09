import { Controller } from '@nestjs/common';
import { DiveSitesService } from './dive-sites.service';

@Controller('diveSites')
export class DiveSitesController {
  constructor(private readonly diveSitesService: DiveSitesService) {}
}
