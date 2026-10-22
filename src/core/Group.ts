import { Shape } from './Shape';

export class Group extends Shape {
  public children: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  getType(): string {
    return 'g';
  }

  isContainer(): boolean {
    return true;
  }

  clone(): Shape {
    const group = new Group(this.id);
    group.children = this.children.map(child => child.clone());
    return group;
  }

  toSVG(): string {
    let svg = `<g id="${this.id}">`;
    for (const child of this.children) {
      svg += '\n  ' + child.toSVG().replace(/\n/g, '\n  ');
    }
    svg += '\n</g>';
    return svg;
  }

  move(dx: number, dy: number): void {
    for (const child of this.children) {
      child.move(dx, dy);
    }
  }

  scale(factor: number): void {
    for (const child of this.children) {
      child.scale(factor);
    }
  }

  setAttribute(attr: string, value: string): void {
    throw new Error(`cannot set attribute on group: ${attr}`);
  }

  getAttribute(attr: string): string | undefined {
    return undefined;
  }

  getAttributes(): Record<string, any> {
    return {};
  }

  addChild(shape: Shape): void {
    if (shape.parent) {
      const oldParent = shape.parent as Group;
      oldParent.removeChild(shape);
    }
    shape.parent = this;
    this.children.push(shape);
  }

  removeChild(shape: Shape): void {
    const index = this.children.indexOf(shape);
    if (index !== -1) {
      this.children.splice(index, 1);
      shape.parent = null;
    }
  }

  hasDescendant(shape: Shape): boolean {
    for (const child of this.children) {
      if (child === shape) return true;
      if (child.isContainer()) {
        if ((child as Group).hasDescendant(shape)) return true;
      }
    }
    return false;
  }
}
