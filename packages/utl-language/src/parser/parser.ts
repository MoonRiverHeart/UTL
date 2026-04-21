import { Token, TokenType } from '../lexer/tokens';
import { UTLModule, DefinitionNode, ScenarioDef, FunctionDef, TestPointDef, TestCaseDef, ActionFactorDef, DataFactorDef } from '../ast/nodes';

export class UTLParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== TokenType.WHITESPACE && t.type !== TokenType.COMMENT);
  }

  parse(): UTLModule {
    const imports: ImportStatement[] = [];
    const exports: ExportStatement[] = [];
    const definitions: DefinitionNode[] = [];

    while (!this.isEOF()) {
      const token = this.currentToken();

      if (token.type === TokenType.IMPORT) {
        imports.push(this.parseImport());
      } else if (token.type === TokenType.EXPORT) {
        exports.push(this.parseExport());
      } else if (token.type === TokenType.SCENARIO) {
        definitions.push(this.parseScenario());
      } else if (token.type === TokenType.FUNCTION) {
        definitions.push(this.parseFunction());
      } else if (token.type === TokenType.TEST_FLOW) {
        definitions.push(this.parseTestFlow());
      } else {
        this.advance();
      }
    }

    return { type: 'module', imports, exports, definitions };
  }

  private isEOF(): boolean {
    return this.position >= this.tokens.length || this.currentToken().type === TokenType.EOF;
  }

  private currentToken(): Token {
    return this.tokens[this.position] || { type: TokenType.EOF, value: '', position: { line: 0, column: 0, offset: 0 } };
  }

  private advance(): Token {
    const token = this.currentToken();
    this.position++;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.currentToken();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} at line ${token.position.line}`);
    }
    this.advance();
    return token;
  }

  private parseImport(): ImportStatement {
    this.expect(TokenType.IMPORT);
    
    const kindToken = this.currentToken();
    const kind = kindToken.value as 'scenario' | 'function' | 'factor' | 'flow';
    this.advance();

    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    let from = '';
    if (this.currentToken().type === TokenType.FROM) {
      this.advance();
      const fromToken = this.expect(TokenType.STRING);
      from = this.stripQuotes(fromToken.value);
    }

    return { type: 'import', kind, name, from };
  }

  private parseExport(): ExportStatement {
    this.expect(TokenType.EXPORT);
    
    const kindToken = this.currentToken();
    const kind = kindToken.value as 'scenario' | 'function' | 'factor' | 'flow';
    this.advance();

    const names: string[] = [];
    while (this.currentToken().type === TokenType.STRING) {
      const nameToken = this.advance();
      names.push(this.stripQuotes(nameToken.value));
      if (this.currentToken().type === TokenType.COMMA) {
        this.advance();
      }
    }

    return { type: 'export', kind, names };
  }

  private parseScenario(): ScenarioDef {
    this.expect(TokenType.SCENARIO);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    this.expect(TokenType.LBRACE);

    const actionFactors: ActionFactorDef[] = [];
    const dataFactors: DataFactorDef[] = [];
    let description = '';
    const abstractFunctions: string[] = [];

    while (this.currentToken().type !== TokenType.RBRACE && !this.isEOF()) {
      const token = this.currentToken();

      if (token.type === TokenType.DESCRIPTION) {
        this.advance();
        const descToken = this.expect(TokenType.STRING);
        description = this.stripQuotes(descToken.value);
      } else if (token.type === TokenType.ACTION_FACTOR) {
        actionFactors.push(this.parseActionFactor());
      } else if (token.type === TokenType.DATA_FACTOR) {
        dataFactors.push(this.parseDataFactor());
      } else if (token.type === TokenType.ABSTRACT) {
        this.advance();
        if (this.currentToken().type === TokenType.FUNCTION) {
          this.advance();
          const fnName = this.expect(TokenType.STRING);
          abstractFunctions.push(this.stripQuotes(fnName.value));
        }
      } else {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);

    return { type: 'scenario', name, description, abstractFunctions, actionFactors, dataFactors };
  }

  private parseFunction(): FunctionDef {
    this.expect(TokenType.FUNCTION);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    const extendsRefs: string[] = [];
    if (this.currentToken().type === TokenType.EXTENDS) {
      this.advance();
      while (this.currentToken().type === TokenType.STRING) {
        extendsRefs.push(this.stripQuotes(this.advance().value));
        if (this.currentToken().type === TokenType.COMMA) {
          this.advance();
        }
      }
    }

    this.expect(TokenType.LBRACE);

    const actionFactors: ActionFactorDef[] = [];
    const dataFactors: DataFactorDef[] = [];
    const testPoints: TestPointDef[] = [];
    let description = '';
    let mergeStrategy: 'override' | 'merge' | 'error' = 'override';

    while (this.currentToken().type !== TokenType.RBRACE && !this.isEOF()) {
      const token = this.currentToken();

      if (token.type === TokenType.DESCRIPTION) {
        this.advance();
        const descToken = this.expect(TokenType.STRING);
        description = this.stripQuotes(descToken.value);
      } else if (token.type === TokenType.MERGE_STRATEGY) {
        this.advance();
        const strategyToken = this.currentToken();
        if (strategyToken.type === TokenType.OVERRIDE || strategyToken.type === TokenType.MERGE || strategyToken.type === TokenType.ERROR) {
          mergeStrategy = strategyToken.value as 'override' | 'merge' | 'error';
          this.advance();
        }
      } else if (token.type === TokenType.ACTION_FACTOR) {
        actionFactors.push(this.parseActionFactor());
      } else if (token.type === TokenType.DATA_FACTOR) {
        dataFactors.push(this.parseDataFactor());
      } else if (token.type === TokenType.TEST_POINT) {
        testPoints.push(this.parseTestPoint());
      } else {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);

    return { type: 'function', name, description, extends: extendsRefs, mergeStrategy, actionFactors, dataFactors, testPoints };
  }

  private parseTestPoint(): TestPointDef {
    this.expect(TokenType.TEST_POINT);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    this.expect(TokenType.LBRACE);

    const testCases: TestCaseDef[] = [];

    while (this.currentToken().type !== TokenType.RBRACE && !this.isEOF()) {
      if (this.currentToken().type === TokenType.TEST_CASE) {
        testCases.push(this.parseTestCase());
      } else {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);

    return { type: 'test_point', name, testCases };
  }

  private parseTestCase(): TestCaseDef {
    this.expect(TokenType.TEST_CASE);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    this.expect(TokenType.LBRACE);

    const preconditions: string[] = [];
    const testSteps: string[] = [];
    const expectedResults: string[] = [];

    while (this.currentToken().type !== TokenType.RBRACE && !this.isEOF()) {
      const token = this.currentToken();

      if (token.type === TokenType.PRECONDITION) {
        this.advance();
        const pcToken = this.expect(TokenType.STRING);
        preconditions.push(this.stripQuotes(pcToken.value));
      } else if (token.type === TokenType.TEST_STEP) {
        this.advance();
        const stepToken = this.expect(TokenType.STRING);
        testSteps.push(this.stripQuotes(stepToken.value));
      } else if (token.type === TokenType.EXPECTED_RESULT) {
        this.advance();
        const resultToken = this.expect(TokenType.STRING);
        expectedResults.push(this.stripQuotes(resultToken.value));
      } else {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);

    return { type: 'test_case', name, preconditions, testSteps, expectedResults };
  }

  private parseActionFactor(): ActionFactorDef {
    this.expect(TokenType.ACTION_FACTOR);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    return { type: 'action_factor', name };
  }

  private parseDataFactor(): DataFactorDef {
    this.expect(TokenType.DATA_FACTOR);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    let defaultValue = '';
    if (this.currentToken().type === TokenType.EQUALS) {
      this.advance();
      const valueToken = this.currentToken();
      defaultValue = valueToken.value;
      this.advance();
    }

    return { type: 'data_factor', name, defaultValue };
  }

  private parseTestFlow(): TestFlowDef {
    this.expect(TokenType.TEST_FLOW);
    
    const nameToken = this.expect(TokenType.STRING);
    const name = this.stripQuotes(nameToken.value);

    this.expect(TokenType.LBRACE);
    this.expect(TokenType.SEQUENCE);
    this.expect(TokenType.LBRACE);

    const sequence: FlowStep[] = [];

    while (this.currentToken().type !== TokenType.RBRACE && !this.isEOF()) {
      const token = this.currentToken();

      if (token.type === TokenType.CALL) {
        this.advance();
        const targetToken = this.expect(TokenType.STRING);
        sequence.push({ type: 'call', target: this.stripQuotes(targetToken.value) });
      } else if (token.type === TokenType.ASSERT) {
        this.advance();
        const assertToken = this.expect(TokenType.STRING);
        sequence.push({ type: 'assert', assertion: this.stripQuotes(assertToken.value) });
      } else {
        this.advance();
      }
    }

    this.expect(TokenType.RBRACE);
    this.expect(TokenType.RBRACE);

    return { type: 'test_flow', name, sequence };
  }

  private stripQuotes(value: string): string {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    return value;
  }
}

import { ImportStatement, ExportStatement, TestFlowDef, FlowStep } from '../ast/nodes';