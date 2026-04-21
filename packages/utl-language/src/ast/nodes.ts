export interface UTLModule {
  type: 'module';
  imports: ImportStatement[];
  exports: ExportStatement[];
  definitions: DefinitionNode[];
}

export interface ImportStatement {
  type: 'import';
  kind: 'scenario' | 'function' | 'factor' | 'flow';
  name: string;
  from: string;
  alias?: string;
}

export interface ExportStatement {
  type: 'export';
  kind: 'scenario' | 'function' | 'factor' | 'flow';
  names: string[];
}

export type DefinitionNode = ScenarioDef | FunctionDef | TestPointDef | TestCaseDef | ActionFactorDef | DataFactorDef | TestFlowDef;

export interface ScenarioDef {
  type: 'scenario';
  name: string;
  description?: string;
  abstractFunctions: string[];
  actionFactors: ActionFactorDef[];
  dataFactors: DataFactorDef[];
}

export interface FunctionDef {
  type: 'function';
  name: string;
  description?: string;
  extends: string[];
  mergeStrategy: 'override' | 'merge' | 'error';
  actionFactors: ActionFactorDef[];
  dataFactors: DataFactorDef[];
  testPoints: TestPointDef[];
}

export interface TestPointDef {
  type: 'test_point';
  name: string;
  testCases: TestCaseDef[];
}

export interface TestCaseDef {
  type: 'test_case';
  name: string;
  preconditions: string[];
  testSteps: string[];
  expectedResults: string[];
}

export interface ActionFactorDef {
  type: 'action_factor';
  name: string;
  template?: string;
}

export interface DataFactorDef {
  type: 'data_factor';
  name: string;
  defaultValue?: string;
}

export interface TestFlowDef {
  type: 'test_flow';
  name: string;
  sequence: FlowStep[];
}

export interface FlowStep {
  type: 'call' | 'assert';
  target?: string;
  params?: Record<string, unknown>;
  assertion?: string;
}

export interface InheritanceRelation {
  id: string;
  childId: string;
  parentId: string;
  relationType: 'extends' | 'implements' | 'references';
  mergeStrategy: 'override' | 'merge' | 'error';
  resolvedFields: string[];
}