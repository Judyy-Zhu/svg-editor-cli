import { Command } from './Command';
import { Document } from '../core/Document';
import { Group } from '../core/Group';

export class UngroupCommand implements Command {
  private group?: Group;
  private parent?: Group;
  private index: number = -1;
  private children: Array<{ shape: any, index: number }> = [];

  constructor(
    private document: Document,
    private gid: string
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.gid);
    if (!shape) {
      throw new Error(`no such shape: ${this.gid}`);
    }

    if (!shape.isContainer()) {
      throw new Error(`not a container: ${this.gid}`);
    }

    this.group = shape as Group;

    // 检查是否是根级容器
    if (this.group.parent === null || this.group.parent.id === 'svg') {
      throw new Error(`cannot ungroup top-level container: ${this.gid}`);
    }

    // 保存父容器信息
    if (this.group.parent.isContainer()) {
      this.parent = this.group.parent as Group;
      this.index = this.parent.children.indexOf(this.group);
    }

    // 保存子元素信息
    this.children = this.group.children.map((child, index) => ({ shape: child, index }));

    // 将子元素提升到父级
    const targetParent = this.parent || this.document.getRoot();
    for (const child of this.group.children.slice()) {
      this.group.removeChild(child);
      targetParent.children.splice(this.index + 1, 0, child);
      child.parent = targetParent;
    }

    // 删除组
    this.document.removeShape(this.gid);
    return `g#${this.gid} ungrouped, ${this.children.length} children promoted`;
  }

  undo(): string {
    if (!this.group || !this.parent) {
      throw new Error('cannot undo: group not saved');
    }

    // 重新创建组
    this.document.getAllShapes().set(this.gid, this.group);
    this.parent.children.splice(this.index, 0, this.group);
    this.group.parent = this.parent;

    // 将子元素放回组内
    for (const { shape } of this.children) {
      this.parent.removeChild(shape);
      this.group.addChild(shape);
    }

    return `g#${this.gid} regrouped`;
  }
}
