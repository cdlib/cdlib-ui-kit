const faker = require('faker/locale/en');

module.exports = {
  label: 'Toolkit Tests',
  context: {
    test: {
      text: faker.lorem.paragraph()
    }
  }
};
