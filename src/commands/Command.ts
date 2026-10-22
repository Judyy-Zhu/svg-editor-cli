import { Document } from '../core/Document';

// Command接口
export interface Command {
  execute(): string;
  undo(): string;
}
