import { UTLModule, DefinitionNode, FunctionDef, ScenarioDef } from '../ast/nodes';
import { UTLParser } from '../parser/parser';
import { UTLTokenizer } from '../lexer/tokenizer';

export interface SemanticError {
  message: string;
  line: number;
  column: number;
}

export interface SymbolInfo {
  name: string;
  type: string;
  definition: DefinitionNode;
  file: string;
}

export class SemanticAnalyzer {
  private symbolTable: Map<string, SymbolInfo> = new Map();
  private errors: SemanticError[] = [];
  private modules: Map<string, UTLModule> = new Map();

  analyze(source: string, filePath: string): SemanticError[] {
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new UTLParser(tokens);
    const module = parser.parse();

    this.modules.set(filePath, module);
    this.collectSymbols(module, filePath);
    this.checkReferences(module);

    return this.errors;
  }

  private collectSymbols(module: UTLModule, filePath: string): void {
    for (const def of module.definitions) {
      const key = `${def.type}:${def.name}`;
      if (this.symbolTable.has(key)) {
        const existing = this.symbolTable.get(key)!;
        this.errors.push({
          message: `Duplicate definition: ${def.name} (already defined in ${existing.file})`,
          line: 0,
          column: 0,
        });
      } else {
        this.symbolTable.set(key, {
          name: def.name,
          type: def.type,
          definition: def,
          file: filePath,
        });
      }
    }
  }

  private checkReferences(module: UTLModule): void {
    for (const def of module.definitions) {
      if (def.type === 'function') {
        for (const parentRef of def.extends) {
          const key = `function:${parentRef}`;
          if (!this.symbolTable.has(key) && !this.symbolTable.has(`scenario:${parentRef}`)) {
            this.errors.push({
              message: `Cannot find parent: ${parentRef}`,
              line: 0,
              column: 0,
            });
          }
        }
      }
    }
  }

  getSymbol(name: string, type?: string): SymbolInfo | undefined {
    if (type) {
      return this.symbolTable.get(`${type}:${name}`);
    }
    
    for (const [key, info] of this.symbolTable) {
      if (info.name === name) {
        return info;
      }
    }
    
    return undefined;
  }

  getAllSymbols(): SymbolInfo[] {
    return Array.from(this.symbolTable.values());
  }
}