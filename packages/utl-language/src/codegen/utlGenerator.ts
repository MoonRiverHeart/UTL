import { UTLModule, ScenarioDef, FunctionDef, TestPointDef, TestCaseDef, ActionFactorDef, DataFactorDef, TestFlowDef, DefinitionNode } from '../ast/nodes';

export class UTLGenerator {
  private language: 'chinese' | 'english' = 'chinese';

  setLanguage(lang: 'chinese' | 'english'): void {
    this.language = lang;
  }

  generate(module: UTLModule): string {
    const lines: string[] = [];

    for (const imp of module.imports) {
      lines.push(this.generateImport(imp));
    }

    for (const def of module.definitions) {
      lines.push(this.generateDefinition(def));
      lines.push('');
    }

    for (const exp of module.exports) {
      lines.push(this.generateExport(exp));
    }

    return lines.join('\n');
  }

  private generateImport(imp: ImportStatement): string {
    const kindKeyword = this.language === 'chinese' 
      ? { scenario: '场景', function: '功能', factor: '因子', flow: '流程' }
      : { scenario: 'SCENARIO', function: 'FUNCTION', factor: 'FACTOR', flow: 'FLOW' };

    const fromKeyword = this.language === 'chinese' ? '来源' : 'FROM';
    const importKeyword = this.language === 'chinese' ? '导入' : 'IMPORT';

    let line = `${importKeyword} ${kindKeyword[imp.kind]} "${imp.name}"`;
    if (imp.from) {
      line += ` ${fromKeyword} "${imp.from}"`;
    }
    return line;
  }

  private generateExport(exp: ExportStatement): string {
    const kindKeyword = this.language === 'chinese'
      ? { scenario: '场景', function: '功能', factor: '因子', flow: '流程' }
      : { scenario: 'SCENARIO', function: 'FUNCTION', factor: 'FACTOR', flow: 'FLOW' };

    const exportKeyword = this.language === 'chinese' ? '导出' : 'EXPORT';
    const names = exp.names.map(n => `"${n}"`).join(', ');

    return `${exportKeyword} ${kindKeyword[exp.kind]} ${names}`;
  }

  private generateDefinition(def: DefinitionNode): string {
    switch (def.type) {
      case 'scenario':
        return this.generateScenario(def);
      case 'function':
        return this.generateFunction(def);
      case 'test_flow':
        return this.generateTestFlow(def);
      default:
        return '';
    }
  }

