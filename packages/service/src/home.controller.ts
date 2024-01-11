import { Controller, Get, Render } from '@nestjs/common';
import { PageRenderProps } from './common';

@Controller('')
export class HomeController {
  @Get()
  @Render('index')
  index(): PageRenderProps {
    return {
      title: 'Bottom Time',
    };
  }
}
