const faker = require('faker/locale/en');

if (process.env.NODE_ENV === 'testing') {
  faker.seed(123);
}

module.exports = {
  label: 'Other',
  preview: '@template-page',
  order: 2,
  context: {
    test: {
      text: faker.lorem.paragraph()
    }
  }
};
