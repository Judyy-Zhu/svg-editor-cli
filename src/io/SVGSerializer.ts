import * as fs from 'fs';
import { Document } from '../core/Document';

export class SVGSerializer {
  serialize(document: Document): string {
    let svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">`;

    const root = document.getRoot();
    for (const child of root.children) {
      svg += '\n  ' + this.serializeShape(child, 1);
    }

    svg += '\n</svg>';
    return svg;
  }

  private serializeShape(shape: any, indent: number): string {
    const svg = shape.toSVG();
    const indentStr = '  '.repeat(indent);

    if (svg.includes('\n')) {
      return svg.split('\n').map((line: string, i: number) =>
        i === 0 ? line : indentStr + line
      ).join('\n');
    }

    return svg;
  }

  saveToFile(document: Document, filePath: string): void {
    const content = this.serialize(document);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}
