export class CommandParser {
  parse(input: string): { command: string; args: string[] } {
    const trimmed = input.trim();

    // 注释处理
    if (trimmed.startsWith('#') || trimmed === '') {
      return { command: '', args: [] };
    }

    // 解析带引号的参数
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    const command = tokens[0] || '';
    const args = tokens.slice(1);

    return { command, args };
  }

  parseNumber(str: string): number {
    const num = parseFloat(str);
    if (isNaN(num)) {
      throw new Error(`invalid number: ${str}`);
    }
    return num;
  }
}
