const esModules = [
  '@minoru/react-dnd-treeview',
  '@react-dnd',
  'dnd-core',
  'react-dnd',
  'react-dnd-html5-backend',
  'nanoid',
  'react-medium-image-zoom',
].join('|')
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.([t|j]sx|js|ts)?$': 'babel-jest',
  },
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__test__/setupTests.js'],
  modulePathIgnorePatterns: ['<rootDir>/e2e-tests'],
  moduleNameMapper: {
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg|md)$': '<rootDir>/__mocks__/svg.js',
    'react-markdown': '<rootDir>/node_modules/react-markdown/react-markdown.min.js',
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/fileMock.js',
  },
}
