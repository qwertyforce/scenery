/* eslint-disable @typescript-eslint/no-explicit-any */
function parse(tokens: string[]) {
  const operators: any = []
  const operands: any = []
  const priority: any = {
    "!": 3,
    "&&": 2,
    "||": 1
  }
  function operate(operator: string, a: any, b: any = 0) {
    if (a === undefined || b === undefined) {
      return { error: true }
    }
    let x = {}
    switch (operator) {
      case "||":
        x = { '$or': [a, b] }
        break;
      case "&&":
        x = { '$and': [a, b] }
        break;
      case "!":
        x = { '$nor': [a] }
        break;
    }
    return x
  }
  function x(operator: string) {
    while (operators.length > 0 && operators[operators.length - 1] !== "(" && priority[operators[operators.length - 1]] >= priority[operator]) {
      const last_operator = operators.pop()
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
    operators.push(operator)
  }

  function execute_until_opening_bracket() {
    while (operators.length > 0) {
      const last_operator = operators.pop()
      if (last_operator === "(") {
        break;
      }
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
  }
  function execute_remaining() {
    while (operators.length > 0) {
      const last_operator = operators.pop()
      if (last_operator === ")" || last_operator === "(") {
        continue;
      }
      if (last_operator !== "!") {
        const b = operands.pop()
        const a = operands.pop()
        operands.push(operate(last_operator, a, b))
      } else {
        const a = operands.pop()
        operands.push(operate(last_operator, a))
      }
    }
  }
  const comparison_operators = ["==", "<=", ">=", "<", ">"]
  const comparison_operators_mongodb: { [key: string]: string; } = { "==": "$eq", ">": "$gt", "<": "$lt", "<=": "$lte", ">=": "$gte" }
  const expr_tags = ["height", "width"]
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    switch (token) {
      case "||":
        x("||")
        break;
      case ",":
      case "&&":
        x("&&")
        break;
      case "-":
      case "!":
        x("!")
        break;
      case "(":
        operators.push("(")
        break;
      case ")":
        execute_until_opening_bracket()
        break;
      default:
        if (expr_tags.some(tag => token.indexOf(tag) === 0)) {
          let index_of_operator = -1
          let comp_operator = ""
          for (const operator of comparison_operators) {
            if (token.indexOf(operator) !== -1) {
              index_of_operator = token.indexOf(operator)
              comp_operator = operator
              break
            }
          }
          if (index_of_operator !== -1) {
            const arr = [token.slice(0, index_of_operator).trim(), comp_operator, token.slice(comp_operator.length + index_of_operator).trim()]
            if (!isNaN(Number(arr[2]))) {
              operands.push({ [arr[0]]: { [comparison_operators_mongodb[arr[1]]]: parseInt(arr[2]) } })
            }
          }
        } else {
          operands.push({ tags: token })
        }
        break;
    }
  }
  execute_remaining()
  if (operands.length !== 1 || operators.length !== 0) {
    return { error: true }
  } else {
    return operands[0]
  }
}


function split(str: string) {
  const operators = ["&&", "||", "#!", "(%", "%)", ",", "#-"];
  const temp_char = "#_#";
  str = not_operator_fix(str);
  str = detect_brackets(str);
  if (str === "##error##") {
    return []
  }
  for (const operator of operators) {
    str = str.replaceAll(operator, temp_char + operator + temp_char);
  }
  const arr = str.split(temp_char).map((el) => el.trim()).filter((el) => el !== "");
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === "(%") {
      arr[i] = "(";
    }
    if (arr[i] === "#-") {
      arr[i] = "-";
    }
    if (arr[i] === "#!") {
      arr[i] = "!";
    }
    if (arr[i] === "%)") {
      arr[i] = ")";
    }
  }
  // console.log(arr);
  return arr;
}

function detect_brackets(str: string) {
  const tokens = ["&&", "||", "#!", ",", "#-"];
  const tokens2 = ["&&", "||", "#!", "(", ")", ",", "#-"];
  const stack = [];
  const closing_brackets = [];
  const opening_brackets = [];
  for (let i = 0; i < str.length; i++) {
    if (tokens2.includes(str[i])) {
      stack.push({ token: str[i], idx: i });
    }
    if (str[i + 1] && tokens2.includes(str[i] + str[i + 1])) {
      stack.push({ token: str[i] + str[i + 1], idx: i });
    }
    if (stack.length > 0 && str[i] === ")") {
      let x = stack.pop();
      let m = false;
      if (!x) {
        return "##error##"
      }
      while (x.token !== "(") {
        x = stack.pop();
        if (!x) {
          return "##error##"
        }
        if (tokens.includes(x.token)) {
          m = true;
        }
      }
      if (!m && (x.idx > 0 && (tokens.includes(str[x.idx - 1])) || (str[x.idx - 2] && tokens.includes(str[x.idx - 2] + str[x.idx - 1]))) ||
        (x.idx === 0)) {
        closing_brackets.push(i);
        opening_brackets.push(x.idx);
      }
      else if (m) {
        closing_brackets.push(i);
        opening_brackets.push(x.idx);
      }
    }
  }
  const arr = str.split("");
  for (let i = 0; i < closing_brackets.length; i++) {
    arr[opening_brackets[i]] = "(%";
    arr[closing_brackets[i]] = "%)";
  }
  str = arr.join("");
  return str;
}

function not_operator_fix(str: string) {
  const str_arr = str.split("");
  const tokens = ["&&", "||", "!", ",", "-", "(", ")"];
  const not_operators = ["!", "-"];
  const stack = [];
  for (let i = 0; i < str.length; i++) {
    if (tokens.includes(str[i])) {
      stack.push({ token: str[i], idx: i });
    }
    if (str[i + 1] && tokens.includes(str[i] + str[i + 1])) {
      stack.push({ token: str[i] + str[i + 1], idx: i });
    }
  }
  if (stack[0] && stack[0].idx === 0 && not_operators.includes(stack[0].token)) {
    str_arr[0] = "#" + stack[0].token;
  }
  for (let i = 1; i < stack.length; i++) {
    if (not_operators.includes(stack[i].token)) {
      if (stack[i - 1].token !== ")" && stack[i - 1].token.length + stack[i - 1].idx === stack[i].idx) {
        str_arr[stack[i].idx] = "#" + stack[i].token;
      }
    }
  }
  return str_arr.join("");
}


function tokenize(query: string) {
  return split(query)
}


export default function build_ast(str: string) {
  const tokens = tokenize(str)
  if (tokens.length === 0) {
    return { error: true }
  }
  const ast = parse(tokens)
  return ast
}
