export default {
  name: 'Onto',
  rootCodes: [
    {
      id: 'a',
      code: 'a',
      description: 'desc a',
      path: [],
      children: [
        {
          id: 'b',
          code: 'b',
          description: 'desc b',
          path: [{id: 'a'}],
          children: [],
          numberOfChildren: 0,
        },
        {
          id: 'c',
          code: 'c',
          description: 'desc c',
          path: [{id: 'a'}],
          children: [],
          numberOfChildren: 0,
        },
      ],
      numberOfChildren: 2,
    },
    {
      id: 'd',
      code: 'd',
      description: 'desc d',
      path: [],
      children: [
        {
          id: 'e',
          code: 'e',
          description: 'desc e',
          path: [{id: 'd'}],
          children: [
            {
              id: 'f',
              code: 'f',
              description: 'desc f',
              path: [{id: 'd'}, {id: 'e'}],
              children: [
                {
                  id: 'g',
                  code: 'g',
                  description: 'desc g',
                  path: [{id: 'd'}, {id: 'e'}, {id: 'f'}],
                  numberOfChildren: 0,
                },
              ],
              numberOfChildren: 1,
            },
          ],
          numberOfChildren: 1,
        },
      ],
      numberOfChildren: 1,
    },
    {
      id: 'h',
      code: 'h',
      description: 'desc h',
      path: [],
      children: [
        {
          id: 'i',
          code: 'i',
          description: 'desc i',
          path: [{id: 'h'}],
          children: [
            {
              id: 'j',
              code: 'j',
              description: 'desc j',
              path: [{id: 'h'}, {id: 'i'}],
              numberOfChildren: 0,
            },
            {
              id: 'k',
              code: 'k',
              description: 'desc k',
              path: [{id: 'h'}, {id: 'i'}],
              numberOfChildren: 0,
            },
          ],
          numberOfChildren: 2,
        },
      ],
      numberOfChildren: 1,
    },
    {
      id: 'l',
      code: 'l',
      description: 'desc l',
      path: [],
      children: [
        {
          id: 'm',
          code: 'm',
          description: 'desc m',
          path: [{id: 'l'}],
          children: [
            {
              id: 'n',
              code: 'n',
              description: 'desc n',
              path: [{id: 'l'}, {id: 'm'}],
              numberOfChildren: 0,
            },
            {
              id: 'o',
              code: 'o',
              description: 'desc o',
              path: [{id: 'l'}, {id: 'm'}],
              numberOfChildren: 0,
            },
          ],
          numberOfChildren: 2,
        },
        {
          id: 'p',
          code: 'p',
          description: 'desc p',
          path: [{id: 'l'}],
          children: [
            {
              id: 'q',
              code: 'q',
              description: 'desc q',
              path: [{id: 'l'}, {id: 'p'}],
              numberOfChildren: 0,
            },
            {
              id: 'r',
              code: 'r',
              description: 'desc r',
              path: [{id: 'l'}, {id: 'p'}],
              numberOfChildren: 0,
            },
          ],
          numberOfChildren: 2,
        },
      ],
      numberOfChildren: 1,
    },
  ],
}
