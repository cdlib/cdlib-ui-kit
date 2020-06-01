// Foreach test:

const nodeList = document.querySelectorAll('.test-foreach li')

nodeList.forEach((el) => {
  el.addEventListener('click', function () {
    nodeList.forEach((el) => {
      if (el === this) {
        el.classList.add('selected')
      } else {
        el.classList.remove('selected')
      }
    })
  })
})
