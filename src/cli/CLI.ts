import * as readline from 'readline';
import { Document } from '../core/Document';
import { CommandHistory } from '../commands/CommandHistory';
import { CommandParser } from './CommandParser';
import { CreateCommand } from '../commands/CreateCommand';
import { DeleteCommand } from '../commands/DeleteCommand';
import { MoveCommand } from '../commands/MoveCommand';
import { ScaleCommand } from '../commands/ScaleCommand';
import { SetCommand } from '../commands/SetCommand';
import { GroupCommand } from '../commands/GroupCommand';
import { UngroupCommand } from '../commands/UngroupCommand';
import { AddToCommand } from '../commands/AddToCommand';
import { ZOrderCommand } from '../commands/ZOrderCommand';
import { SVGParser } from '../io/SVGParser';
import { SVGSerializer } from '../io/SVGSerializer';
import { Group } from '../core/Group';
import { Shape } from '../core/Shape';

export class CLI {
  private document?: Document;
  private history: CommandHistory = new CommandHistory();
  private parser: CommandParser = new CommandParser();
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'svg> '
    });
  }

  start(): void {
    console.log('svg-editor 0.1 — type \'help\' for commands\n');
    this.rl.prompt();

    this.rl.on('line', (input: string) => {
      try {
        const { command, args } = this.parser.parse(input);

        if (command) {
          const result = this.executeCommand(command, args);
          if (result) {
            console.log(result);
          }
        }
      } catch (error: any) {
        console.log(`error: ${error.message}`);
      }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });
  }

  private executeCommand(command: string, args: string[]): string {
    switch (command) {
      case 'init':
        return this.handleInit(args);
      case 'read':
        return this.handleRead(args);
      case 'save':
        return this.handleSave(args);
      case 'canvas':
        return this.handleCanvas(args);
      case 'create':
        return this.handleCreate(args);
      case 'delete':
        return this.handleDelete(args);
      case 'move':
        return this.handleMove(args);
      case 'scale':
        return this.handleScale(args);
      case 'set':
        return this.handleSet(args);
      case 'group':
        return this.handleGroup(args);
      case 'ungroup':
        return this.handleUngroup(args);
      case 'addto':
        return this.handleAddTo(args);
      case 'front':
        return this.handleFront(args);
      case 'back':
        return this.handleBack(args);
      case 'tree':
        return this.handleTree(args);
      case 'show':
        return this.handleShow(args);
      case 'undo':
        return this.handleUndo();
      case 'redo':
        return this.handleRedo();
      case 'help':
        return this.handleHelp();
      default:
        throw new Error(`unknown command: ${command}`);
    }
  }

  private checkDocument(): void {
    if (!this.document) {
      throw new Error("no document. use 'init' or 'read' first");
    }
  }

  private handleInit(args: string[]): string {
    const width = args[0] ? this.parser.parseNumber(args[0]) : 800;
    const height = args[1] ? this.parser.parseNumber(args[1]) : 600;

    this.document = new Document(width, height);
    this.history.disable();
    return `canvas ${width}x${height} created`;
  }

  private handleRead(args: string[]): string {
    if (args.length === 0) {
      throw new Error('missing file path');
    }

    const parser = new SVGParser();
    const { document, warnings } = parser.parse(args[0]);

    this.document = document;
    this.history.disable();

    let result = `read ${args[0]} (${document.countElements()} elements)`;
    if (warnings.length > 0) {
      result = warnings.map(w => `warning: ${w}`).join('\n') + '\n' + result;
    }

    return result;
  }

  private handleSave(args: string[]): string {
    this.checkDocument();

    let filePath = args[0];
    if (!filePath) {
      if (!this.document!.filePath) {
        throw new Error('no file path specified');
      }
      filePath = this.document!.filePath;
    }

    const serializer = new SVGSerializer();
    serializer.saveToFile(this.document!, filePath);
    this.document!.filePath = filePath;

    this.history.disable();
    return `saved to ${filePath} (${this.document!.countElements()} elements)`;
  }

  private handleCanvas(args: string[]): string {
    this.checkDocument();

    if (args.length === 0) {
      return `canvas ${this.document!.width}x${this.document!.height}`;
    }

    const width = this.parser.parseNumber(args[0]);
    const height = this.parser.parseNumber(args[1]);

    this.document!.width = width;
    this.document!.height = height;
    this.history.disable();

    return `canvas resized to ${width}x${height}`;
  }

  private handleCreate(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 2) {
      throw new Error('usage: create <type> <id> [params...] [in <containerId>]');
    }

    const type = args[0];
    const id = args[1];

    // 查找 "in" 子句
    let containerId: string | undefined;
    let inIndex = args.indexOf('in');
    let params = args.slice(2);

    if (inIndex !== -1) {
      containerId = args[inIndex + 1];
      params = args.slice(2, inIndex);
    }

    // 解析参数
    const parsedParams = params.map(p => {
      const num = parseFloat(p);
      return isNaN(num) ? p : num;
    });

    const command = new CreateCommand(this.document!, type, id, parsedParams, containerId);
    return this.history.execute(command);
  }

  private handleDelete(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length === 0) {
      throw new Error('missing shape id');
    }

    const command = new DeleteCommand(this.document!, args[0]);
    return this.history.execute(command);
  }

  private handleMove(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 3) {
      throw new Error('usage: move <id> <dx> <dy>');
    }

    const command = new MoveCommand(
      this.document!,
      args[0],
      this.parser.parseNumber(args[1]),
      this.parser.parseNumber(args[2])
    );
    return this.history.execute(command);
  }

  private handleScale(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 2) {
      throw new Error('usage: scale <id> <factor>');
    }

    const command = new ScaleCommand(
      this.document!,
      args[0],
      this.parser.parseNumber(args[1])
    );
    return this.history.execute(command);
  }

  private handleSet(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 3) {
      throw new Error('usage: set <id> <attr> <value>');
    }

    const command = new SetCommand(this.document!, args[0], args[1], args[2]);
    return this.history.execute(command);
  }

  private handleGroup(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 2) {
      throw new Error('usage: group <newGid> <id1> <id2>...');
    }

    const command = new GroupCommand(this.document!, args[0], args.slice(1));
    return this.history.execute(command);
  }

  private handleUngroup(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length === 0) {
      throw new Error('missing group id');
    }

    const command = new UngroupCommand(this.document!, args[0]);
    return this.history.execute(command);
  }

  private handleAddTo(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length < 2) {
      throw new Error('usage: addto <gid> <id>');
    }

    const command = new AddToCommand(this.document!, args[0], args[1]);
    return this.history.execute(command);
  }

  private handleFront(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length === 0) {
      throw new Error('missing shape id');
    }

    const command = new ZOrderCommand(this.document!, args[0], true);
    return this.history.execute(command);
  }

  private handleBack(args: string[]): string {
    this.checkDocument();
    this.history.enable();

    if (args.length === 0) {
      throw new Error('missing shape id');
    }

    const command = new ZOrderCommand(this.document!, args[0], false);
    return this.history.execute(command);
  }

  private handleTree(args: string[]): string {
    this.checkDocument();

    const rootId = args[0];
    let root: Shape;

    if (rootId) {
      const shape = this.document!.getShape(rootId);
      if (!shape) {
        throw new Error(`no such shape: ${rootId}`);
      }
      root = shape;
    } else {
      root = this.document!.getRoot();
    }

    return this.renderTree(root, 0, true);
  }

  private renderTree(shape: Shape, depth: number, isRoot: boolean): string {
    const indent = '│   '.repeat(Math.max(0, depth - 1)) + (depth > 0 ? '├── ' : '');

    let line = '';
    if (isRoot && shape.id === 'svg') {
      line = `svg (${this.document!.width}x${this.document!.height})`;
    } else {
      line = indent + this.formatShapeInfo(shape);
    }

    if (shape.isContainer()) {
      const group = shape as Group;
      const children = group.children.map(child =>
        this.renderTree(child, depth + 1, false)
      ).join('\n');

      return children ? line + '\n' + children : line;
    }

    return line;
  }

  private formatShapeInfo(shape: Shape): string {
    const type = shape.getType();
    const attrs = shape.getAttributes();

    let info = `${type}#${shape.id}`;

    // 添加关键几何信息
    switch (type) {
      case 'rect':
        info += `  x=${attrs.x} y=${attrs.y} w=${attrs.width} h=${attrs.height}`;
        if (attrs.fill) info += ` fill=${attrs.fill}`;
        break;
      case 'circle':
        info += `  cx=${attrs.cx} cy=${attrs.cy} r=${attrs.r}`;
        if (attrs.fill) info += ` fill=${attrs.fill}`;
        break;
      case 'ellipse':
        info += `  cx=${attrs.cx} cy=${attrs.cy} rx=${attrs.rx} ry=${attrs.ry}`;
        if (attrs.fill) info += ` fill=${attrs.fill}`;
        break;
      case 'line':
        info += `  (${attrs.x1},${attrs.y1}) -> (${attrs.x2},${attrs.y2})`;
        if (attrs.stroke) info += ` stroke=${attrs.stroke}`;
        break;
      case 'text':
        info += `  (${attrs.x},${attrs.y}) "${attrs.text}"`;
        break;
      case 'g':
        // 容器不额外显示
        break;
    }

    return info;
  }

  private handleShow(args: string[]): string {
    this.checkDocument();

    if (args.length === 0) {
      throw new Error('missing shape id');
    }

    const shape = this.document!.getShape(args[0]);
    if (!shape) {
      throw new Error(`no such shape: ${args[0]}`);
    }

    const attrs = shape.getAttributes();
    const parentInfo = shape.parent ? ` parent=${shape.parent.getType()}#${shape.parent.id}` : '';

    let result = `${shape.getType()}#${shape.id}${parentInfo}\n`;

    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) {
        result += `  ${key}=${value}\n`;
      }
    }

    return result.trim();
  }

  private handleUndo(): string {
    this.checkDocument();
    return this.history.undo();
  }

  private handleRedo(): string {
    this.checkDocument();
    return this.history.redo();
  }

  private handleHelp(): string {
    return `
SVG Editor Commands:

Document:
  init [w] [h]              - Create new canvas (default 800x600)
  read <file.svg>           - Load SVG file
  save [file.svg]           - Save to file
  canvas [w] [h]            - Show/set canvas size

Create & Edit:
  create <type> <id> [params...] [in <containerId>]
                            - Create shape (rect/circle/ellipse/line/text/g)
  delete <id>               - Delete shape
  move <id> <dx> <dy>       - Move shape
  scale <id> <factor>       - Scale shape
  set <id> <attr> <value>   - Set attribute

Structure:
  group <newGid> <id1> <id2>... - Group shapes
  ungroup <gid>             - Ungroup
  addto <gid> <id>          - Add shape to group
  front <id>                - Move to front
  back <id>                 - Move to back

Display:
  tree [id]                 - Show structure tree
  show <id>                 - Show shape details

Undo/Redo:
  undo                      - Undo last command
  redo                      - Redo last undone command
  help                      - Show this help
    `.trim();
  }
}
