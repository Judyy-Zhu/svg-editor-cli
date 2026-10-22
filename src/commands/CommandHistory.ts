import { Command } from './Command';

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private enabled: boolean = true;

  execute(command: Command): string {
    const result = command.execute();

    if (this.enabled) {
      this.undoStack.push(command);
      this.redoStack = []; // 清空redo栈
    }

    return result;
  }

  undo(): string {
    if (!this.enabled) {
      throw new Error('undo not allowed after io command');
    }

    if (this.undoStack.length === 0) {
      throw new Error('nothing to undo');
    }

    const command = this.undoStack.pop()!;
    const result = command.undo();
    this.redoStack.push(command);
    return result;
  }

  redo(): string {
    if (!this.enabled) {
      throw new Error('redo not allowed after io command');
    }

    if (this.redoStack.length === 0) {
      throw new Error('nothing to redo');
    }

    const command = this.redoStack.pop()!;
    const result = command.execute();
    this.undoStack.push(command);
    return result;
  }

  disable(): void {
    this.enabled = false;
    this.undoStack = [];
    this.redoStack = [];
  }

  enable(): void {
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
