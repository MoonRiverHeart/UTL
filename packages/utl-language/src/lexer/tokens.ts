/**
 * Token类型定义 - 支持中英文双语关键字
 */

export enum TokenType {
  // 结构关键字
  SCENARIO = 'SCENARIO',
  FUNCTION = 'FUNCTION',
  TEST_POINT = 'TEST_POINT',
  ACTION_FACTOR = 'ACTION_FACTOR',
  DATA_FACTOR = 'DATA_FACTOR',
  TEST_CASE = 'TEST_CASE',
  PRECONDITION = 'PRECONDITION',
  TEST_STEP = 'TEST_STEP',
  EXPECTED_RESULT = 'EXPECTED_RESULT',
  
  // 继承关键字
  EXTENDS = 'EXTENDS',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  ABSTRACT = 'ABSTRACT',
  REF = 'REF',
  
  // 描述关键字
  DESCRIPTION = 'DESCRIPTION',
  FROM = 'FROM',
  WITH = 'WITH',
  AS = 'AS',
  
  // 合并策略
  MERGE_STRATEGY = 'MERGE_STRATEGY',
  OVERRIDE = 'OVERRIDE',
  MERGE = 'MERGE',
  ERROR = 'ERROR',
  
  // 流程关键字
  TEST_FLOW = 'TEST_FLOW',
  SEQUENCE = 'SEQUENCE',
  CALL = 'CALL',
  ASSERT = 'ASSERT',
  
  // 符号
  LBRACE = 'LBRACE',        // {
  RBRACE = 'RBRACE',        // }
  LPAREN = 'LPAREN',        // (
  RPAREN = 'RPAREN',        // )
  LBRACKET = 'LBRACKET',    // [
  RBRACKET = 'RBRACKET',    // ]
  COMMA = 'COMMA',          // ,
  COLON = 'COLON',          // :
  SEMICOLON = 'SEMICOLON',  // ;
  EQUALS = 'EQUALS',        // =
  ARROW = 'ARROW',          // ->
  
  // 基础类型
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  
  // 特殊
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
  WHITESPACE = 'WHITESPACE',
}

export interface Token {
  type: TokenType;
  value: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

/**
 * 中英文关键字映射表
 */
export const KEYWORDS: Record<string, TokenType> = {
  // 中文关键字
  '场景': TokenType.SCENARIO,
  '功能': TokenType.FUNCTION,
  '测试点': TokenType.TEST_POINT,
  '动作因子': TokenType.ACTION_FACTOR,
  '数据因子': TokenType.DATA_FACTOR,
  '测试用例': TokenType.TEST_CASE,
  '预制条件': TokenType.PRECONDITION,
  '测试步骤': TokenType.TEST_STEP,
  '预期结果': TokenType.EXPECTED_RESULT,
  '继承': TokenType.EXTENDS,
  '导入': TokenType.IMPORT,
  '导出': TokenType.EXPORT,
  '抽象': TokenType.ABSTRACT,
  '描述': TokenType.DESCRIPTION,
  '合并策略': TokenType.MERGE_STRATEGY,
  '覆盖': TokenType.OVERRIDE,
  '合并': TokenType.MERGE,
  '报错': TokenType.ERROR,
  '来源': TokenType.FROM,
  '参数': TokenType.WITH,
  '测试流程': TokenType.TEST_FLOW,
  '序列': TokenType.SEQUENCE,
  '调用': TokenType.CALL,
  '断言': TokenType.ASSERT,
  
  // 英文关键字（兼容）
  'SCENARIO': TokenType.SCENARIO,
  'FUNCTION': TokenType.FUNCTION,
  'TEST_POINT': TokenType.TEST_POINT,
  'ACTION_FACTOR': TokenType.ACTION_FACTOR,
  'DATA_FACTOR': TokenType.DATA_FACTOR,
  'TEST_CASE': TokenType.TEST_CASE,
  'PRECONDITION': TokenType.PRECONDITION,
  'TEST_STEP': TokenType.TEST_STEP,
  'EXPECTED_RESULT': TokenType.EXPECTED_RESULT,
  'EXTENDS': TokenType.EXTENDS,
  'IMPORT': TokenType.IMPORT,
  'EXPORT': TokenType.EXPORT,
  'ABSTRACT': TokenType.ABSTRACT,
  'DESCRIPTION': TokenType.DESCRIPTION,
  'FROM': TokenType.FROM,
  'WITH': TokenType.WITH,
  'AS': TokenType.AS,
  'MERGE_STRATEGY': TokenType.MERGE_STRATEGY,
  'OVERRIDE': TokenType.OVERRIDE,
  'MERGE': TokenType.MERGE,
  'ERROR': TokenType.ERROR,
  'TEST_FLOW': TokenType.TEST_FLOW,
  'SEQUENCE': TokenType.SEQUENCE,
  'CALL': TokenType.CALL,
  'ASSERT': TokenType.ASSERT,
};