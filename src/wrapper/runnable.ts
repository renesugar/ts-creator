import {
  updateSourceFileNode,
  createSourceFile,
  ScriptTarget,
  createImportDeclaration,
  createImportClause,
  createNamespaceImport,
  createIdentifier,
  createStringLiteral,
  createVariableStatement,
  createVariableDeclarationList,
  createVariableDeclaration,
  createCall,
  createPropertyAccess,
  NodeFlags,
  createExpressionStatement,
  Expression,
  SourceFile
} from 'typescript'

/** @internal */
export function resolveRunnable(expression: Expression): SourceFile {
  return updateSourceFileNode(
    createSourceFile('templory.ts', '', ScriptTarget.Latest),
    [
      createImportDeclaration(
        undefined,
        undefined,
        createImportClause(
          undefined,
          createNamespaceImport(createIdentifier('ts'))
        ),
        createStringLiteral('typescript')
      ),
      createVariableStatement(
        undefined,
        createVariableDeclarationList(
          [
            createVariableDeclaration(
              createIdentifier('printer'),
              undefined,
              createCall(
                createPropertyAccess(
                  createIdentifier('ts'),
                  createIdentifier('createPrinter')
                ),
                undefined,
                []
              )
            )
          ],
          NodeFlags.Const
        )
      ),
      createVariableStatement(
        undefined,
        createVariableDeclarationList(
          [
            createVariableDeclaration(
              createIdentifier('file'),
              undefined,
              expression
            )
          ],
          NodeFlags.Const
        )
      ),
      createExpressionStatement(
        createCall(
          createPropertyAccess(
            createIdentifier('printer'),
            createIdentifier('printFile')
          ),
          undefined,
          [createIdentifier('file')]
        )
      ),
      createExpressionStatement(
        createCall(
          createPropertyAccess(
            createIdentifier('console'),
            createIdentifier('log')
          ),
          undefined,
          [
            createCall(
              createPropertyAccess(
                createIdentifier('printer'),
                createIdentifier('printFile')
              ),
              undefined,
              [createIdentifier('file')]
            )
          ]
        )
      )
    ]
  )
}
