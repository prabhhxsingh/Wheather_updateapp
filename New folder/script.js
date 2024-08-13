let display = document.getElementById('display');
let currentInput = '';
let operator = '';

function appendToDisplay(value) {
  if (display.textContent === '0' && value !== '.') {
    display.textContent = value;
  } else {
    display.textContent += value;
  }
  
  if (!isNaN(value) || value === '.') {
    currentInput += value;
  } else if (value === '+' || value === '-' || value === '*' || value === '/') {
    operator = value;
    currentInput += value;
  }
}

function clearDisplay() {
  display.textContent = '0';
  currentInput = '';
  operator = '';
}

function calculate() {
  let result = eval(currentInput);
  display.textContent = result;
  currentInput = result.toString();
}

function toggleNegative() {
  let currentValue = parseFloat(display.textContent);
  display.textContent = currentValue * -1;
  currentInput = display.textContent;
}
