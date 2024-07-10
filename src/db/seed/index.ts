// eslint-disable-next-line import/no-extraneous-dependencies
import { faker } from '@faker-js/faker';

import { NewPart, parts as partSchema } from '../../api/part/part.models';
import { db } from '..';

async function seed() {
  const parts: NewPart[] = [];

  for (let i = 0; i < 20; i++) {
    const partNumber =
      faker.number.int({ min: 1000, max: 9999 }) +
      '.' +
      faker.number.int({ min: 1000, max: 9999 }) +
      '.' +
      faker.number.int({ min: 1000, max: 9999 });

    parts.push({
      partNumber: partNumber,
      name: faker.word.adverb() + ' ' + faker.word.noun(),
      description: faker.lorem.sentences(4),
    });
  }

  await db.insert(partSchema).values(parts);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seeding done!');
    process.exit(0);
  });
