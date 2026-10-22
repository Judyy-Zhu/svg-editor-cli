import { Shape } from './Shape';

export class Circle extends Shape {
  constructor(
    id: string,
    public cx: number,
    public cy: number,
    public r: number,
    public fill?: string,
    public stroke?: string,
    public strokeWidth?: number
  ) {
    super(id);
  }

  getType(): string {
    return 'circle';
  }

  clone(): Shape {
    return new Circle(this.id, this.cx, this.cy, this.r, this.fill, this.stroke, this.strokeWidth);
  }

  toSVG(): string {
    let svg = `<circle id="${this.id}" cx="${this.cx}" cy="${this.cy}" r="${this.r}"`;
    if (this.fill) svg += ` fill="${this.fill}"`;
    if (this.stroke) svg += ` stroke="${this.stroke}"`;
    if (this.strokeWidth) svg += ` stroke-width="${this.strokeWidth}"`;
    svg += '/>';
    return svg;
  }

  move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.r *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'cx':
        this.cx = parseFloat(value);
        break;
      case 'cy':
        this.cy = parseFloat(value);
        break;
      case 'r':
        this.r = parseFloat(value);
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
      case 'cx': return this.cx.toString();
      case 'cy': return this.cy.toString();
      case 'r': return this.r.toString();
      case 'fill': return this.fill;
      case 'stroke': return this.stroke;
      case 'stroke-width': return this.strokeWidth?.toString();
      default: return undefined;
    }
  }

  getAttributes(): Record<string, any> {
    return {
      cx: this.cx,
      cy: this.cy,
      r: this.r,
      fill: this.fill,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth
    };
  }
}
