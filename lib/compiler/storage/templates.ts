import type { FlowchartState } from '../types'

export type TemplateType = 
  | 'empty' 
  | 'hello' 
  | 'loop' 
  | 'factorial' 
  | 'collatz' 
  | 'fibonacci' 
  | 'factorial_interactive' 
  | 'auxiliary'

export interface TemplateDefinition {
  type: TemplateType
  name: string
  description: string
  state: FlowchartState
}

export const TEMPLATES: Record<TemplateType, TemplateDefinition> = {
  empty: {
    type: 'empty',
    name: 'Proyecto Vacío',
    description: 'Comienza desde cero con un canvas limpio para construir tu propio flujo de ejecución.',
    state: {
      nodes: [
        {
          id: 'start-node',
          type: 'start-end',
          position: { x: 350, y: 100 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        }
      ],
      connections: [],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  hello: {
    type: 'hello',
    name: 'Hola Mundo',
    description: 'Un programa simple que inicializa la ejecución y realiza una impresión en consola estándar.',
    state: {
      nodes: [
        {
          id: 'start-hello',
          type: 'start-end',
          position: { x: 350, y: 80 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'print-hello',
          type: 'process',
          position: { x: 330, y: 200 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Hola Mundo',
          connections: [],
          data: {
            processType: 'print',
            printContent: '"¡Hola, Mundo!\\n"'
          }
        },
        {
          id: 'return-hello',
          type: 'return',
          position: { x: 350, y: 320 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-hello-1',
          sourceId: 'start-hello',
          targetId: 'print-hello',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-hello-2',
          sourceId: 'print-hello',
          targetId: 'return-hello',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  loop: {
    type: 'loop',
    name: 'Bucle del 1 al 5',
    description: 'Demuestra el uso de variables locales y un condicional iterativo While para realizar conteos.',
    state: {
      nodes: [
        {
          id: 'start-loop',
          type: 'start-end',
          position: { x: 350, y: 40 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'decl-loop',
          type: 'input-output',
          position: { x: 340, y: 140 },
          size: { width: 160, height: 60 },
          content: 'int i = 1',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'i',
              type: 'int',
              value: '1'
            }
          }
        },
        {
          id: 'while-loop',
          type: 'decision',
          position: { x: 345, y: 240 },
          size: { width: 150, height: 80 },
          content: 'while (i <= 5)',
          connections: [],
          data: {
            conditionalType: 'while',
            condition: 'i <= 5',
            cases: []
          }
        },
        {
          id: 'print-loop',
          type: 'process',
          position: { x: 330, y: 370 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: i = {i}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'i = {i}'
          }
        },
        {
          id: 'inc-loop',
          type: 'process',
          position: { x: 340, y: 470 },
          size: { width: 160, height: 60 },
          content: 'i++',
          connections: [],
          data: {
            processType: 'increment',
            variableName: 'i',
            incrementAmount: 1
          }
        },
        {
          id: 'return-loop',
          type: 'return',
          position: { x: 570, y: 250 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-loop-1',
          sourceId: 'start-loop',
          targetId: 'decl-loop',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-loop-2',
          sourceId: 'decl-loop',
          targetId: 'while-loop',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-loop-3',
          sourceId: 'while-loop',
          targetId: 'print-loop',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-loop-4',
          sourceId: 'print-loop',
          targetId: 'inc-loop',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-loop-5',
          sourceId: 'inc-loop',
          targetId: 'while-loop',
          sourceHandle: 'w',
          targetHandle: 'w',
          type: 'default'
        },
        {
          id: 'c-loop-6',
          sourceId: 'while-loop',
          targetId: 'return-loop',
          sourceHandle: 'e',
          targetHandle: 'w',
          type: 'no',
          label: 'No'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  factorial: {
    type: 'factorial',
    name: 'Factorial Simple',
    description: 'Un ejemplo matemático acumulador que calcula el factorial de 5 recursivamente sin interacción.',
    state: {
      nodes: [
        {
          id: 'start-fact',
          type: 'start-end',
          position: { x: 350, y: 20 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'decl-n',
          type: 'input-output',
          position: { x: 340, y: 110 },
          size: { width: 160, height: 60 },
          content: 'int n = 5',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'n',
              type: 'int',
              value: '5'
            }
          }
        },
        {
          id: 'decl-fact',
          type: 'input-output',
          position: { x: 340, y: 200 },
          size: { width: 160, height: 60 },
          content: 'int fact = 1',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'fact',
              type: 'int',
              value: '1'
            }
          }
        },
        {
          id: 'decl-i',
          type: 'input-output',
          position: { x: 340, y: 290 },
          size: { width: 160, height: 60 },
          content: 'int i = 1',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'i',
              type: 'int',
              value: '1'
            }
          }
        },
        {
          id: 'while-fact',
          type: 'decision',
          position: { x: 345, y: 390 },
          size: { width: 150, height: 80 },
          content: 'while (i <= n)',
          connections: [],
          data: {
            conditionalType: 'while',
            condition: 'i <= n',
            cases: []
          }
        },
        {
          id: 'calc-fact',
          type: 'process',
          position: { x: 330, y: 510 },
          size: { width: 180, height: 60 },
          content: 'fact = fact * i',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'fact',
            value: 'fact * i'
          }
        },
        {
          id: 'inc-i',
          type: 'process',
          position: { x: 340, y: 610 },
          size: { width: 160, height: 60 },
          content: 'i++',
          connections: [],
          data: {
            processType: 'increment',
            variableName: 'i',
            incrementAmount: 1
          }
        },
        {
          id: 'print-fact',
          type: 'process',
          position: { x: 570, y: 400 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Factorial = {fact}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Factorial = {fact}'
          }
        },
        {
          id: 'return-fact',
          type: 'return',
          position: { x: 590, y: 500 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-fact-1',
          sourceId: 'start-fact',
          targetId: 'decl-n',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-fact-2',
          sourceId: 'decl-n',
          targetId: 'decl-fact',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-fact-3',
          sourceId: 'decl-fact',
          targetId: 'decl-i',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-fact-4',
          sourceId: 'decl-i',
          targetId: 'while-fact',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-fact-5',
          sourceId: 'while-fact',
          targetId: 'calc-fact',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-fact-6',
          sourceId: 'calc-fact',
          targetId: 'inc-i',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-fact-7',
          sourceId: 'inc-i',
          targetId: 'while-fact',
          sourceHandle: 'w',
          targetHandle: 'w',
          type: 'default'
        },
        {
          id: 'c-fact-8',
          sourceId: 'while-fact',
          targetId: 'print-fact',
          sourceHandle: 'e',
          targetHandle: 'w',
          type: 'no',
          label: 'No'
        },
        {
          id: 'c-fact-9',
          sourceId: 'print-fact',
          targetId: 'return-fact',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  collatz: {
    type: 'collatz',
    name: 'Conjetura de Collatz',
    description: 'Prueba la conjetura matemática Collatz para n=7 usando bucle while, condicionales if/else y reasignaciones.',
    state: {
      nodes: [
        {
          id: 'start-node',
          type: 'start-end',
          position: { x: 350, y: 50 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'decl-n',
          type: 'input-output',
          position: { x: 340, y: 140 },
          size: { width: 160, height: 60 },
          content: 'int n = 7',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'n',
              type: 'int',
              value: '7'
            }
          }
        },
        {
          id: 'decl-temp-global',
          type: 'input-output',
          position: { x: 340, y: 230 },
          size: { width: 160, height: 60 },
          content: 'int temp = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'temp',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'decl-check-global',
          type: 'input-output',
          position: { x: 340, y: 320 },
          size: { width: 160, height: 60 },
          content: 'int check = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'check',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'print-init',
          type: 'process',
          position: { x: 330, y: 410 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Inicio n = {n}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Inicio n = {n}'
          }
        },
        {
          id: 'while-node',
          type: 'decision',
          position: { x: 345, y: 510 },
          size: { width: 150, height: 80 },
          content: 'while (n > 1)',
          connections: [],
          data: {
            conditionalType: 'while',
            condition: 'n > 1',
            cases: []
          }
        },
        {
          id: 'assign-temp',
          type: 'process',
          position: { x: 340, y: 630 },
          size: { width: 160, height: 60 },
          content: 'temp = n / 2',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'temp',
            value: 'n / 2'
          }
        },
        {
          id: 'assign-check',
          type: 'process',
          position: { x: 340, y: 720 },
          size: { width: 160, height: 60 },
          content: 'check = temp * 2',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'check',
            value: 'temp * 2'
          }
        },
        {
          id: 'if-node',
          type: 'decision',
          position: { x: 345, y: 810 },
          size: { width: 150, height: 80 },
          content: 'if (check == n)',
          connections: [],
          data: {
            conditionalType: 'if',
            condition: 'check == n',
            cases: []
          }
        },
        {
          id: 'assign-even',
          type: 'process',
          position: { x: 200, y: 930 },
          size: { width: 160, height: 60 },
          content: 'n = n / 2',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'n',
            value: 'n / 2'
          }
        },
        {
          id: 'assign-odd-mul',
          type: "process",
          position: { x: 480, y: 930 },
          size: { width: 160, height: 60 },
          content: "n = n * 3",
          connections: [],
          data: {
            processType: "assign",
            variableName: "n",
            value: "n * 3"
          }
        },
        {
          id: "assign-odd-add",
          type: "process",
          position: { x: 480, y: 1020 },
          size: { width: 160, height: 60 },
          content: "n = n + 1",
          connections: [],
          data: {
            processType: "assign",
            variableName: "n",
            value: "n + 1"
          }
        },
        {
          id: 'print-step',
          type: 'process',
          position: { x: 330, y: 1130 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Paso n = {n}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Paso n = {n}'
          }
        },
        {
          id: 'print-end',
          type: 'process',
          position: { x: 580, y: 520 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Terminado!',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Terminado!'
          }
        },
        {
          id: 'return-node',
          type: 'return',
          position: { x: 790, y: 520 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-collatz-1',
          sourceId: 'start-node',
          targetId: 'decl-n',
          type: 'default'
        },
        {
          id: 'c-collatz-1b',
          sourceId: 'decl-n',
          targetId: 'decl-temp-global',
          type: 'default'
        },
        {
          id: 'c-collatz-1c',
          sourceId: 'decl-temp-global',
          targetId: 'decl-check-global',
          type: 'default'
        },
        {
          id: 'c-collatz-2',
          sourceId: 'decl-check-global',
          targetId: 'print-init',
          type: 'default'
        },
        {
          id: 'c-collatz-3',
          sourceId: 'print-init',
          targetId: 'while-node',
          type: 'default'
        },
        {
          id: 'c-collatz-4',
          sourceId: 'while-node',
          targetId: 'assign-temp',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-collatz-5',
          sourceId: 'assign-temp',
          targetId: 'assign-check',
          type: 'default'
        },
        {
          id: 'c-collatz-6',
          sourceId: 'assign-check',
          targetId: 'if-node',
          type: 'default'
        },
        {
          id: 'c-collatz-7',
          sourceId: 'if-node',
          targetId: 'assign-even',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-collatz-8',
          sourceId: 'if-node',
          targetId: 'assign-odd-mul',
          type: 'no',
          label: 'No'
        },
        {
          id: 'c-collatz-8b',
          sourceId: 'assign-odd-mul',
          targetId: 'assign-odd-add',
          type: 'default'
        },
        {
          id: 'c-collatz-9',
          sourceId: 'assign-even',
          targetId: 'print-step',
          type: 'default'
        },
        {
          id: 'c-collatz-10',
          sourceId: 'assign-odd-add',
          targetId: 'print-step',
          type: 'default'
        },
        {
          id: 'c-collatz-11',
          sourceId: 'print-step',
          targetId: 'while-node',
          type: 'default'
        },
        {
          id: 'c-collatz-12',
          sourceId: 'while-node',
          targetId: 'print-end',
          type: 'no',
          label: 'No'
        },
        {
          id: 'c-collatz-13',
          sourceId: 'print-end',
          targetId: 'return-node',
          type: 'default'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  fibonacci: {
    type: 'fibonacci',
    name: 'Generador de Fibonacci',
    description: 'Calcula e imprime los primeros 10 términos de la serie Fibonacci usando bucle for indexado y reasignaciones.',
    state: {
      nodes: [
        {
          id: 'start-node',
          type: 'start-end',
          position: { x: 350, y: 50 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'decl-a',
          type: 'input-output',
          position: { x: 340, y: 140 },
          size: { width: 160, height: 60 },
          content: 'int a = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'a',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'decl-b',
          type: 'input-output',
          position: { x: 340, y: 230 },
          size: { width: 160, height: 60 },
          content: 'int b = 1',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'b',
              type: 'int',
              value: '1'
            }
          }
        },
        {
          id: 'decl-temp',
          type: 'input-output',
          position: { x: 340, y: 320 },
          size: { width: 160, height: 60 },
          content: 'int temp = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'temp',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'decl-i',
          type: 'input-output',
          position: { x: 340, y: 410 },
          size: { width: 160, height: 60 },
          content: 'int i = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'i',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'print-a',
          type: 'process',
          position: { x: 330, y: 500 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Fibonacci 1: {a}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Fibonacci 1: {a}'
          }
        },
        {
          id: 'print-b',
          type: 'process',
          position: { x: 330, y: 590 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Fibonacci 2: {b}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Fibonacci 2: {b}'
          }
        },
        {
          id: 'for-node',
          type: 'decision',
          position: { x: 345, y: 690 },
          size: { width: 150, height: 80 },
          content: 'for (i = 3; i <= 10; i++)',
          connections: [],
          data: {
            conditionalType: 'for',
            init: 'i = 3',
            condition: 'i <= 10',
            increment: 'i++',
            cases: []
          }
        },
        {
          id: 'assign-temp',
          type: 'process',
          position: { x: 340, y: 810 },
          size: { width: 160, height: 60 },
          content: 'temp = a + b',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'temp',
            value: 'a + b'
          }
        },
        {
          id: 'assign-a',
          type: 'process',
          position: { x: 340, y: 900 },
          size: { width: 160, height: 60 },
          content: 'a = b',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'a',
            value: 'b'
          }
        },
        {
          id: 'assign-b',
          type: 'process',
          position: { x: 340, y: 990 },
          size: { width: 160, height: 60 },
          content: 'b = temp',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'b',
            value: 'temp'
          }
        },
        {
          id: 'print-b-val',
          type: 'process',
          position: { x: 330, y: 1080 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Fibonacci {i}: {b}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Fibonacci {i}: {b}'
          }
        },
        {
          id: 'return-node',
          type: 'return',
          position: { x: 580, y: 700 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-fib-1',
          sourceId: 'start-node',
          targetId: 'decl-a',
          type: 'default'
        },
        {
          id: 'c-fib-2',
          sourceId: 'decl-a',
          targetId: 'decl-b',
          type: 'default'
        },
        {
          id: 'c-fib-3',
          sourceId: 'decl-b',
          targetId: 'decl-temp',
          type: 'default'
        },
        {
          id: 'c-fib-3b',
          sourceId: 'decl-temp',
          targetId: 'decl-i',
          type: 'default'
        },
        {
          id: 'c-fib-4',
          sourceId: 'decl-i',
          targetId: 'print-a',
          type: 'default'
        },
        {
          id: 'c-fib-5',
          sourceId: 'print-a',
          targetId: 'print-b',
          type: 'default'
        },
        {
          id: 'c-fib-6',
          sourceId: 'print-b',
          targetId: 'for-node',
          type: 'default'
        },
        {
          id: 'c-fib-7',
          sourceId: 'for-node',
          targetId: 'assign-temp',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-fib-8',
          sourceId: 'assign-temp',
          targetId: 'assign-a',
          type: 'default'
        },
        {
          id: 'c-fib-9',
          sourceId: 'assign-a',
          targetId: 'assign-b',
          type: 'default'
        },
        {
          id: 'c-fib-10',
          sourceId: 'assign-b',
          targetId: 'print-b-val',
          type: 'default'
        },
        {
          id: 'c-fib-11',
          sourceId: 'print-b-val',
          targetId: 'for-node',
          type: 'default'
        },
        {
          id: 'c-fib-12',
          sourceId: 'for-node',
          targetId: 'return-node',
          type: 'no',
          label: 'No'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  factorial_interactive: {
    type: 'factorial_interactive',
    name: 'Factorial Interactivo con Entrada',
    description: 'Solicita un entero positivo por teclado (scanf / sys_read) y calcula su factorial usando decrementos.',
    state: {
      nodes: [
        {
          id: 'start-node',
          type: 'start-end',
          position: { x: 350, y: 50 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'decl-n',
          type: 'input-output',
          position: { x: 340, y: 140 },
          size: { width: 160, height: 60 },
          content: 'int n = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'n',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'decl-fact-global',
          type: 'input-output',
          position: { x: 340, y: 230 },
          size: { width: 160, height: 60 },
          content: 'int fact = 1',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'fact',
              type: 'int',
              value: '1'
            }
          }
        },
        {
          id: 'decl-temp-global',
          type: 'input-output',
          position: { x: 340, y: 320 },
          size: { width: 160, height: 60 },
          content: 'int temp = 0',
          connections: [],
          data: {
            mode: 'declare',
            variable: {
              name: 'temp',
              type: 'int',
              value: '0'
            }
          }
        },
        {
          id: 'print-prompt',
          type: 'process',
          position: { x: 330, y: 410 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Introduce un numero (entero positivo): ',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Introduce un numero (entero positivo): '
          }
        },
        {
          id: 'scanf-n',
          type: 'input-output',
          position: { x: 340, y: 500 },
          size: { width: 160, height: 60 },
          content: 'scanf(n)',
          connections: [],
          data: {
            mode: 'scanf',
            variable: {
              name: 'n',
              type: 'int',
              value: ''
            }
          }
        },
        {
          id: 'if-invalid',
          type: 'decision',
          position: { x: 345, y: 600 },
          size: { width: 150, height: 80 },
          content: 'if (n < 0)',
          connections: [],
          data: {
            conditionalType: 'if',
            condition: 'n < 0',
            cases: []
          }
        },
        {
          id: 'print-error',
          type: 'process',
          position: { x: 180, y: 720 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Error: numero negativo',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Error: numero negativo'
          }
        },
        {
          id: 'return-error',
          type: 'return',
          position: { x: 200, y: 820 },
          size: { width: 140, height: 60 },
          content: 'Retornar 1',
          connections: [],
          data: {
            returnValue: '1'
          }
        },
        {
          id: 'assign-fact-init',
          type: 'process',
          position: { x: 500, y: 720 },
          size: { width: 160, height: 60 },
          content: 'fact = 1',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'fact',
            value: '1'
          }
        },
        {
          id: 'assign-temp-init',
          type: 'process',
          position: { x: 500, y: 810 },
          size: { width: 160, height: 60 },
          content: 'temp = n',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'temp',
            value: 'n'
          }
        },
        {
          id: 'while-node',
          type: 'decision',
          position: { x: 505, y: 910 },
          size: { width: 150, height: 80 },
          content: 'while (temp > 1)',
          connections: [],
          data: {
            conditionalType: 'while',
            condition: 'temp > 1',
            cases: []
          }
        },
        {
          id: 'assign-fact',
          type: 'process',
          position: { x: 500, y: 1030 },
          size: { width: 160, height: 60 },
          content: 'fact = fact * temp',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'fact',
            value: 'fact * temp'
          }
        },
        {
          id: 'assign-temp',
          type: 'process',
          position: { x: 500, y: 1120 },
          size: { width: 160, height: 60 },
          content: 'temp = temp - 1',
          connections: [],
          data: {
            processType: 'assign',
            variableName: 'temp',
            value: 'temp - 1'
          }
        },
        {
          id: 'print-result',
          type: 'process',
          position: { x: 730, y: 920 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: Factorial = {fact}',
          connections: [],
          data: {
            processType: 'print',
            printContent: 'Factorial = {fact}'
          }
        },
        {
          id: 'return-ok',
          type: 'return',
          position: { x: 950, y: 920 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-fact-1',
          sourceId: 'start-node',
          targetId: 'decl-n',
          type: 'default'
        },
        {
          id: 'c-fact-1b',
          sourceId: 'decl-n',
          targetId: 'decl-fact-global',
          type: 'default'
        },
        {
          id: 'c-fact-1c',
          sourceId: 'decl-fact-global',
          targetId: 'decl-temp-global',
          type: 'default'
        },
        {
          id: 'c-fact-2',
          sourceId: 'decl-temp-global',
          targetId: 'print-prompt',
          type: 'default'
        },
        {
          id: 'c-fact-3',
          sourceId: 'print-prompt',
          targetId: 'scanf-n',
          type: 'default'
        },
        {
          id: 'c-fact-4',
          sourceId: 'scanf-n',
          targetId: 'if-invalid',
          type: 'default'
        },
        {
          id: 'c-fact-5',
          sourceId: 'if-invalid',
          targetId: 'print-error',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-fact-6',
          sourceId: 'print-error',
          targetId: 'return-error',
          type: 'default'
        },
        {
          id: 'c-fact-7',
          sourceId: 'if-invalid',
          targetId: 'assign-fact-init',
          type: 'no',
          label: 'No'
        },
        {
          id: 'c-fact-8',
          sourceId: 'assign-fact-init',
          targetId: 'assign-temp-init',
          type: 'default'
        },
        {
          id: 'c-fact-9',
          sourceId: 'assign-temp-init',
          targetId: 'while-node',
          type: 'default'
        },
        {
          id: 'c-fact-10',
          sourceId: 'while-node',
          targetId: 'assign-fact',
          type: 'yes',
          label: 'Sí'
        },
        {
          id: 'c-fact-11',
          sourceId: 'assign-fact',
          targetId: 'assign-temp',
          type: 'default'
        },
        {
          id: 'c-fact-12',
          sourceId: 'assign-temp',
          targetId: 'while-node',
          type: 'default'
        },
        {
          id: 'c-fact-13',
          sourceId: 'while-node',
          targetId: 'print-result',
          type: 'no',
          label: 'No'
        },
        {
          id: 'c-fact-14',
          sourceId: 'print-result',
          targetId: 'return-ok',
          type: 'default'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  },
  auxiliary: {
    type: 'auxiliary',
    name: 'Funciones Auxiliares',
    description: 'Demuestra modularidad definiendo y llamando una función separada (imprimir_separador) desde main.',
    state: {
      nodes: [
        {
          id: 'start-sep',
          type: 'start-end',
          position: { x: 100, y: 50 },
          size: { width: 140, height: 60 },
          content: 'Inicio imprimir_separador()',
          connections: [],
          data: {
            functionName: 'imprimir_separador',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'print-sep',
          type: 'process',
          position: { x: 80, y: 150 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: ====================',
          connections: [],
          data: {
            processType: 'print',
            printContent: '===================='
          }
        },
        {
          id: 'return-sep',
          type: 'return',
          position: { x: 100, y: 250 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        },
        {
          id: 'start-main',
          type: 'start-end',
          position: { x: 450, y: 50 },
          size: { width: 140, height: 60 },
          content: 'Inicio main()',
          connections: [],
          data: {
            functionName: 'main',
            parameters: [],
            isStart: true
          }
        },
        {
          id: 'call-sep1',
          type: 'subprocess',
          position: { x: 430, y: 150 },
          size: { width: 180, height: 60 },
          content: 'Llamar imprimir_separador()',
          connections: [],
          data: {
            functionName: 'imprimir_separador',
            arguments: []
          }
        },
        {
          id: 'print-msg',
          type: 'process',
          position: { x: 430, y: 250 },
          size: { width: 180, height: 60 },
          content: 'Imprimir: ¡Hola desde main!',
          connections: [],
          data: {
            processType: 'print',
            printContent: '¡Hola desde main!'
          }
        },
        {
          id: 'call-sep2',
          type: 'subprocess',
          position: { x: 430, y: 350 },
          size: { width: 180, height: 60 },
          content: 'Llamar imprimir_separador()',
          connections: [],
          data: {
            functionName: 'imprimir_separador',
            arguments: []
          }
        },
        {
          id: 'return-main',
          type: 'return',
          position: { x: 450, y: 450 },
          size: { width: 140, height: 60 },
          content: 'Retornar 0',
          connections: [],
          data: {
            returnValue: '0'
          }
        }
      ],
      connections: [
        {
          id: 'c-sep-1',
          sourceId: 'start-sep',
          targetId: 'print-sep',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-sep-2',
          sourceId: 'print-sep',
          targetId: 'return-sep',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-main-1',
          sourceId: 'start-main',
          targetId: 'call-sep1',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-main-2',
          sourceId: 'call-sep1',
          targetId: 'print-msg',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-main-3',
          sourceId: 'print-msg',
          targetId: 'call-sep2',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        },
        {
          id: 'c-main-4',
          sourceId: 'call-sep2',
          targetId: 'return-main',
          sourceHandle: 's',
          targetHandle: 'n',
          type: 'default'
        }
      ],
      selectedNodeId: null,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }
  }
}