  private generateScenario(scenario: ScenarioDef): string {
    const keyword = this.language === 'chinese' ? '场景' : 'SCENARIO';
    const descKeyword = this.language === 'chinese' ? '描述' : 'DESCRIPTION';
    const actionKeyword = this.language === 'chinese' ? '动作因子' : 'ACTION_FACTOR';
    const dataKeyword = this.language === 'chinese' ? '数据因子' : 'DATA_FACTOR';
    const abstractKeyword = this.language === 'chinese' ? '抽象 功能' : 'ABSTRACT FUNCTION';

    const lines: string[] = [];
    lines.push(`${keyword} "${scenario.name}" {`);

    if (scenario.description) {
      lines.push(`  ${descKeyword} "${scenario.description}"`);
    }

    for (const fn of scenario.abstractFunctions) {
      lines.push(`  ${abstractKeyword} "${fn}"`);
    }

    for (const factor of scenario.actionFactors) {
      lines.push(`  ${actionKeyword} "${factor.name}"`);
    }

    for (const factor of scenario.dataFactors) {
      lines.push(`  ${dataKeyword} "${factor.name}"`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateFunction(fn: FunctionDef): string {
    const keyword = this.language === 'chinese' ? '功能' : 'FUNCTION';
    const extendsKeyword = this.language === 'chinese' ? '继承' : 'EXTENDS';
    const descKeyword = this.language === 'chinese' ? '描述' : 'DESCRIPTION';
    const strategyKeyword = this.language === 'chinese' ? '合并策略' : 'MERGE_STRATEGY';
    const actionKeyword = this.language === 'chinese' ? '动作因子' : 'ACTION_FACTOR';
    const dataKeyword = this.language === 'chinese' ? '数据因子' : 'DATA_FACTOR';

    const lines: string[] = [];

    let header = `${keyword} "${fn.name}"`;
    if (fn.extends.length > 0) {
      const parents = fn.extends.map(p => `"${p}"`).join(', ');
      header += ` ${extendsKeyword} ${parents}`;
    }
    lines.push(`${header} {`);

    if (fn.description) {
      lines.push(`  ${descKeyword} "${fn.description}"`);
    }

    if (fn.mergeStrategy !== 'override') {
      const strategyValue = this.language === 'chinese' 
        ? { override: '覆盖', merge: '合并', error: '报错' }
        : { override: 'OVERRIDE', merge: 'MERGE', error: 'ERROR' };
      lines.push(`  ${strategyKeyword} ${strategyValue[fn.mergeStrategy]}`);
    }

    for (const factor of fn.actionFactors) {
      const template = factor.template ? `: ${factor.template}` : '';
      lines.push(`  ${actionKeyword} "${factor.name}"${template}`);
    }

    for (const factor of fn.dataFactors) {
      let line = `  ${dataKeyword} "${factor.name}"`;
      if (factor.defaultValue) {
        line += ` = "${factor.defaultValue}"`;
      }
      lines.push(line);
    }

    for (const tp of fn.testPoints) {
      lines.push(this.generateTestPoint(tp, 1));
    }

    lines.push('}');
    return lines.join('\n');
  }

  private generateTestPoint(tp: TestPointDef, indent: number): string {
    const keyword = this.language === 'chinese' ? '测试点' : 'TEST_POINT';
    const caseKeyword = this.language === 'chinese' ? '测试用例' : 'TEST_CASE';
    const indentStr = '  '.repeat(indent);

    const lines: string[] = [];
    lines.push(`${indentStr}${keyword} "${tp.name}" {`);

    for (const tc of tp.testCases) {
      lines.push(this.generateTestCase(tc, indent + 1));
    }

    lines.push(`${indentStr}}`);
    return lines.join('\n');
  }

  private generateTestCase(tc: TestCaseDef, indent: number): string {
    const caseKeyword = this.language === 'chinese' ? '测试用例' : 'TEST_CASE';
    const preKeyword = this.language === 'chinese' ? '预制条件' : 'PRECONDITION';
    const stepKeyword = this.language === 'chinese' ? '测试步骤' : 'TEST_STEP';
    const resultKeyword = this.language === 'chinese' ? '预期结果' : 'EXPECTED_RESULT';
    const indentStr = '  '.repeat(indent);

    const lines: string[] = [];
    lines.push(`${indentStr}${caseKeyword} "${tc.name}" {`);

    for (const pre of tc.preconditions) {
      lines.push(`${indentStr}  ${preKeyword} "${pre}"`);
    }

    for (const step of tc.testSteps) {
      lines.push(`${indentStr}  ${stepKeyword} "${step}"`);
    }

    for (const result of tc.expectedResults) {
      lines.push(`${indentStr}  ${resultKeyword} "${result}"`);
    }

    lines.push(`${indentStr}}`);
    return lines.join('\n');
  }

  private generateTestFlow(flow: TestFlowDef): string {
    const keyword = this.language === 'chinese' ? '测试流程' : 'TEST_FLOW';
    const seqKeyword = this.language === 'chinese' ? '序列' : 'SEQUENCE';
    const callKeyword = this.language === 'chinese' ? '调用' : 'CALL';
    const assertKeyword = this.language === 'chinese' ? '断言' : 'ASSERT';
    const withKeyword = this.language === 'chinese' ? '参数' : 'WITH';

    const lines: string[] = [];
    lines.push(`${keyword} "${flow.name}" {`);
    lines.push(`  ${seqKeyword} {`);

    for (const step of flow.sequence) {
      if (step.type === 'call') {
        let line = `    ${callKeyword} "${step.target}"`;
        if (step.params) {
          const params = Object.entries(step.params)
            .map(([k, v]) => `"${k}": "${v}"`)
            .join(', ');
          line += ` ${withKeyword} { ${params} }`;
        }
        lines.push(line);
      } else if (step.type === 'assert') {
        lines.push(`    ${assertKeyword} "${step.assertion}"`);
      }
    }

    lines.push('  }');
    lines.push('}');
    return lines.join('\n');
  }
}

import { ImportStatement, ExportStatement, FlowStep } from '../ast/nodes';