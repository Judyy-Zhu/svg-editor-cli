import { Command } from './Command';
import { Document } from '../core/Document';

export class SetCommand implements Command {
  private oldValue?: string;

  constructor(
    private document: Document,
    private id: string,
    private attr: string,
    private value: string
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    this.oldValue = shape.getAttribute(this.attr);
    shape.setAttribute(this.attr, this.value);
    return `${shape.getType()}#${this.id} updated: ${this.attr}="${this.value}"`;
  }

  undo(): string {
    const shape = this.document.getShape(this.id);
    if (!shape) {
      throw new Error(`no such shape: ${this.id}`);
    }

    if (this.oldValue !== undefined) {
      shape.setAttribute(this.attr, this.oldValue);
      return `${shape.getType()}#${this.id} updated: ${this.attr}="${this.oldValue}"`;
    } else {
      return `${shape.getType()}#${this.id} ${this.attr} unchanged`;
    }
  }
}
