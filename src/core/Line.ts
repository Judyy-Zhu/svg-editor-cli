import { Shape } from './Shape';

export class Line extends Shape {
  constructor(
    id: string,
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
    public stroke?: string,
    public strokeWidth?: number
  ) {
    super(id);
  }

  getType(): string {
    return 'line';
  }

  clone(): Shape {
    return new Line(this.id, this.x1, this.y1, this.x2, this.y2, this.stroke, this.strokeWidth);
  }

  toSVG(): string {
    let svg = `<line id="${this.id}" x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${this.y2}"`;
    if (this.stroke) svg += ` stroke="${this.stroke}"`;
    if (this.strokeWidth) svg += ` stroke-width="${this.strokeWidth}"`;
    svg += '/>';
    return svg;
  }

  move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'x1':
        this.x1 = parseFloat(value);
        break;
      case 'y1':
        this.y1 = parseFloat(value);
        break;
      case 'x2':
        this.x2 = parseFloat(value);
        break;
      case 'y2':
        this.y2 = parseFloat(value);
        break;
      case 'stroke':
        this.stroke = value;
        break;
      case 'stroke-width':
        this.strokeWidth = parseFloat(value);
        break;
      default:
        throw new Error(`unknown attribute: ${attr}`);
    }
  }

  getAttribute(attr: string): string | undefined {
    switch (attr) {
      case 'x1': return this.x1.toString();
      case 'y1': return this.y1.toString();
      case 'x2': return this.x2.toString();
      case 'y2': return this.y2.toString();
      case 'stroke': return this.stroke;
      case 'stroke-width': return this.strokeWidth?.toString();
      default: return undefined;
    }
  }

  getAttributes(): Record<string, any> {
    return {
      x1: this.x1,
      y1: this.y1,
      x2: this.x2,
      y2: this.y2,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth
    };
  }
}
