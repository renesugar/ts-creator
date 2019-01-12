import * as ts from 'typescript'
import { formatFlags } from './utils';

const code = `
function a(): number {
  console.log(1)
}
`

const sourceFile = ts.createSourceFile("1.tsx", code, ts.ScriptTarget.Latest)
const printer = ts.createPrinter()

function createTsAccess(id: ts.Identifier) {
  return ts.createPropertyAccess(ts.createIdentifier('ts'), id)
}

function createTsCall(id: string, args?: ts.Expression[]) {
  return ts.createCall(createTsAccess(ts.createIdentifier(id)), undefined, args)
}

function createLiteralCall(node: ts.LiteralLikeNode, func: string) {
  return createTsCall(
    func,
    [ts.createStringLiteral(node.text)]
  )
}

function connectBinary(op: ts.BinaryOperator, nodes: ts.Expression[]): ts.Expression {
  if (nodes.length === 0) {
    return ts.createIdentifier('undefined')
  }
  if (nodes.length === 1) {
    return nodes[0]
  }
  return ts.createBinary(nodes[0], op, connectBinary(op, nodes.slice(1)))
}


function createNodeFlags(flags: ts.NodeFlags) {
  const formattedFlags = formatFlags(flags, ts.NodeFlags).map(f => ts.createPropertyAccess(
    createTsAccess(
      ts.createIdentifier('NodeFlags'),
    ),
    ts.createIdentifier(f)
  ))

  return connectBinary(ts.SyntaxKind.BarBarToken, formattedFlags)
}


function createBooleanLiteral(bool: boolean | undefined) {
  if (bool === undefined) {
    return ts.createIdentifier('undefined')
  }

  return bool ? ts.createTrue() : ts.createFalse()
}

interface QuestionOrExclamation {
  questionToken?: ts.QuestionToken
  exclamationToken?: ts.ExclamationToken
}

function transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
  return ts.updateSourceFileNode(sourceFile, ts.visitNodes(sourceFile.statements, transformVisitor));

  function transformSyntaxKind(kind: ts.SyntaxKind) {
    return ts.createPropertyAccess(
      createTsAccess(
        ts.createIdentifier('SyntaxKind'),
      ),
      ts.createIdentifier(ts.SyntaxKind[kind])
    )
  }

  function transformVisitorQuestionOrExclamation(node: QuestionOrExclamation) {
    if (node.questionToken) {
      return transformVisitor(node.questionToken)
    } else if (node.exclamationToken) {
      return transformVisitor(node.exclamationToken)
    } else {
      return ts.createIdentifier('undefined')
    }
  }

  function transformVisitors(nodes?: ts.NodeArray<ts.Node>): ts.Expression {
    if (!nodes) {
      return ts.createIdentifier('undefined')
    }
    return ts.createArrayLiteral(nodes.map(transformVisitor))
  }

  function transformVisitor(node?: ts.Node): ts.Expression {
    if (!node) {
      return ts.createIdentifier('undefined')
    }

    switch (node.kind) {
      case ts.SyntaxKind.QuestionToken:
      case ts.SyntaxKind.ExclamationToken:
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.NumberKeyword:
      case ts.SyntaxKind.ReadonlyKeyword:
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
      case ts.SyntaxKind.DotDotDotToken:
      case ts.SyntaxKind.EqualsGreaterThanToken:
      case ts.SyntaxKind.CommaToken:
      case ts.SyntaxKind.AsteriskToken:
      case ts.SyntaxKind.AsteriskAsteriskToken:
      case ts.SyntaxKind.SlashToken:
      case ts.SyntaxKind.PercentToken:
      case ts.SyntaxKind.LessThanToken:
      case ts.SyntaxKind.LessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanToken:
      case ts.SyntaxKind.GreaterThanEqualsToken:
      case ts.SyntaxKind.InstanceOfKeyword:
      case ts.SyntaxKind.GreaterThanEqualsToken:
      case ts.SyntaxKind.InKeyword:
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      case ts.SyntaxKind.GreaterThanGreaterThanToken:
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.AmpersandToken:
      case ts.SyntaxKind.BarToken:
      case ts.SyntaxKind.CaretToken:
      case ts.SyntaxKind.AmpersandAmpersandToken:
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.PlusEqualsToken:
      case ts.SyntaxKind.MinusEqualsToken:
      case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      case ts.SyntaxKind.AsteriskEqualsToken:
      case ts.SyntaxKind.SlashEqualsToken:
      case ts.SyntaxKind.PercentEqualsToken:
      case ts.SyntaxKind.AmpersandEqualsToken:
      case ts.SyntaxKind.BarEqualsToken:
      case ts.SyntaxKind.CaretEqualsToken:
      case ts.SyntaxKind.LessThanLessThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
      case ts.SyntaxKind.CommaToken:
      case ts.SyntaxKind.AwaitKeyword:
        return createToken(node)

      case ts.SyntaxKind.NumericLiteral:
        return createNumericLiteral(node as ts.NumericLiteral)
      case ts.SyntaxKind.BigIntLiteral:
        return BigIntLiteral(node as ts.BigIntLiteral)
      case ts.SyntaxKind.StringLiteral:
        return createStringLiteral(node as ts.StringLiteral)
      case ts.SyntaxKind.RegularExpressionLiteral:
        return createRegularExpressionLiteral(node as ts.RegularExpressionLiteral)
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return createNoSubstitutionTemplateLiteral(node as ts.NoSubstitutionTemplateLiteral)
      case ts.SyntaxKind.TemplateHead:
        return createTemplateHead(node as ts.TemplateHead)
      case ts.SyntaxKind.TemplateMiddle:
        return createTemplateMiddle(node as ts.TemplateMiddle)
      case ts.SyntaxKind.TemplateTail:
        return createTemplateTail(node as ts.TemplateTail)
      case ts.SyntaxKind.Identifier:
        return createIdentifier(node as ts.Identifier)
      case ts.SyntaxKind.QualifiedName:
        return createQualifiedName(node as ts.QualifiedName)
      case ts.SyntaxKind.ComputedPropertyName:
        return createComputedPropertyName(node as ts.ComputedPropertyName)
      case ts.SyntaxKind.TypeParameter:
        return createTypeParameter(node as ts.TypeParameterDeclaration)
      case ts.SyntaxKind.Parameter:
        return createParameter(node as ts.ParameterDeclaration)
      case ts.SyntaxKind.Decorator:
        return createDecorator(node as ts.Decorator)
      case ts.SyntaxKind.PropertySignature:
        return createPropertySignature(node as ts.PropertySignature)
      case ts.SyntaxKind.PropertyDeclaration:
        return createPropertyDeclaration(node as ts.PropertyDeclaration)
      case ts.SyntaxKind.MethodSignature:
        return createMethodSignature(node as ts.MethodSignature)
      case ts.SyntaxKind.MethodDeclaration:
        return createMethodDeclaration(node as ts.MethodDeclaration)
      case ts.SyntaxKind.Constructor:
        return createConstructor(node as ts.ConstructorDeclaration)
      case ts.SyntaxKind.ConstructSignature:
        return createConstructSignature(node as ts.ConstructSignatureDeclaration)
      case ts.SyntaxKind.IndexSignature:
        return createIndexSignature(node as ts.IndexSignatureDeclaration)
      case ts.SyntaxKind.TypePredicate:
        return createTypePredicate(node as ts.TypePredicateNode)
      case ts.SyntaxKind.TypeReference:
        return createTypeReference(node as ts.TypeReferenceNode)
      case ts.SyntaxKind.FunctionType:
        return createFunctionType(node as ts.FunctionTypeNode)
      case ts.SyntaxKind.ConstructorType:
        return createConstructorType(node as ts.ConstructorTypeNode)
      case ts.SyntaxKind.TypeQuery:
        return createTypeQuery(node as ts.TypeQueryNode)
      case ts.SyntaxKind.TypeLiteral:
        return createTypeLiteral(node as ts.TypeLiteralNode)
      case ts.SyntaxKind.ArrayType:
        return createArrayType(node as ts.ArrayTypeNode)
      case ts.SyntaxKind.TupleType:
        return createTypleType(node as ts.TupleTypeNode)
      case ts.SyntaxKind.OptionalType:
        return createOptionalType(node as ts.OptionalTypeNode)
      case ts.SyntaxKind.RestType:
        return createRestType(node as ts.RestTypeNode)
      case ts.SyntaxKind.UnionType:
        return createUnionType(node as ts.UnionTypeNode)
      case ts.SyntaxKind.IntersectionType:
        return createIntersectionType(node as ts.IntersectionTypeNode)
      case ts.SyntaxKind.ConditionalType:
        return createConditionalType(node as ts.ConditionalTypeNode)
      case ts.SyntaxKind.InferType:
        return createInferType(node as ts.InferTypeNode)
      case ts.SyntaxKind.ParenthesizedType:
        return createParenthesizedType(node as ts.ParenthesizedTypeNode)
      case ts.SyntaxKind.ThisType:
        return createThisType(node as ts.ThisTypeNode)
      case ts.SyntaxKind.TypeOperator:
        return createTypeOperator(node as ts.TypeOperatorNode)
      case ts.SyntaxKind.IndexedAccessType:
        return createIndexedAccessType(node as ts.IndexedAccessTypeNode)
      case ts.SyntaxKind.MappedType:
        return createMappedType(node as ts.MappedTypeNode)
      case ts.SyntaxKind.LiteralType:
        return createLiteralType(node as ts.LiteralTypeNode)
      case ts.SyntaxKind.ImportType:
        return createImportType(node as ts.ImportTypeNode)
      case ts.SyntaxKind.ObjectBindingPattern:
        return createObjectBindingPattern(node as ts.ObjectBindingPattern)
      case ts.SyntaxKind.ArrayBindingPattern:
        return createArrayBindingPattern(node as ts.ArrayBindingPattern)
      case ts.SyntaxKind.BindingElement:
        return createBindingElement(node as ts.BindingElement)
      case ts.SyntaxKind.ArrayLiteralExpression:
        return createArrayLiteralExpression(node as ts.ArrayLiteralExpression)
      case ts.SyntaxKind.ObjectLiteralExpression:
        return createObjectLiteralExpression(node as ts.ObjectLiteralExpression)
      case ts.SyntaxKind.PropertyAccessExpression:
        return createPropertyAccessExpression(node as ts.PropertyAccessExpression)
      case ts.SyntaxKind.ElementAccessExpression:
        return createElementAccessExpression(node as ts.ElementAccessExpression)
      case ts.SyntaxKind.CallExpression:
        return createCallExpression(node as ts.CallExpression)
      case ts.SyntaxKind.NewExpression:
        return createNewExpression(node as ts.NewExpression)
      case ts.SyntaxKind.TaggedTemplateExpression:
        return createTaggedTemplateExpression(node as ts.TaggedTemplateExpression)
      case ts.SyntaxKind.TypeAssertionExpression:
        return createTypeAssertionExpression(node as ts.TypeAssertion)
      case ts.SyntaxKind.ParenthesizedExpression:
        return createParenthesizedExpression(node as ts.ParenthesizedExpression)
      case ts.SyntaxKind.FunctionExpression:
        return createFunctionExpression(node as ts.FunctionExpression)
      case ts.SyntaxKind.ArrowFunction:
        return createArrowFunction(node as ts.ArrowFunction)
      case ts.SyntaxKind.DeleteExpression:
        return createDeleteExpression(node as ts.DeleteExpression)
      case ts.SyntaxKind.TypeOfExpression:
        return createTypeOfExpression(node as ts.TypeOfExpression)
      case ts.SyntaxKind.VoidExpression:
        return createVoidExpression(node as ts.VoidExpression)
      case ts.SyntaxKind.AwaitExpression:
        return createAwaitExpression(node as ts.AwaitExpression)
      case ts.SyntaxKind.BinaryExpression:
        return createBinaryExpression(node as ts.BinaryExpression)
      case ts.SyntaxKind.ConditionalExpression:
        return createConditionalExpression(node as ts.ConditionalExpression)
      case ts.SyntaxKind.TemplateExpression:
        return createTemplateExpression(node as ts.TemplateExpression)
      case ts.SyntaxKind.YieldExpression:
        return createYieldExpression(node as ts.YieldExpression)
      case ts.SyntaxKind.SpreadElement:
        return createSpreadElement(node as ts.SpreadElement)
      case ts.SyntaxKind.ClassExpression:
        return createClassExpression(node as ts.ClassExpression)
      case ts.SyntaxKind.ExpressionWithTypeArguments:
        return createExpressionWithTypeArguments(node as ts.ExpressionWithTypeArguments)
      case ts.SyntaxKind.AsExpression:
        return createAsExpression(node as ts.AsExpression)
      case ts.SyntaxKind.NonNullExpression:
        return createNonNullExpression(node as ts.NonNullExpression)
      case ts.SyntaxKind.MetaProperty:
        return createMetaProperty(node as ts.MetaProperty)
      case ts.SyntaxKind.TemplateSpan:
        return createTemplateSpan(node as ts.TemplateSpan)
      case ts.SyntaxKind.SemicolonClassElement:
        return createSemicolonClassElement(node as ts.SemicolonClassElement)

      case ts.SyntaxKind.Block:
        return createBlock(node as ts.Block)
      case ts.SyntaxKind.VariableStatement:
        return createVariableStatement(node as ts.VariableStatement)
      case ts.SyntaxKind.EmptyStatement:
        return createEmptyStatement(node as ts.EmptyStatement)
      case ts.SyntaxKind.ExpressionStatement:
        return createExpressionStatement(node as ts.ExpressionStatement)
      case ts.SyntaxKind.IfStatement:
        return createIfStatement(node as ts.IfStatement)
      case ts.SyntaxKind.DoStatement:
        return createDoStatement(node as ts.DoStatement)
      case ts.SyntaxKind.WhileStatement:
        return createWhileStatement(node as ts.WhileStatement)
      case ts.SyntaxKind.ForStatement:
        return createForStatement(node as ts.ForStatement)
      case ts.SyntaxKind.ForInStatement:
        return createForInStatement(node as ts.ForInStatement)
      case ts.SyntaxKind.ForOfStatement:
        return createForOfStatement(node as ts.ForOfStatement)
      case ts.SyntaxKind.ContinueStatement:
        return createContinueStatement(node as ts.ContinueStatement)
      case ts.SyntaxKind.BreakStatement:
        return createBreakStatement(node as ts.BreakStatement)
      case ts.SyntaxKind.ReturnStatement:
        return createReturnStatement(node as ts.ReturnStatement)
      case ts.SyntaxKind.WithStatement:
        return createWithStatement(node as ts.WithStatement)
      case ts.SyntaxKind.SwitchStatement:
        return createSwitchStatement(node as ts.SwitchStatement)
      case ts.SyntaxKind.LabeledStatement:
        return createLabeledStatement(node as ts.LabeledStatement)
      case ts.SyntaxKind.ThrowStatement:
        return createThrowStatement(node as ts.ThrowStatement)
      case ts.SyntaxKind.TryStatement:
        return createTryStatement(node as ts.TryStatement)
      case ts.SyntaxKind.DebuggerStatement:
        return createDebuggerStatement(node as ts.DebuggerStatement)
      case ts.SyntaxKind.VariableDeclaration:
        return createVariableDeclaration(node as ts.VariableDeclaration)
      case ts.SyntaxKind.VariableDeclarationList:
        return createVariableDeclarationList(node as ts.VariableDeclarationList)
      case ts.SyntaxKind.FunctionDeclaration:
        return createFunctionDeclaration(node as ts.FunctionDeclaration)
      case ts.SyntaxKind.ClassDeclaration:
        return createClassDeclaration(node as ts.ClassDeclaration)
      case ts.SyntaxKind.InterfaceDeclaration:
        return createInterfaceDeclaration(node as ts.InterfaceDeclaration)
      case ts.SyntaxKind.TypeAliasDeclaration:
        return createTypeAliasDeclaration(node as ts.TypeAliasDeclaration)
      case ts.SyntaxKind.EnumDeclaration:
        return createEnumDeclaration(node as ts.EnumDeclaration)
      case ts.SyntaxKind.ModuleDeclaration:
        return createModuleDeclaration(node as ts.ModuleDeclaration)
      case ts.SyntaxKind.ModuleBlock:
        return createModuleBlock(node as ts.ModuleBlock)
      case ts.SyntaxKind.CaseBlock:
        return createCaseBlock(node as ts.CaseBlock)

      case ts.SyntaxKind.SyntheticExpression:
      case ts.SyntaxKind.JsxText:
      case ts.SyntaxKind.PrefixUnaryExpression:
      case ts.SyntaxKind.PostfixUnaryExpression:
      case ts.SyntaxKind.OmittedExpression:
        throw new Error("unknown syntax")
      default:
        throw new Error("unsupported syntax: " + node.kind)
    }
  }

  function createCaseBlock(node: ts.CaseBlock) {
    return createTsCall(
      'createCaseBlock',
      [
        transformVisitors(node.clauses),
      ]
    )
  }

  function createModuleBlock(node: ts.ModuleBlock) {
    return createTsCall(
      'createModuleBlock',
      [
        transformVisitors(node.statements),
      ]
    )
  }

  function createModuleDeclaration(node: ts.ModuleDeclaration) {
    return createTsCall(
      'createModuleDeclaration',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitor(node.body),
        createNodeFlags(node.flags)
      ]
    )
  }

  function createEnumDeclaration(node: ts.EnumDeclaration) {
    return createTsCall(
      'createEnumDeclaration',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitors(node.members),
      ]
    )
  }

  function createTypeAliasDeclaration(node: ts.TypeAliasDeclaration) {
       return createTsCall(
        'createTypeAliasDeclaration',
        [
          transformVisitors(node.decorators),
          transformVisitors(node.modifiers),
          transformVisitor(node.name),
          transformVisitors(node.typeParameters),
          transformVisitor(node.type)
        ]
      )
  }

  function createInterfaceDeclaration(node: ts.InterfaceDeclaration) {
    return createTsCall(
      'createInterfaceDeclaration',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitors(node.typeParameters),
        transformVisitors(node.heritageClauses),
        transformVisitors(node.members),
      ]
    )
  }

  function createClassDeclaration(node: ts.ClassDeclaration) {
    return createTsCall(
      'createClassDeclaration',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitors(node.typeParameters),
        transformVisitors(node.heritageClauses),
        transformVisitors(node.members),
      ]
    )
  }

  function createFunctionDeclaration(node: ts.FunctionDeclaration) {
    return createTsCall(
      'createFunctionDeclaration',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.asteriskToken),
        transformVisitor(node.name),
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type),
        transformVisitor(node.body),
      ]
    )
  }

  function createVariableDeclarationList(node: ts.VariableDeclarationList) {
    return createTsCall(
      'createVariableDeclarationList',
      [
        transformVisitors(node.declarations),
        createNodeFlags(node.flags),
      ]
    )
  }

  function createVariableDeclaration(node: ts.VariableDeclaration) {
    return createTsCall(
      'createVariableDeclaration',
      [
        transformVisitor(node.name),
        transformVisitor(node.type),
        transformVisitor(node.initializer),
      ]
    )
  }

  function createDebuggerStatement(node: ts.DebuggerStatement) {
    return createTsCall('createDebuggerStatement', [])
  }

  function createTryStatement(node: ts.TryStatement) {
    return createTsCall(
      'createTry',
      [
        transformVisitor(node.tryBlock),
        transformVisitor(node.catchClause),
        transformVisitor(node.finallyBlock),
      ]
    )
  }

  function createThrowStatement(node: ts.ThrowStatement) {
    return createTsCall(
      'createThrow',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createLabeledStatement(node: ts.LabeledStatement) {
    return createTsCall(
      'createLabel',
      [
        transformVisitor(node.label),
        transformVisitor(node.statement),
      ]
    )
  }

  function createSwitchStatement(node: ts.SwitchStatement) {
    return createTsCall(
      'createSwitch',
      [
        transformVisitor(node.expression),
        transformVisitor(node.caseBlock),
      ]
    )
  }

  function createWithStatement(node: ts.WithStatement) {
    return createTsCall(
      'createWith',
      [
        transformVisitor(node.expression),
        transformVisitor(node.statement),
      ]
    )
  }

  function createReturnStatement(node: ts.ReturnStatement) {
    return createTsCall(
      'createReturn',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createBreakStatement(node: ts.BreakStatement) {
    return createTsCall(
      'createBreak',
      [
        transformVisitor(node.label),
      ]
    )
  }

  function createContinueStatement(node: ts.ContinueStatement) {
    return createTsCall(
      'createContinue',
      [
        transformVisitor(node.label),
      ]
    )
  }

  function createForOfStatement(node: ts.ForOfStatement) {
    return createTsCall(
      'createForOf',
      [
        transformVisitor(node.awaitModifier),
        transformVisitor(node.initializer),
        transformVisitor(node.expression),
        transformVisitor(node.statement),
      ]
    )
  }

  function createForInStatement(node: ts.ForInStatement) {
    return createTsCall(
      'createForIn',
      [
        transformVisitor(node.initializer),
        transformVisitor(node.expression),
        transformVisitor(node.statement),
      ]
    )
  }

  function createForStatement(node: ts.ForStatement) {
    return createTsCall(
      'createFor',
      [
        transformVisitor(node.initializer),
        transformVisitor(node.condition),
        transformVisitor(node.incrementor),
        transformVisitor(node.statement),
      ]
    )
  }

  function createWhileStatement(node: ts.WhileStatement) {
    return createTsCall(
      'createWhile',
      [
        transformVisitor(node.expression),
        transformVisitor(node.statement),
      ]
    )
  }

  function createDoStatement(node: ts.DoStatement) {
    return createTsCall(
      'createDo',
      [
        transformVisitor(node.statement),
        transformVisitor(node.expression),
      ]
    )
  }

  function createIfStatement(node: ts.IfStatement) {
    return createTsCall(
      'createIf',
      [
        transformVisitor(node.expression),
        transformVisitor(node.thenStatement),
        transformVisitor(node.elseStatement),
      ]
    )
  }

  function createEmptyStatement(node: ts.EmptyStatement) {
    return createTsCall('createEmptyStatement', [])
  }

  function createVariableStatement(node: ts.VariableStatement) {
    return createTsCall(
      'createVariableStatement',
      [
        transformVisitors(node.modifiers),
        transformVisitor(node.declarationList),
      ]
    )
  }

  function createBlock(node: ts.Block) {
    return createTsCall(
      'createBlock',
      [
        transformVisitors(node.statements),
        createBooleanLiteral(true),
      ]
    )
  }

  function createSemicolonClassElement(node: ts.SemicolonClassElement) {
    return createTsCall('createSemicolonClassElement', [])
  }

  function createTemplateSpan(node: ts.TemplateSpan) {
    return createTsCall(
      'createTemplateSpan',
      [
        transformVisitor(node.expression),
        transformVisitor(node.literal),
      ]
    )
  }

  function createMetaProperty(node: ts.MetaProperty) {
    return createTsCall(
      'createMetaProperty',
      [
        transformSyntaxKind(node.keywordToken),
        transformVisitor(node.name),
      ]
    )
  }

  function createNonNullExpression(node: ts.NonNullExpression) {
    return createTsCall(
      'createNonNullExpression',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createAsExpression(node: ts.AsExpression) {
    return createTsCall(
      'createAsExpression',
      [
        transformVisitor(node.expression),
        transformVisitor(node.type),
      ]
    )
  }

  function createExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments) {
    return createTsCall(
      'createExpressionWithTypeArguments',
      [
        transformVisitors(node.typeArguments),
        transformVisitor(node.expression),
      ]
    )
  }

  function createClassExpression(node: ts.ClassExpression) {
    return createTsCall(
      'createClassExpression',
      [
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitors(node.typeParameters),
        transformVisitors(node.heritageClauses),
        transformVisitors(node.members),
      ]
    )
  }

  function createSpreadElement(node: ts.SpreadElement) {
    return createTsCall(
      'createSpread',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createYieldExpression(node: ts.YieldExpression) {
    return createTsCall(
      'createYield',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createTemplateExpression(node: ts.TemplateExpression) {
    return createTsCall(
      'createTemplateExpression',
      [
        transformVisitor(node.head),
        transformVisitors(node.templateSpans),
      ]
    )
  }

  function createConditionalExpression(node: ts.ConditionalExpression) {
    return createTsCall(
      'createConditional',
      [
        transformVisitor(node.condition),
        transformVisitor(node.whenTrue),
        transformVisitor(node.whenFalse),
      ]
    )
  }

  function createBinaryExpression(node: ts.BinaryExpression) {
    return createTsCall(
      'createBinary',
      [
        transformVisitor(node.left),
        transformVisitor(node.operatorToken),
        transformVisitor(node.right),
      ]
    )
  }

  function createAwaitExpression(node: ts.AwaitExpression) {
    return createTsCall(
      'createAwait',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createVoidExpression(node: ts.VoidExpression) {
    return createTsCall(
      'createVoid',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createTypeOfExpression(node: ts.TypeOfExpression) {
    return createTsCall(
      'createTypeOf',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createDeleteExpression(node: ts.DeleteExpression) {
    return createTsCall(
      'createDelete',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createArrowFunction(node: ts.ArrowFunction) {
    return createTsCall(
      'createArrowFunction',
      [
        transformVisitors(node.modifiers),
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type),
        transformVisitor(node.equalsGreaterThanToken),
        transformVisitor(node.body),
      ]
    )
  }

  function createFunctionExpression(node: ts.FunctionExpression) {
    return createTsCall(
      'createFunctionExpression',
      [
        transformVisitors(node.modifiers),
        transformVisitor(node.asteriskToken),
        transformVisitor(node.name),
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type),
        transformVisitor(node.body),
      ]
    )
  }

  function createParenthesizedExpression(node: ts.ParenthesizedExpression) {
    return createTsCall(
      'createParen',
      [
        transformVisitor(node.expression),
      ]
    )
  }

  function createTypeAssertionExpression(node: ts.TypeAssertion) {
    return createTsCall(
      'createTypeAssertion',
      [
        transformVisitor(node.type),
        transformVisitor(node.expression),
      ]
    )
  }

  function createTaggedTemplateExpression(node: ts.TaggedTemplateExpression) {
    return createTsCall(
      'createTaggedTemplate',
      [
        transformVisitor(node.tag),
        transformVisitor(node.template),
      ]
    )
  }

  function createNewExpression(node: ts.NewExpression) {
    return createTsCall(
      'createNew',
      [
        transformVisitor(node.expression),
        transformVisitors(node.typeArguments),
        transformVisitors(node.arguments),
      ]
    )
  }

  function createCallExpression(node: ts.CallExpression) {
    return createTsCall(
      'createCall',
      [
        transformVisitor(node.expression),
        transformVisitors(node.typeArguments),
        transformVisitors(node.arguments),
      ]
    )
  }

  function createElementAccessExpression(node: ts.ElementAccessExpression) {
    return createTsCall(
      'createElementAccess',
      [
        transformVisitor(node.expression),
        transformVisitor(node.argumentExpression),
      ]
    )
  }

  function createPropertyAccessExpression(node: ts.PropertyAccessExpression) {
    return createTsCall(
      'createPropertyAccess',
      [
        transformVisitor(node.expression),
        transformVisitor(node.name),
      ]
    )
  }

  function createObjectLiteralExpression(node: ts.ObjectLiteralExpression) {
    return createTsCall(
      'createObjectLiteral',
      [
        transformVisitors(node.properties),
        createBooleanLiteral(false)
      ]
    )
  }

  function createArrayLiteralExpression(node: ts.ArrayLiteralExpression) {
    return createTsCall(
      'createArrayLiteral',
      [
        transformVisitors(node.elements),
        createBooleanLiteral(false)
      ]
    )
  }

  function createBindingElement(node: ts.BindingElement) {
    return createTsCall(
      'createBindingElement',
      [
        transformVisitor(node.dotDotDotToken),
        transformVisitor(node.propertyName),
        transformVisitor(node.name),
        transformVisitor(node.initializer),
      ]
    )
  }

  function createArrayBindingPattern(node: ts.ArrayBindingPattern) {
    return createTsCall(
      'createArrayBindingPattern',
      [
        transformVisitors(node.elements),
      ]
    )
  }

  function createObjectBindingPattern(node: ts.ObjectBindingPattern) {
    return createTsCall(
      'createObjectBindingPattern',
      [
        transformVisitors(node.elements),
      ]
    )
  }

  function createImportType(node: ts.ImportTypeNode) {
    return createTsCall(
      'createImportTypeNode',
      [
        transformVisitor(node.argument),
        transformVisitor(node.qualifier),
        transformVisitors(node.typeArguments),
        createBooleanLiteral(node.isTypeOf),
      ]
    )

  }

  function createLiteralType(node: ts.LiteralTypeNode) {
    return createTsCall('createLiteralTypeNode', [transformVisitor(node.literal)])
  }

  function createMappedType(node: ts.MappedTypeNode) {
    return createTsCall(
      'createMappedTypeNode',
      [
        transformVisitor(node.readonlyToken),
        transformVisitor(node.typeParameter),
        transformVisitor(node.questionToken),
        transformVisitor(node.type),
      ]
    )
  }

  function createIndexedAccessType(node: ts.IndexedAccessTypeNode) {
    return createTsCall(
      'createIndexedAccessTypeNode',
      [
        transformVisitor(node.objectType),
        transformVisitor(node.indexType),
      ]
    )
  }

  function createTypeOperator(node: ts.TypeOperatorNode) {
    return createTsCall(
      'createTypeOperatorNode',
      [
        transformSyntaxKind(node.operator),
        transformVisitor(node.type),
      ]
    )
  }

  function createThisType(node: ts.ThisTypeNode) {
    return createTsCall('createThisTypeNode')
  }

  function createParenthesizedType(node: ts.ParenthesizedTypeNode) {
    return createTsCall('createParenthesizedType', [transformVisitor(node.type)])
  }

  function createInferType(node: ts.InferTypeNode) {
    return createTsCall('createInferTypeNode', [transformVisitor(node.typeParameter)])
  }

  function createConditionalType(node: ts.ConditionalTypeNode) {
    return createTsCall(
      'createConditionalTypeNode',
      [
        transformVisitor(node.checkType),
        transformVisitor(node.extendsType),
        transformVisitor(node.trueType),
        transformVisitor(node.falseType)
      ]
    )
  }

  function createIntersectionType(node: ts.IntersectionTypeNode) {
    return createTsCall('createIntersectionTypeNode', [transformVisitors(node.types)])
  }

  function createUnionType(node: ts.UnionTypeNode) {
    return createTsCall('createUnionTypeNode', [transformVisitors(node.types)])
  }

  function createRestType(node: ts.RestTypeNode) {
    return createTsCall('createRestTypeNode', [transformVisitor(node.type)])
  }

  function createOptionalType(node: ts.OptionalTypeNode) {
    return createTsCall('createOptionalTypeNode', [transformVisitor(node.type)])
  }

  function createTypleType(node: ts.TupleTypeNode) {
    return createTsCall('createTupleTypeNode', [transformVisitors(node.elementTypes)])
  }

  function createArrayType(node: ts.ArrayTypeNode) {
    return createTsCall('createArrayTypeNode', [transformVisitor(node.elementType)])
  }

  function createTypeLiteral(node: ts.TypeLiteralNode) {
    return createTsCall('createTypeLiteralNode', [transformVisitors(node.members)])
  }

  function createTypeQuery(node: ts.TypeQueryNode) {
    return createTsCall('createTypeQueryNode', [transformVisitor(node.exprName)])
  }

  function createConstructorType(node: ts.ConstructorTypeNode) {
    return createTsCall(
      'createConstructorTypeNode',
      [
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type)
      ]
    )
  }

  function createFunctionType(node: ts.FunctionTypeNode) {
    return createTsCall(
      'createFunctionTypeNode',
      [
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type)
      ]
    )
  }

  function createTypeReference(node: ts.TypeReferenceNode) {
    return createTsCall(
      'createTypeReferenceNode',
      [
        transformVisitor(node.typeName),
        transformVisitors(node.typeArguments)
      ]
    )
  }

  function createTypePredicate(node: ts.TypePredicateNode) {
    return createTsCall(
      'createTypePredicateNode',
      [
        transformVisitor(node.parameterName),
        transformVisitor(node.type)
      ]
    )
  }

  function createIndexSignature(node: ts.IndexSignatureDeclaration) {
    return createTsCall(
      'createIndexSignature',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitors(node.parameters),
        transformVisitor(node.type)
      ]
    )
  }

  function createConstructSignature(node: ts.ConstructSignatureDeclaration) {
    return createTsCall(
      'createConstructSignature',
      [
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type)
      ]
    )
  }

  function createConstructor(node: ts.ConstructorDeclaration) {
    return createTsCall(
      'createConstructor',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitors(node.parameters),
        transformVisitor(node.body)
      ]
    )
  }

  function createMethodDeclaration(node: ts.MethodDeclaration) {
    return createTsCall(
      'createMethod',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.asteriskToken),
        transformVisitor(node.name),
        transformVisitor(node.questionToken),
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type),
        transformVisitor(node.body)
      ]
    )
  }

  function createMethodSignature(node: ts.MethodSignature) {
    return createTsCall(
      'createMethodSignature',
      [
        transformVisitors(node.typeParameters),
        transformVisitors(node.parameters),
        transformVisitor(node.type),
        transformVisitor(node.name),
        transformVisitor(node.questionToken)
      ]
    )
  }

  function createPropertyDeclaration(node: ts.PropertyDeclaration) {
    return createTsCall(
      'createProperty',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitorQuestionOrExclamation(node),
        transformVisitor(node.type),
        transformVisitor(node.initializer)
      ]
    )
  }

  function createPropertySignature(node: ts.PropertySignature) {
    return createTsCall(
      'createPropertySignature',
      [
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitor(node.questionToken),
        transformVisitor(node.type),
        transformVisitor(node.initializer)
      ]
    )
  }

  function createDecorator(node: ts.Decorator) {
    return createTsCall(
      'createDecorator',
      [transformVisitor(node.expression)]
    )
  }

  function createParameter(node: ts.ParameterDeclaration) {
    return createTsCall(
      'createParameter',
      [
        transformVisitors(node.decorators),
        transformVisitors(node.modifiers),
        transformVisitor(node.name),
        transformVisitor(node.questionToken),
        transformVisitor(node.type),
        transformVisitor(node.initializer)
      ]
    )
  }

  function createToken<T extends ts.SyntaxKind>(node: ts.Token<T>) {
    ts.createToken(node.kind)
    return createTsCall(
      'createToken',
      [transformSyntaxKind(node.kind)]
    )
  }

  function createTypeParameter(node: ts.TypeParameterDeclaration) {
    return createTsCall(
      'createTypeParameterDeclaration',
      [
        transformVisitor(node.name),
        transformVisitor(node.constraint),
        transformVisitor(node.default),
      ]
    )
  }

  function createComputedPropertyName(node: ts.ComputedPropertyName) {
    return createTsCall(
      'createComputedPropertyName',
      [transformVisitor(node.expression)]
    )
  }

  function createNumericLiteral(node: ts.NumericLiteral) {
    return createLiteralCall(node, 'createNumericLiteral')
  }

  function BigIntLiteral(node: ts.BigIntLiteral) {
    return createLiteralCall(node, 'createBigIntLiteral')
  }

  function createStringLiteral(node: ts.StringLiteral) {
    return createLiteralCall(node, 'createStringLiteral')
  }

  function createRegularExpressionLiteral(node: ts.RegularExpressionLiteral) {
    return createLiteralCall(node, 'createRegularExpressionLiteral')
  }

  function createNoSubstitutionTemplateLiteral(node: ts.NoSubstitutionTemplateLiteral) {
    return createLiteralCall(node, 'createNoSubstitutionTemplateLiteral')
  }

  function createTemplateHead(node: ts.TemplateHead) {
    return createLiteralCall(node, 'createTemplateHead')
  }

  function createTemplateMiddle(node: ts.TemplateMiddle) {
    return createLiteralCall(node, 'createTemplateMiddle')
  }

  function createTemplateTail(node: ts.TemplateTail) {
    return createLiteralCall(node, 'createTemplateTail')
  }

  function createIdentifier(node: ts.Identifier) {
    return createLiteralCall(node, 'createIdentifier')
  }

  function createQualifiedName(node: ts.QualifiedName) {
    return createTsCall(
      'createQualifiedName',
      [
        transformVisitor(node.left),
        transformVisitor(node.right)
      ]
    )
  }

  function createExpressionStatement(node: ts.ExpressionStatement) {
    return createTsCall(
      'createExpressionStatement',
      [transformVisitor(node.expression)]
    )
  }
}

console.log(code)
console.log("to")
console.log(printer.printFile(transformSourceFile(sourceFile)))
