import { Command } from './Command';
import { Document } from '../core/Document';
import { Group } from '../core/Group';

export class ZOrderCommand implements Command {
  private oldIndex: number = -1;
  private parent?: Group;

  constructor(
    private document: Document,
    private id: string,
    private toFront: boolean
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    if (!shape.parent || !shape.parent.isContainer()) {
      throw new Error(`shape has no parent container: ${this.id}`);
    }

    this.parent = shape.parent as Group;
    this.oldIndex = this.parent.children.indexOf(shape);

    // 移除并重新插入
    this.parent.removeChild(shape);
    if (this.toFront) {
      this.parent.children.push(shape);
      shape.parent = this.parent;
    } else {
      this.parent.children.unshift(shape);
      shape.parent = this.parent;
    }

    return `${shape.getType()}#${this.id} moved to ${this.toFront ? 'front' : 'back'}`;
  }

  undo(): string {
    const shape = this.document.getShape(this.id);
    if (!shape || !this.parent) {
      throw new Error('cannot undo: state not saved');
    }

    this.parent.removeChild(shape);
    this.parent.children.splice(this.oldIndex, 0, shape);
    shape.parent = this.parent;

    return `${shape.getType()}#${this.id} z-order restored`;
  }
}
