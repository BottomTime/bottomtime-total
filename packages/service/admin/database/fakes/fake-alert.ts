import { faker } from '@faker-js/faker';

import { AlertEntity } from '../../../src/data';
import { possibly } from './possibly';

const fakeMarkdown = () => `
> ${faker.lorem.sentence()}

${faker.lorem.paragraph()} :+1:

[click here](${faker.internet.url()})`;

export function fakeAlert(): AlertEntity {
  const data = new AlertEntity();

  data.id = faker.datatype.uuid();
  data.icon = '';
  data.title = `${faker.word.verb()} ${faker.word.adjective()} ${faker.word.noun()}`;
  data.message = fakeMarkdown();
  data.active = faker.date.recent(3);
  data.expires = possibly(() => faker.date.soon(30), 0.85) ?? null;

  return data;
}
