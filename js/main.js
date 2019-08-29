var bodytagtest = document.getElementsByTagName('body')[0]

bodytagtest.classList.add('js-working');

var selectortest = document.querySelector('.test-javascript')

selectortest.innerHTML = 'yes'

const arrowFunctionTest = (x, y) => {
  return x * y
}

console.log(arrowFunctionTest(7, 7))
