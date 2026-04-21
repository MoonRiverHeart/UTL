import { UTLTokenizer } from '../lexer/tokenizer';
import { UTLParser } from '../parser/parser';
import { UTLGenerator } from './utlGenerator';
import { UTLModule, DefinitionNode, FunctionDef, ScenarioDef, TestCaseDef, ActionFactorDef, DataFactorDef, TestPointDef } from '../ast/nodes';
import { SemanticAnalyzer } from '../semantic/analyzer';
import { InheritanceResolver } from '../semantic/inheritanceResolver';

export interface MindmapNode {
  id: string;
  type: string;
  name: string;
  description?: string;
  position: { x: number; y: number };
  metadata: Record<string, unknown>;
  parentId?: string;
}

export interface MindmapRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  relations: MindmapRelation[];
}

export interface MindmapChange {
  type: 'create' | 'update' | 'delete';
  node?: MindmapNode;
  nodeId?: string;
  changes?: Partial<MindmapNode>;
}

export class MindmapSyncEngine {
  private tokenizer!: UTLTokenizer;
  private parser!: UTLParser;
  private generator!: UTLGenerator;
  private analyzer!: SemanticAnalyzer;
  private resolver!: InheritanceResolver;

  parseToMindmap(utlSource: string): MindmapData {
    this.tokenizer = new UTLTokenizer(utlSource);
    const tokens = this.tokenizer.tokenize();
    
    this.parser = new UTLParser(tokens);
    const ast = this.parser.parse();

    this.analyzer = new SemanticAnalyzer();
    this.analyzer.analyze(utlSource, 'current');
    
    this.resolver = new InheritanceResolver(this.analyzer);

    return this.astToMindmap(ast);
  }

  generateUTL(mindmapData: MindmapData): string {
    const ast = this.mindmapToAst(mindmapData);
    this.generator = new UTLGenerator();
    this.generator.setLanguage('chinese');
    return this.generator.generate(ast);
  }

  private astToMindmap(ast: UTLModule): MindmapData {
    const nodes: MindmapNode[] = [];
    const relations: MindmapRelation[] = [];
    let yPosition = 0;

    for (const def of ast.definitions) {
      const rootNode = this.definitionToNode(def, yPosition);
      nodes.push(rootNode);
      yPosition += 100;

      if (def.type === 'function') {
        const fnDef = def as FunctionDef;
        
        for (const factor of fnDef.actionFactors) {
          const factorNode = this.factorToNode(factor, 'action_factor', rootNode.id, yPosition);
          nodes.push(factorNode);
          relations.push({
            id: `rel-${rootNode.id}-${factorNode.id}`,
            sourceId: rootNode.id,
            targetId: factorNode.id,
            type: 'contains',
          });
          yPosition += 50;
        }

        for (const factor of fnDef.dataFactors) {
          const factorNode = this.factorToNode(factor, 'data_factor', rootNode.id, yPosition);
          nodes.push(factorNode);
          relations.push({
            id: `rel-${rootNode.id}-${factorNode.id}`,
            sourceId: rootNode.id,
            targetId: factorNode.id,
            type: 'contains',
          });
          yPosition += 50;
        }

        for (const tp of fnDef.testPoints) {
          const tpNode = this.testPointToNode(tp, rootNode.id, yPosition);
          nodes.push(tpNode);
          relations.push({
            id: `rel-${rootNode.id}-${tpNode.id}`,
            sourceId: rootNode.id,
            targetId: tpNode.id,
            type: 'contains',
          });
          yPosition += 100;

          for (const tc of tp.testCases) {
            const tcNode = this.testCaseToNode(tc, tpNode.id, yPosition);
            nodes.push(tcNode);
            relations.push({
              id: `rel-${tpNode.id}-${tcNode.id}`,
              sourceId: tpNode.id,
              targetId: tcNode.id,
              type: 'contains',
            });
            yPosition += 80;
          }
        }

        for (const parentRef of fnDef.extends) {
          const parentNodeId = `node-${parentRef}`;
          relations.push({
            id: `rel-extends-${rootNode.id}-${parentNodeId}`,
            sourceId: rootNode.id,
            targetId: parentNodeId,
            type: 'extends',
          });
        }
      }
    }

    return { nodes, relations };
  }

  private definitionToNode(def: DefinitionNode, y: number): MindmapNode {
    return {
      id: `node-${def.name}`,
      type: def.type,
      name: def.name,
      description: def.type === 'scenario' || def.type === 'function' 
        ? (def as ScenarioDef | FunctionDef).description 
        : undefined,
      position: { x: 100, y },
      metadata: def.type === 'function' 
        ? { mergeStrategy: (def as FunctionDef).mergeStrategy }
        : {},
    };
  }

  private factorToNode(factor: ActionFactorDef | DataFactorDef, type: string, parentId: string, y: number): MindmapNode {
    return {
      id: `node-${factor.name}-${Date.now()}`,
      type,
      name: factor.name,
      parentId,
      position: { x: 200, y },
      metadata: type === 'data_factor' && (factor as DataFactorDef).defaultValue
        ? { defaultValue: (factor as DataFactorDef).defaultValue }
        : {},
    };
  }

