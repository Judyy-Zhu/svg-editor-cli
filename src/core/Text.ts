import { Shape } from './Shape';

export class Text extends Shape {
  constructor(
    id: string,
    public x: number,
    public y: number,
    public content: string,
    public fill?: string,
    public stroke?: string,
    public strokeWidth?: number
  ) {
    super(id);
  }

  getType(): string {
    return 'text';
  }

  clone(): Shape {
    return new Text(this.id, this.x, this.y, this.content, this.fill, this.stroke, this.strokeWidth);
  }

  toSVG(): string {
    let svg = `<text id="${this.id}" x="${this.x}" y="${this.y}"`;
    if (this.fill) svg += ` fill="${this.fill}"`;
    if (this.stroke) svg += ` stroke="${this.stroke}"`;
    if (this.strokeWidth) svg += ` stroke-width="${this.strokeWidth}"`;
    svg += `>${this.content}</text>`;
    return svg;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'x':
        this.x = parseFloat(value);
        break;
      case 'y':
        this.y = parseFloat(value);
        break;
      case 'text':
        this.content = value;
        break;
      case 'fill':
        this.fill = value;
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
      case 'x': return this.x.toString();
      case 'y': return this.y.toString();
      case 'text': return this.content;
      case 'fill': return this.fill;
      case 'stroke': return this.stroke;
      case 'stroke-width': return this.strokeWidth?.toString();
      default: return undefined;
    }
  }

  getAttributes(): Record<string, any> {
    return {
      x: this.x,
      y: this.y,
      text: this.content,
      fill: this.fill,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth
    };
  }
}
