import { Shape } from './Shape';

export class Ellipse extends Shape {
  constructor(
    id: string,
    public cx: number,
    public cy: number,
    public rx: number,
    public ry: number,
    public fill?: string,
    public stroke?: string,
    public strokeWidth?: number
  ) {
    super(id);
  }

  getType(): string {
    return 'ellipse';
  }

  clone(): Shape {
    return new Ellipse(this.id, this.cx, this.cy, this.rx, this.ry, this.fill, this.stroke, this.strokeWidth);
  }

  toSVG(): string {
    let svg = `<ellipse id="${this.id}" cx="${this.cx}" cy="${this.cy}" rx="${this.rx}" ry="${this.ry}"`;
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
    this.rx *= factor;
    this.ry *= factor;
  }

  setAttribute(attr: string, value: string): void {
    switch (attr) {
      case 'cx':
        this.cx = parseFloat(value);
        break;
      case 'cy':
        this.cy = parseFloat(value);
        break;
      case 'rx':
        this.rx = parseFloat(value);
        break;
      case 'ry':
        this.ry = parseFloat(value);
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
      case 'rx': return this.rx.toString();
      case 'ry': return this.ry.toString();
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
      rx: this.rx,
      ry: this.ry,
      fill: this.fill,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth
    };
  }
}
