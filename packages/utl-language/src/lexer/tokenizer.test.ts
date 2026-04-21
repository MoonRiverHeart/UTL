import { UTLTokenizer } from './tokenizer';
import { TokenType } from './tokens';

describe('UTL Tokenizer', () => {
  it('should tokenize Chinese keywords correctly', () => {
    const source = '场景 "用户登录"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(2);
    expect(tokens[0].type).toBe(TokenType.SCENARIO);
    expect(tokens[0].value).toBe('场景');
    expect(tokens[1].type).toBe(TokenType.STRING);
    expect(tokens[1].value).toContain('用户登录');
  });

  it('should tokenize English keywords correctly', () => {
    const source = 'SCENARIO "User Login"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.length).toBeGreaterThan(2);
    expect(tokens[0].type).toBe(TokenType.SCENARIO);
    expect(tokens[1].type).toBe(TokenType.STRING);
  });

  it('should tokenize function with extends', () => {
    const source = '功能 "密码登录" 继承 "用户登录"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.find(t => t.type === TokenType.FUNCTION)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.EXTENDS)).toBeDefined();
  });

  it('should tokenize test case structure', () => {
    const source = `测试用例 "正常登录" {
      预制条件 "用户已注册"
      测试步骤 "输入用户名密码"
      预期结果 "登录成功"
    }`;
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.find(t => t.type === TokenType.TEST_CASE)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.PRECONDITION)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.TEST_STEP)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.EXPECTED_RESULT)).toBeDefined();
  });

  it('should tokenize braces and symbols', () => {
    const source = '场景 "测试" { }';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.find(t => t.type === TokenType.LBRACE)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.RBRACE)).toBeDefined();
  });

  it('should tokenize comments', () => {
    const source = '// 这是注释\n场景 "测试"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    const commentToken = tokens.find(t => t.type === TokenType.COMMENT);
    expect(commentToken).toBeDefined();
    expect(commentToken?.value).toContain('这是注释');
  });

  it('should tokenize numbers', () => {
    const source = '版本 1.5';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
    expect(numberToken).toBeDefined();
  });

  it('should handle empty source', () => {
    const tokenizer = new UTLTokenizer('');
    const tokens = tokenizer.tokenize();
    
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe(TokenType.EOF);
  });

  it('should track line and column positions', () => {
    const source = '场景 "测试"\n功能 "登录"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    const scenarioToken = tokens.find(t => t.type === TokenType.SCENARIO);
    expect(scenarioToken?.position.line).toBe(1);
    
    const functionToken = tokens.find(t => t.type === TokenType.FUNCTION);
    expect(functionToken?.position.line).toBe(2);
  });

  it('should tokenize action and data factors', () => {
    const source = '动作因子 "点击按钮"\n数据因子 "用户名"';
    const tokenizer = new UTLTokenizer(source);
    const tokens = tokenizer.tokenize();
    
    expect(tokens.find(t => t.type === TokenType.ACTION_FACTOR)).toBeDefined();
    expect(tokens.find(t => t.type === TokenType.DATA_FACTOR)).toBeDefined();
  });
});