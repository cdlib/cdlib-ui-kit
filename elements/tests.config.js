const faker = require('faker/locale/en');

if (process.env.NODE_ENV === 'testing') {
  faker.seed(123);
}

module.exports = {
  label: 'Tests',
  order: 1,
  context: {
    test: {
      text: faker.lorem.paragraph()
    }
  }
};
