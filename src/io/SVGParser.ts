import * as fs from 'fs';
import { parseString } from 'xml2js';
import { Document } from '../core/Document';
import { Rect } from '../core/Rect';
import { Circle } from '../core/Circle';
import { Ellipse } from '../core/Ellipse';
import { Line } from '../core/Line';
import { Text } from '../core/Text';
import { Group } from '../core/Group';
import { Shape } from '../core/Shape';

export class SVGParser {
  private warnings: string[] = [];
  private idCounter: Map<string, number> = new Map();

  parse(filePath: string): { document: Document, warnings: string[] } {
    this.warnings = [];
    this.idCounter.clear();

    const content = fs.readFileSync(filePath, 'utf-8');
    let document: Document | null = null;

    parseString(content, (err, result) => {
      if (err) {
        throw new Error(`cannot read file: ${filePath}`);
      }

      const svg = result.svg;
      const width = parseInt(svg.$.width || '800');
      const height = parseInt(svg.$.height || '600');

      document = new Document(width, height);
      document.filePath = filePath;

      // 解析所有子元素
      for (const key in svg) {
        if (key !== '$' && key !== 'xmlns') {
          const elements = svg[key];
          if (Array.isArray(elements)) {
            for (const elem of elements) {
              const shape = this.parseElement(key, elem);
              if (shape) {
                document.addShape(shape);
              }
            }
          }
        }
      }
    });

    if (!document) {
      throw new Error(`cannot read file: ${filePath}`);
    }

    return { document, warnings: this.warnings };
  }

  private parseElement(tag: string, elem: any, parentGroup?: Group): Shape | null {
    const attrs = elem.$ || {};
    let id = attrs.id;

    // 自动生成ID
    if (!id) {
      id = this.generateId(tag);
      this.warnings.push(`assigned id ${id} to unnamed <${tag}>`);
    }

    try {
      switch (tag) {
        case 'rect': {
          return new Rect(
            id,
            parseFloat(attrs.x || '0'),
            parseFloat(attrs.y || '0'),
            parseFloat(attrs.width || '0'),
            parseFloat(attrs.height || '0'),
            attrs.fill,
            attrs.stroke,
            attrs['stroke-width'] ? parseFloat(attrs['stroke-width']) : undefined
          );
        }
        case 'circle': {
          return new Circle(
            id,
            parseFloat(attrs.cx || '0'),
            parseFloat(attrs.cy || '0'),
            parseFloat(attrs.r || '0'),
            attrs.fill,
            attrs.stroke,
            attrs['stroke-width'] ? parseFloat(attrs['stroke-width']) : undefined
          );
        }
        case 'ellipse': {
          return new Ellipse(
            id,
            parseFloat(attrs.cx || '0'),
            parseFloat(attrs.cy || '0'),
            parseFloat(attrs.rx || '0'),
            parseFloat(attrs.ry || '0'),
            attrs.fill,
            attrs.stroke,
            attrs['stroke-width'] ? parseFloat(attrs['stroke-width']) : undefined
          );
        }
        case 'line': {
          return new Line(
            id,
            parseFloat(attrs.x1 || '0'),
            parseFloat(attrs.y1 || '0'),
            parseFloat(attrs.x2 || '0'),
            parseFloat(attrs.y2 || '0'),
            attrs.stroke,
            attrs['stroke-width'] ? parseFloat(attrs['stroke-width']) : undefined
          );
        }
        case 'text': {
          const content = elem._ || '';
          return new Text(
            id,
            parseFloat(attrs.x || '0'),
            parseFloat(attrs.y || '0'),
            content,
            attrs.fill,
            attrs.stroke,
            attrs['stroke-width'] ? parseFloat(attrs['stroke-width']) : undefined
          );
        }
        case 'g': {
          const group = new Group(id);

          // 递归解析子元素
          for (const childTag in elem) {
            if (childTag !== '$' && childTag !== '_') {
              const children = elem[childTag];
              if (Array.isArray(children)) {
                for (const child of children) {
                  const childShape = this.parseElement(childTag, child, group);
                  if (childShape) {
                    group.addChild(childShape);
                  }
                }
              }
            }
          }

          return group;
        }
        default:
          return null;
      }
    } catch (error) {
      this.warnings.push(`failed to parse <${tag}> with id ${id}: ${error}`);
      return null;
    }
  }

  private generateId(tag: string): string {
    const count = (this.idCounter.get(tag) || 0) + 1;
    this.idCounter.set(tag, count);
    return `${tag}${count}`;
  }
}
