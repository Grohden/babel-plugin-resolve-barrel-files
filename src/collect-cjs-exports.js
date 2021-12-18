const fs = require("fs");

const ts = require("typescript");

const isObjectDefineProperty = (child) => {
  return child.kind === ts.SyntaxKind.ExpressionStatement
    && child.expression.kind === ts.SyntaxKind.CallExpression
    && child.expression.expression.kind === ts.SyntaxKind.PropertyAccessExpression
    && child.expression.expression.name.text === "defineProperty";
};

const findReturnStatement = (child) => {
  return child.initializer.body.statements.find(statement => ts.SyntaxKind.ReturnStatement === statement.kind);
};

/**
 * Given a call expression returns the require call expression either from
 * direct require call or from wrapped _interopRequireDefault call
 *
 * eg:
 * require("./buzz"); // returns require("./buzz")
 * _interopRequireDefault(require("./buzz")); // returns require("./buzz")
 *
 * if its not a require call, returns null
 */
const getRequireCallData = (child) => {
  if (child.kind === ts.SyntaxKind.CallExpression) {
    const callExpression = child.expression;

    if (callExpression.kind === ts.SyntaxKind.Identifier) {
      if (callExpression.text === "_interopRequireDefault") {
        return getRequireCallData(child.arguments[0]);
      }

      if (callExpression.text === "require") {
        return child;
      }
    }
  }

  return null;
};

/**
 * Given an child node, checks if it
 * is a require variable statement like
 *
 * var _foo = require('foo');
 *
 * and if it is, returns the require value and the variable name
 * else returns null
 */
const getRequireVariableStatementData = (child) => {
  if (
    !child.kind === ts.SyntaxKind.VariableStatement && child.expression.kind === ts.SyntaxKind.VariableDeclarationList
  ) {
    return null;
  }

  const [declaration] = child.declarationList?.declarations || [];
  if (declaration?.kind !== ts.SyntaxKind.VariableDeclaration) {
    return null;
  }

  const callData = getRequireCallData(declaration.initializer);
  if (!callData) {
    return null;
  }

  return {
    name: declaration.name.text,
    value: callData.arguments[0].text,
  };
};

/**
 * Parses a CJS barrel (index) file, extracts all it's export
 * names and returns an object that maps
 * a import name to the path + some meta infos.
 *
 * Note: this doesn't handle dynamic imports.
 */
const collectCjsExports = (file) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );

  const definePropsResolvers = {};
  const requireResolvers = {};

  sourceFile.forEachChild((child) => {
    // collects cjs exports
    if (isObjectDefineProperty(child)) {
      const [exportsTarget, accessorName, definition] = child.expression.arguments;

      if (exportsTarget.text !== "exports") {
        return;
      }

      if (accessorName.text === "__esModule") {
        // Should we validate that the value is true?
        return;
      }

      const [, value] = definition.properties;

      if (value.name.text === "get") {
        const returnStatement = findReturnStatement(value).expression;

        definePropsResolvers[accessorName.text] = {
          variableName: returnStatement.expression.text,
          accessor: returnStatement.name.text,
        };
      }
    }

    const requireData = getRequireVariableStatementData(child);
    if (requireData) {
      requireResolvers[requireData.name] = requireData.value;
    }
  });

  return Object.entries(definePropsResolvers).reduce((acc, [importName, data]) => {
    acc[importName] = {
      importPath: requireResolvers[data.variableName],
      importAlias: data.accessor === importName ? null : data.accessor,
    };

    return acc;
  }, {});
};

module.exports = { collectCjsExports };
