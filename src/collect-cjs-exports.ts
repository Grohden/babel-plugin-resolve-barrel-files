import fs from "fs";
import ts, { ReturnStatement } from "typescript";

/**
 * Given an entry from an object lit, checks if it is a function
 * expr and returns its first return statement if it's the case
 */
const findFirstReturnStatement = (child: ts.ObjectLiteralElementLike): ts.ReturnStatement | null => {
  if (!ts.isPropertyAssignment(child) || !ts.isFunctionExpression(child.initializer)) {
    return null;
  }

  return child.initializer.body?.statements.find(ts.isReturnStatement) || null;
};

/**
 * Given a call expression returns the require call expression either from
 * direct require call or from wrapped _interopRequireDefault or _interopRequireWildcard call
 *
 * eg:
 * require("./buzz"); // returns require("./buzz")
 * _interopRequireDefault(require("./buzz")); // returns require("./buzz")
 *
 * if its not a require call, returns null
 */
const getRequireCallData = (child: ts.Expression): ts.CallExpression | null => {
  if (ts.isCallExpression(child)) {
    const callExpression = child.expression;

    if (ts.isIdentifier(callExpression)) {
      if (callExpression.text === "_interopRequireDefault") {
        return getRequireCallData(child.arguments[0]);
      }

      if (callExpression.text === "_interopRequireWildcard") {
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
 * Given a child node, checks if it is a require variable statement like:
 *
 * var _<name> = require("<module>");
 * var _<name> = _interopRequireDefault(require("<module>"));
 * var _<name> = _interopRequireWildcard(require("<module>"));
 *
 * and if it is, returns the required module and the variable name else returns null
 */
const getRequireVariableStatementData = (child: ts.Node) => {
  if (!ts.isVariableStatement(child)) {
    return null;
  }

  const [declaration] = child.declarationList?.declarations || [];
  if (!declaration || !ts.isVariableDeclaration(declaration) || !declaration.initializer) {
    return null;
  }

  const requireCall = getRequireCallData(declaration.initializer);
  const requiredModule = requireCall?.arguments?.[0];
  if (!requiredModule || !ts.isStringLiteral(requiredModule) || !ts.isIdentifier(declaration.name)) {
    return null;
  }

  return {
    name: declaration.name.text,
    value: requiredModule.text,
  };
};

type ImportMetadataMap = Record<string, { importPath: string; importAlias: string | null }>;

/**
 * Parses a CJS barrel (index) file, extracts all it's export
 * names and returns an object that maps
 * a import name to the path + some meta infos.
 *
 * Note: this doesn't handle dynamic imports.
 */
export const collectCjsExports = (file: string) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    true,
  );

  const definePropsResolvers: Record<string, {
    variableName: string;
    accessor: string;
  }> = {};
  // Record of all `var _<name> = require("<module>");` mapped into `<name>: "<module>"`
  const requireResolvers: Record<string, string> = {};

  sourceFile.forEachChild((child) => {
    // proof: Object.defineProperty(exports, "Foo", {...})
    if (
      ts.isExpressionStatement(child)
      && ts.isCallExpression(child.expression)
      && ts.isPropertyAccessExpression(child.expression.expression)
      && child.expression.expression.name.text === "defineProperty"
    ) {
      //     exports,       "<Name>",     {...}
      const [exportsTarget, accessorName, definition] = child.expression.arguments;

      // proof: first argument is exactly the identifier "exports"
      // proof: second argument is a string
      // proof: third argument is {}
      if (
        !ts.isIdentifier(exportsTarget) || exportsTarget.text !== "exports"
        || !ts.isStringLiteral(accessorName)
        || !ts.isObjectLiteralExpression(definition)
      ) {
        return;
      }

      // ignore: Object.defineProperty(exports, "__esModule", { ... });
      if (accessorName.text === "__esModule") {
        // TODO: Fixture has { value: true } as third argument, what
        //  is this used for? should we validate that the value is true?

        return;
      }

      // FIXME: should we expect it at any position?
      // first being:       second being:
      // { enumerable: ..., get: ... }
      const [, value] = definition.properties;

      // proof: second arg is present and is a function named "get"
      if (value.name && ts.isIdentifier(value.name) && value.name.text === "get") {
        const returnStatement = findFirstReturnStatement(value)?.expression;

        // it's a literal property accessor return statement
        if (
          !returnStatement
          || !ts.isPropertyAccessExpression(returnStatement)
          || !ts.isIdentifier(returnStatement.expression)
        ) {
          return;
        }

        definePropsResolvers[accessorName.text] = {
          variableName: returnStatement.expression.text,
          accessor: returnStatement.name.text,
        };
      }
    } else {
      // might be: var _<name> = require("./<name>");
      const requireData = getRequireVariableStatementData(child);
      if (requireData) {
        requireResolvers[requireData.name] = requireData.value;
      }
    }
  });

  return Object
    .entries(definePropsResolvers)
    .reduce<ImportMetadataMap>((metadataMap, [importName, data]) => {
      metadataMap[importName] = {
        importPath: requireResolvers[data.variableName],
        importAlias: data.accessor === importName ? null : data.accessor,
      };

      return metadataMap;
    }, {});
};
