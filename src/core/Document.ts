import { Shape } from './Shape';
import { Group } from './Group';

export class Document {
  private root: Group;
  private shapes: Map<string, Shape> = new Map();
  public width: number;
  public height: number;
  public filePath?: string;

  constructor(width: number = 800, height: number = 600) {
    this.width = width;
    this.height = height;
    this.root = new Group('svg');
    this.shapes.set('svg', this.root);
  }

  getRoot(): Group {
    return this.root;
  }

  addShape(shape: Shape, containerId?: string): void {
    if (this.shapes.has(shape.id)) {
      throw new Error(`id already exists: ${shape.id}`);
    }

    if (containerId) {
      const container = this.shapes.get(containerId);
      if (!container) {
        throw new Error(`no such container: ${containerId}`);
      }
      if (!container.isContainer()) {
        throw new Error(`not a container: ${containerId}`);
      }
      (container as Group).addChild(shape);
    } else {
      this.root.addChild(shape);
    }

    this.shapes.set(shape.id, shape);
  }

  removeShape(id: string): Shape {
    const shape = this.shapes.get(id);
    if (!shape) {
      throw new Error(`no such shape: ${id}`);
    }

    if (shape === this.root) {
      throw new Error('cannot remove root');
    }

    // 移除所有子孙
    if (shape.isContainer()) {
      this.removeDescendants(shape as Group);
    }

    // 从父容器中移除
    if (shape.parent && shape.parent.isContainer()) {
      (shape.parent as Group).removeChild(shape);
    }

    this.shapes.delete(id);
    return shape;
  }

  private removeDescendants(group: Group): void {
    for (const child of group.children) {
      if (child.isContainer()) {
        this.removeDescendants(child as Group);
      }
      this.shapes.delete(child.id);
    }
  }

  getShape(id: string): Shape | undefined {
    return this.shapes.get(id);
  }

  hasShape(id: string): boolean {
    return this.shapes.has(id);
  }

  getAllShapes(): Map<string, Shape> {
    return this.shapes;
  }

  countElements(): number {
    return this.shapes.size - 1; // 减去root
  }

  clear(): void {
    this.shapes.clear();
    this.root = new Group('svg');
    this.shapes.set('svg', this.root);
  }
}
