/**
 * UTL词法分析器 - 支持中英文双语关键字识别
 */

import { Token, TokenType, KEYWORDS } from './tokens';

export class UTLTokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isEOF()) {
      this.readNextToken();
    }
    this.tokens.push(this.createToken(TokenType.EOF, ''));
    return this.tokens;
  }

  private isEOF(): boolean {
    return this.position >= this.source.length;
  }

  private currentChar(): string {
    return this.source[this.position] || '';
  }

  private peek(offset: number = 1): string {
    return this.source[this.position + offset] || '';
  }

  private advance(): void {
    this.position++;
    this.column++;
  }

  private advanceLine(): void {
    this.line++;
    this.column = 1;
  }

  /**
   * 判断是否为中文字符 (Unicode范围: 0x4E00 - 0x9FFF)
   */
  private isChineseChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return code >= 0x4E00 && code <= 0x9FFF;
  }

  /**
   * 判断是否为字母或下划线
   */
  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  /**
   * 判断是否为数字
   */
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  /**
   * 判断是否为空白字符
   */
  private isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  private readNextToken(): void {
    const char = this.currentChar();

    // 处理空白字符（保留换行）
    if (char === '\n') {
      this.tokens.push(this.createToken(TokenType.NEWLINE, '\n'));
      this.advanceLine();
      this.advance();
      return;
    }

    if (this.isWhitespace(char)) {
      this.skipWhitespace();
      return;
    }

    // 处理注释
    if (char === '/' && this.peek() === '/') {
      this.readComment();
      return;
    }

    // 处理中文字符/关键字
    if (this.isChineseChar(char)) {
      this.readChineseToken();
      return;
    }

    // 处理英文字母/关键字
    if (this.isAlpha(char)) {
      this.readEnglishToken();
      return;
    }

    // 处理数字
    if (this.isDigit(char)) {
      this.readNumber();
      return;
    }

    // 处理字符串
    if (char === '"' || char === "'") {
      this.readString(char);
      return;
    }

    // 处理符号
    this.readSymbol();
  }

  private skipWhitespace(): void {
    while (!this.isEOF() && this.isWhitespace(this.currentChar()) && this.currentChar() !== '\n') {
      this.advance();
    }
  }

  private readComment(): void {
    const start = this.position;
    this.advance(); // skip first /
    this.advance(); // skip second /

    while (!this.isEOF() && this.currentChar() !== '\n') {
      this.advance();
    }

    this.tokens.push(this.createToken(TokenType.COMMENT, this.source.slice(start, this.position)));
  }

  /**
   * 读取中文关键字或标识符
   */
  private readChineseToken(): void {
    const start = this.position;
    
    while (!this.isEOF() && this.isChineseChar(this.currentChar())) {
      this.advance();
    }

    const value = this.source.slice(start, this.position);
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;
    
    this.tokens.push(this.createToken(type, value));
  }

  /**
   * 读取英文关键字或标识符
   */
  private readEnglishToken(): void {
    const start = this.position;

    while (!this.isEOF() && (this.isAlpha(this.currentChar()) || this.isDigit(this.currentChar()))) {
      this.advance();
    }

    const value = this.source.slice(start, this.position);
    const type = KEYWORDS[value] || TokenType.IDENTIFIER;

    this.tokens.push(this.createToken(type, value));
  }

  private readNumber(): void {
    const start = this.position;

    while (!this.isEOF() && this.isDigit(this.currentChar())) {
      this.advance();
    }

    // 处理小数点
    if (this.currentChar() === '.' && this.isDigit(this.peek())) {
      this.advance();
      while (!this.isEOF() && this.isDigit(this.currentChar())) {
        this.advance();
      }
    }

    this.tokens.push(this.createToken(TokenType.NUMBER, this.source.slice(start, this.position)));
  }

  private readString(quote: string): void {
    const start = this.position;
    this.advance(); // skip opening quote

    while (!this.isEOF() && this.currentChar() !== quote) {
      if (this.currentChar() === '\\') {
        this.advance(); // skip escape character
      }
      this.advance();
    }

    if (this.currentChar() === quote) {
      this.advance(); // skip closing quote
    }

    this.tokens.push(this.createToken(TokenType.STRING, this.source.slice(start, this.position)));
  }

  private readSymbol(): void {
    const char = this.currentChar();
    let type: TokenType;

    switch (char) {
      case '{':
        type = TokenType.LBRACE;
        break;
      case '}':
        type = TokenType.RBRACE;
        break;
      case '(':
        type = TokenType.LPAREN;
        break;
      case ')':
        type = TokenType.RPAREN;
        break;
      case '[':
        type = TokenType.LBRACKET;
        break;
      case ']':
        type = TokenType.RBRACKET;
        break;
      case ',':
        type = TokenType.COMMA;
        break;
      case ':':
        type = TokenType.COLON;
        break;
      case ';':
        type = TokenType.SEMICOLON;
        break;
      case '=':
        type = TokenType.EQUALS;
        break;
      case '-':
        if (this.peek() === '>') {
          this.advance();
          this.tokens.push(this.createToken(TokenType.ARROW, '->'));
          this.advance();
          return;
        }
        type = TokenType.IDENTIFIER; // standalone -
        break;
      default:
        type = TokenType.IDENTIFIER;
    }

    this.tokens.push(this.createToken(type, char));
    this.advance();
  }

  private createToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      position: {
        line: this.line,
        column: this.column,
        offset: this.position,
      },
    };
  }
}