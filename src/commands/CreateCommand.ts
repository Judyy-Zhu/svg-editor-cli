import { Command } from './Command';
import { Document } from '../core/Document';
import { Shape } from '../core/Shape';
import { Rect } from '../core/Rect';
import { Circle } from '../core/Circle';
import { Ellipse } from '../core/Ellipse';
import { Line } from '../core/Line';
import { Text } from '../core/Text';
import { Group } from '../core/Group';

export class CreateCommand implements Command {
  private shape?: Shape;

  constructor(
    private document: Document,
    private type: string,
    private id: string,
    private params: any[],
    private containerId?: string
  ) {}

  execute(): string {
    this.shape = this.createShape();
    this.document.addShape(this.shape, this.containerId);

    const containerInfo = this.containerId ? ` in ${this.type}#${this.containerId}` : '';
    return `${this.type}#${this.id} created${containerInfo}`;
  }

  undo(): string {
    this.document.removeShape(this.id);
    return `${this.type}#${this.id} removed`;
  }

  private createShape(): Shape {
    switch (this.type) {
      case 'rect': {
        const [x, y, w, h, fill] = this.params;
        return new Rect(this.id, x, y, w, h, fill);
      }
      case 'circle': {
        const [cx, cy, r, fill] = this.params;
        return new Circle(this.id, cx, cy, r, fill);
      }
      case 'ellipse': {
        const [cx, cy, rx, ry, fill] = this.params;
        return new Ellipse(this.id, cx, cy, rx, ry, fill);
      }
      case 'line': {
        const [x1, y1, x2, y2, stroke] = this.params;
        return new Line(this.id, x1, y1, x2, y2, stroke);
      }
      case 'text': {
        const [x, y, content] = this.params;
        return new Text(this.id, x, y, content);
      }
      case 'g': {
        return new Group(this.id);
      }
      default:
        throw new Error(`unknown shape type: ${this.type} (is the plugin loaded?)`);
    }
  }
}
