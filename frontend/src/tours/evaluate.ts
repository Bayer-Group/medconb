const evaluate = (str: string, context: any) => {
  const newStr = str.replaceAll(
    /\[IF([^\]]*)\](((?!(\[FI\]|\[ELSE\]))[\s\S])*)(\[ELSE\])?([\s\S]*?)\[FI\]/g,
    (m, ...rest) => {
      // console.log(m, rest)
      const [exp, ifStr, _, __, ___, elseStr] = rest

      const evaluator = make_context_evaluator(exp.trim(), context)

      return evaluator(context) ? ifStr : elseStr
    },
  )

  return newStr
}

export default evaluate

const create_context_function_template = (eval_string: string, context: any) => {
  return `
  return function (context) {
    "use strict";
    ${Object.keys(context).length > 0 ? `let ${Object.keys(context).map((key) => ` ${key} = context['${key}']`)};` : ``}
    return ${eval_string};
  }                                                                                                                   
  `
}

const make_context_evaluator = (eval_string: string, context: any) => {
  const template = create_context_function_template(eval_string, context)
  const functor = Function(template)
  return functor()
}
