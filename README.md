# babel-plugin-resolve-barrel-files

This plugin parses and resolves a barrel file

> What is a barrel file?

Usually, index files with a lot of export statements, more info [here](https://basarat.gitbook.io/typescript/main-1/barrel)

## But really, what it does?

Given a module that export its dependencies using a barrel file like this:

```js
// lodash/index.js
export { map } from './dist/map';
export { chain } from './dist/chain';
export { filter } from './dist/filter';
export { groupBy } from './dist/groupBy';
```

And that you import it like this:

```js
import { map, chain } from 'lodash';
```

it will transform your code to:

```js
import { map } from 'lodash/dist/map';
import { chain } from 'lodash/dist/chain';
```

Since a barrel file exports all files from a lib, babel/bundlers usually will
import and parse all of those files because they can have side effects.

This plugin will drop unused imports from barrel files at lib roots, which will also remove import side effects.

This **probably** can help you to reduce the bundle size and help your bundler to be faster.

## Why? babel isn't a bundler, why resolve in babel?

Because React Native sucks (or I suck because I don't know how to do this in metro).

## Not supported

#### CommonJS

Common JS files are not supported currently.

#### Full imports
Right now, this plugin doesn't support full imports like:

```js
import _ from 'lodash'
```

We could ignore this, in the future and just warn that this kind of 
import make this plugin useless.

## Installation

```
npm install --save babel-plugin-resolve-barrel-files
# or
yarn add -D babel-plugin-resolve-barrel-files
```

## Usage

Declare it in your babel config file:

```js
const path = require('path');

module.exports = {
  // ...,
  plugins: [
    [
      'resolve-barrel-files',
      {
        'my-lib': {
          barrelFilePath: path.resolve(
            require.resolve('lodash'),
            '../lib/module'
          )
        },
      },
    ]
  ]
}
```

### I have a problem, what should I do?

Feel free to open a PR, or an issue and I'll try to help you :D

### Mentions

Heavily inspired by [babel-plugin-transform-imports](https://bitbucket.org/amctheatres/babel-transform-imports/src/master/)