  private testPointToNode(tp: TestPointDef, parentId: string, y: number): MindmapNode {
    return {
      id: `node-tp-${tp.name}`,
      type: 'test_point',
      name: tp.name,
      parentId,
      position: { x: 200, y },
      metadata: {},
    };
  }

  private testCaseToNode(tc: TestCaseDef, parentId: string, y: number): MindmapNode {
    return {
      id: `node-tc-${tc.name}-${Date.now()}`,
      type: 'test_case',
      name: tc.name,
      parentId,
      position: { x: 300, y },
      metadata: {
        preconditions: tc.preconditions,
        testSteps: tc.testSteps,
        expectedResults: tc.expectedResults,
      },
    };
  }

  private mindmapToAst(data: MindmapData): UTLModule {
    const definitions: DefinitionNode[] = [];
    const rootNodes = data.nodes.filter(n => !n.parentId);

    for (const node of rootNodes) {
      if (node.type === 'scenario' || node.type === 'function') {
        const def = this.nodeToDefinition(node, data);
        definitions.push(def);
      }
    }

    return {
      type: 'module',
      imports: [],
      exports: [],
      definitions,
    };
  }

  private nodeToDefinition(node: MindmapNode, data: MindmapData): FunctionDef | ScenarioDef {
    const children = data.nodes.filter(n => n.parentId === node.id);
    const extendsRefs = data.relations
      .filter(r => r.sourceId === node.id && r.type === 'extends')
      .map(r => data.nodes.find(n => n.id === r.targetId)?.name || '');

    if (node.type === 'scenario') {
      return {
        type: 'scenario',
        name: node.name,
        description: node.description,
        abstractFunctions: [],
        actionFactors: children.filter(c => c.type === 'action_factor').map(c => ({ type: 'action_factor', name: c.name })),
        dataFactors: children.filter(c => c.type === 'data_factor').map(c => ({
          type: 'data_factor',
          name: c.name,
          defaultValue: c.metadata.defaultValue as string,
        })),
      };
    }

    const testPoints: TestPointDef[] = [];
    const tpNodes = children.filter(c => c.type === 'test_point');
    for (const tpNode of tpNodes) {
      const tcNodes = data.nodes.filter(n => n.parentId === tpNode.id && n.type === 'test_case');
      testPoints.push({
        type: 'test_point',
        name: tpNode.name,
        testCases: tcNodes.map(tc => ({
          type: 'test_case',
          name: tc.name,
          preconditions: tc.metadata.preconditions as string[] || [],
          testSteps: tc.metadata.testSteps as string[] || [],
          expectedResults: tc.metadata.expectedResults as string[] || [],
        })),
      });
    }

    return {
      type: 'function',
      name: node.name,
      description: node.description,
      extends: extendsRefs,
      mergeStrategy: node.metadata.mergeStrategy as 'override' | 'merge' | 'error' || 'override',
      actionFactors: children.filter(c => c.type === 'action_factor').map(c => ({ type: 'action_factor', name: c.name })),
      dataFactors: children.filter(c => c.type === 'data_factor').map(c => ({
        type: 'data_factor',
        name: c.name,
        defaultValue: c.metadata.defaultValue as string,
      })),
      testPoints,
    };
  }

  syncFromMindmapChange(
    oldSource: string,
    node: MindmapNode,
    change: Partial<MindmapNode>
  ): { start: number; end: number; newText: string } {
    const oldData = this.parseToMindmap(oldSource);
    const newNode = { ...node, ...change };
    
    const newData: MindmapData = {
      nodes: oldData.nodes.map(n => n.id === node.id ? newNode : n),
      relations: oldData.relations,
    };

    const newSource = this.generateUTL(newData);
    
    return {
      start: 0,
      end: oldSource.length,
      newText: newSource,
    };
  }

  syncFromUTLChange(oldSource: string, newSource: string): MindmapChange[] {
    const oldData = this.parseToMindmap(oldSource);
    const newData = this.parseToMindmap(newSource);

    const changes: MindmapChange[] = [];

    for (const newNode of newData.nodes) {
      const existing = oldData.nodes.find(n => n.id === newNode.id);
      if (!existing) {
        changes.push({ type: 'create', node: newNode });
      } else if (!this.nodesEqual(existing, newNode)) {
        changes.push({ type: 'update', nodeId: newNode.id, changes: newNode });
      }
    }

    for (const oldNode of oldData.nodes) {
      if (!newData.nodes.find(n => n.id === oldNode.id)) {
        changes.push({ type: 'delete', nodeId: oldNode.id });
      }
    }

    return changes;
  }

  private nodesEqual(a: MindmapNode, b: MindmapNode): boolean {
    return a.name === b.name && a.type === b.type && a.description === b.description;
  }
}