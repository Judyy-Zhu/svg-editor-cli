import { Command } from './Command';
import { Document } from '../core/Document';
import { Group } from '../core/Group';

export class AddToCommand implements Command {
  private oldParent?: Group;
  private oldIndex: number = -1;

  constructor(
    private document: Document,
    private gid: string,
    private shapeId: string
  ) {}

  execute(): string {
    const container = this.document.getShape(this.gid);
    if (!container) {
      throw new Error(`no such shape: ${this.gid}`);
    }
    if (!container.isContainer()) {
      throw new Error(`not a container: ${this.gid}`);
    }

    const shape = this.document.getShape(this.shapeId);
    if (!shape) {
      throw new Error(`no such shape: ${this.shapeId}`);
    }

    // 保存原父容器信息
    if (shape.parent && shape.parent.isContainer()) {
      this.oldParent = shape.parent as Group;
      this.oldIndex = this.oldParent.children.indexOf(shape);
    }

    // 移动到新容器
    (container as Group).addChild(shape);
    return `${shape.getType()}#${this.shapeId} added to g#${this.gid}`;
  }

  undo(): string {
    const shape = this.document.getShape(this.shapeId);
    if (!shape) {
      throw new Error(`no such shape: ${this.shapeId}`);
    }

    // 从当前容器移除
    if (shape.parent && shape.parent.isContainer()) {
      (shape.parent as Group).removeChild(shape);
    }

    // 恢复到原容器
    if (this.oldParent) {
      this.oldParent.children.splice(this.oldIndex, 0, shape);
      shape.parent = this.oldParent;
      return `${shape.getType()}#${this.shapeId} moved back to ${this.oldParent.getType()}#${this.oldParent.id}`;
    } else {
      this.document.getRoot().addChild(shape);
      return `${shape.getType()}#${this.shapeId} moved back to root`;
    }
  }
}
