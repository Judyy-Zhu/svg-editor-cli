import { Command } from './Command';
import { Document } from '../core/Document';
import { Shape } from '../core/Shape';
import { Group } from '../core/Group';

export class DeleteCommand implements Command {
  private shape?: Shape;
  private parent?: Group;
  private index: number = -1;

  constructor(
    private document: Document,
    private id: string
  ) {}

  execute(): string {
    this.shape = this.document.getShape(this.id);
    if (!this.shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    // 保存父容器和位置信息
    if (this.shape.parent && this.shape.parent.isContainer()) {
      this.parent = this.shape.parent as Group;
      this.index = this.parent.children.indexOf(this.shape);
    }

    this.document.removeShape(this.id);
    return `${this.shape.getType()}#${this.id} deleted`;
  }

  undo(): string {
    if (!this.shape) {
      throw new Error('cannot undo: shape not saved');
    }

    // 恢复到原位置
    if (this.parent) {
      this.parent.children.splice(this.index, 0, this.shape);
      this.shape.parent = this.parent;
      this.document.getAllShapes().set(this.id, this.shape);

      // 如果是容器，恢复所有子孙
      if (this.shape.isContainer()) {
        this.restoreDescendants(this.shape as Group);
      }
    }

    return `${this.shape.getType()}#${this.id} restored` +
           (this.parent ? ` into ${this.parent.getType()}#${this.parent.id}` : '');
  }

  private restoreDescendants(group: Group): void {
    for (const child of group.children) {
      this.document.getAllShapes().set(child.id, child);
      if (child.isContainer()) {
        this.restoreDescendants(child as Group);
      }
    }
  }
}
