import { Command } from './Command';
import { Document } from '../core/Document';

export class ScaleCommand implements Command {
  constructor(
    private document: Document,
    private id: string,
    private factor: number
  ) {}

  execute(): string {
    if (this.factor <= 0) {
      throw new Error('scale factor must be positive');
    }

    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    shape.scale(this.factor);
    return `${shape.getType()}#${this.id} scaled by ${this.factor}`;
  }

  undo(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    shape.scale(1 / this.factor);
    return `${shape.getType()}#${this.id} scaled back by ${1 / this.factor}`;
  }
}
