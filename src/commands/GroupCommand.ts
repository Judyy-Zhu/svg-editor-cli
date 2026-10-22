import { Command } from './Command';
import { Document } from '../core/Document';
import { Group } from '../core/Group';

export class GroupCommand implements Command {
  private newGroup?: Group;
  private originalParents: Map<string, { parent: Group | null, index: number }> = new Map();

  constructor(
    private document: Document,
    private newGid: string,
    private childIds: string[]
  ) {}

  execute(): string {
    if (this.document.hasShape(this.newGid)) {
      throw new Error(`id already exists: ${this.newGid}`);
    }

    // 检查所有子图形是否存在
    const children = this.childIds.map(id => {
      const shape = this.document.getShape(id);
      if (!shape) {
        throw new Error(`no such shape: ${id}`);
      }
      return shape;
    });

    // 检查是否有容器包含关系冲突
    for (let i = 0; i < children.length; i++) {
      for (let j = 0; j < children.length; j++) {
        if (i !== j && children[i].isContainer()) {
          const container = children[i] as Group;
          if (container.hasDescendant(children[j])) {
            throw new Error(`cannot group a container into its own descendant: ${children[i].id}`);
          }
        }
      }
    }

    // 保存原父容器信息
    for (const child of children) {
      if (child.parent && child.parent.isContainer()) {
        const parent = child.parent as Group;
        const index = parent.children.indexOf(child);
        this.originalParents.set(child.id, { parent, index });
      } else {
        this.originalParents.set(child.id, { parent: null, index: -1 });
      }
    }

    // 创建新组
    this.newGroup = new Group(this.newGid);
    this.document.addShape(this.newGroup);

    // 移动子图形到新组
    for (const child of children) {
      if (child.parent && child.parent.isContainer()) {
        (child.parent as Group).removeChild(child);
      }
      this.newGroup.addChild(child);
    }

    return `g#${this.newGid} created with ${this.childIds.length} children`;
  }

  undo(): string {
    if (!this.newGroup) {
      throw new Error('cannot undo: group not created');
    }

    // 恢复子图形到原父容器
    for (const child of this.newGroup.children.slice()) {
      this.newGroup.removeChild(child);

      const info = this.originalParents.get(child.id);
      if (info && info.parent) {
        info.parent.children.splice(info.index, 0, child);
        child.parent = info.parent;
      } else {
        // 恢复到根
        this.document.getRoot().addChild(child);
      }
    }

    // 删除组
    this.document.removeShape(this.newGid);
    return `g#${this.newGid} ungrouped`;
  }
}
