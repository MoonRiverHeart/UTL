import { FunctionDef, ScenarioDef, ActionFactorDef, DataFactorDef, TestPointDef, TestCaseDef } from '../ast/nodes';
import { SemanticAnalyzer, SymbolInfo } from './analyzer';

export interface ResolvedFunction {
  name: string;
  description?: string;
  actionFactors: ActionFactorDef[];
  dataFactors: DataFactorDef[];
  testPoints: TestPointDef[];
  inheritanceChain: string[];
}

export class InheritanceResolver {
  private analyzer: SemanticAnalyzer;

  constructor(analyzer: SemanticAnalyzer) {
    this.analyzer = analyzer;
  }

  resolve(functionDef: FunctionDef): ResolvedFunction {
    const chain = this.buildInheritanceChain(functionDef);
    const merged = this.mergeWithStrategy(functionDef, chain, functionDef.mergeStrategy);

    return {
      name: merged.name,
      description: merged.description,
      actionFactors: merged.actionFactors,
      dataFactors: merged.dataFactors,
      testPoints: merged.testPoints,
      inheritanceChain: chain.map(d => d.name),
    };
  }

  private buildInheritanceChain(def: FunctionDef): (FunctionDef | ScenarioDef)[] {
    const chain: (FunctionDef | ScenarioDef)[] = [];

    for (const parentRef of def.extends) {
      const parent = this.findParent(parentRef);
      if (parent) {
        const parentChain = parent.type === 'function' 
          ? this.buildInheritanceChain(parent as FunctionDef) 
          : [];
        chain.push(...parentChain, parent);
      }
    }

    return chain;
  }

  private findParent(ref: string): FunctionDef | ScenarioDef | undefined {
    const symbol = this.analyzer.getSymbol(ref, 'function') || this.analyzer.getSymbol(ref, 'scenario');
    return symbol?.definition as FunctionDef | ScenarioDef | undefined;
  }

  private mergeWithStrategy(
    def: FunctionDef,
    chain: (FunctionDef | ScenarioDef)[],
    strategy: 'override' | 'merge' | 'error'
  ): FunctionDef {
    const merged: FunctionDef = {
      type: 'function',
      name: def.name,
      description: def.description,
      extends: def.extends,
      mergeStrategy: strategy,
      actionFactors: [...def.actionFactors],
      dataFactors: [...def.dataFactors],
      testPoints: [...def.testPoints],
    };

    for (const parent of chain) {
      if (strategy === 'override') {
        this.applyOverride(merged, parent);
      } else if (strategy === 'merge') {
        this.applyMerge(merged, parent);
      }
    }

    return merged;
  }

  private applyOverride(merged: FunctionDef, parent: FunctionDef | ScenarioDef): void {
    if (!merged.description && parent.description) {
      merged.description = parent.description;
    }

    for (const factor of parent.actionFactors) {
      if (!merged.actionFactors.some(f => f.name === factor.name)) {
        merged.actionFactors.push(factor);
      }
    }

    for (const factor of parent.dataFactors) {
      if (!merged.dataFactors.some(f => f.name === factor.name)) {
        merged.dataFactors.push(factor);
      }
    }

    if (parent.type === 'function') {
      for (const tp of (parent as FunctionDef).testPoints) {
        if (!merged.testPoints.some(t => t.name === tp.name)) {
          merged.testPoints.push(tp);
        }
      }
    }
  }

  private applyMerge(merged: FunctionDef, parent: FunctionDef | ScenarioDef): void {
    if (!merged.description && parent.description) {
      merged.description = parent.description;
    }

    for (const factor of parent.actionFactors) {
      merged.actionFactors.push(factor);
    }

    for (const factor of parent.dataFactors) {
      const existing = merged.dataFactors.find(f => f.name === factor.name);
      if (existing && factor.defaultValue && !existing.defaultValue) {
        existing.defaultValue = factor.defaultValue;
      } else if (!existing) {
        merged.dataFactors.push(factor);
      }
    }

    if (parent.type === 'function') {
      for (const tp of (parent as FunctionDef).testPoints) {
        merged.testPoints.push(tp);
      }
    }
  }
}