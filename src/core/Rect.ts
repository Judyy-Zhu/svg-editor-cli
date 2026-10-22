import { Shape } from './Shape';

export class Rect extends Shape {
  constructor(
    id: string,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public fill?: string,
    public stroke?: string,
    public strokeWidth?: number
  ) {
    super(id);
  }

  getType(): string {
    return 'rect';
  }

  clone(): Shape {
    return new Rect(this.id, this.x, this.y, this.width, this.height, this.fill, this.stroke, this.strokeWidth);
  }

  toSVG(): string {
    let svg = `<rect id="${this.id}" x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}"`;
    if (this.fill) svg += ` fill="${this.fill}"`;
    if (this.stroke) svg += ` stroke="${this.stroke}"`;
    if (this.strokeWidth) svg += ` stroke-width="${this.strokeWidth}"`;
    svg += '/>';
    return svg;
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'x':
        this.x = parseFloat(value);
        break;
      case 'y':
        this.y = parseFloat(value);
        break;
      case 'width':
        this.width = parseFloat(value);
        break;
      case 'height':
        this.height = parseFloat(value);
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
      case 'width': return this.width.toString();
      case 'height': return this.height.toString();
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
      width: this.width,
      height: this.height,
      fill: this.fill,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth
    };
  }
}
