import { Command } from './Command';
import { Document } from '../core/Document';

export class MoveCommand implements Command {
  constructor(
    private document: Document,
    private id: string,
    private dx: number,
    private dy: number
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    shape.move(this.dx, this.dy);
    return `${shape.getType()}#${this.id} moved by (${this.dx},${this.dy})`;
  }

  undo(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    shape.move(-this.dx, -this.dy);
    return `${shape.getType()}#${this.id} moved back by (${-this.dx},${-this.dy})`;
  }
}
