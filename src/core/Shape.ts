// 图形基类（抽象类）
export abstract class Shape {
  constructor(
    public id: string,
    public parent: Shape | null = null
  ) {}

  abstract getType(): string;
  abstract clone(): Shape;
  abstract toSVG(): string;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract setAttribute(attr: string, value: string): void;
  abstract getAttribute(attr: string): string | undefined;
  abstract getAttributes(): Record<string, any>;

  isContainer(): boolean {
    return false;
  }
}
