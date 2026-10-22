# SVG 编辑器 - 架构文档

## 1. 架构方案

### 1.1 模块划分

本项目采用分层架构，将代码划分为以下四个核心模块：

```
src/
├── core/           # 核心领域模型层
├── commands/       # 命令层
├── io/            # IO层
└── cli/           # CLI交互层
```

#### 模块职责说明：

| 模块 | 职责 | 关键类 |
|------|------|--------|
| **core** | 定义SVG图形的领域模型，封装图形的几何属性和操作 | Shape(抽象基类), Rect, Circle, Ellipse, Line, Text, Group, Document |
| **commands** | 实现Command模式，封装所有可撤销的编辑操作 | Command(接口), CreateCommand, DeleteCommand, MoveCommand, ScaleCommand, SetCommand, GroupCommand等, CommandHistory |
| **io** | 处理SVG文件的读取和保存 | SVGParser, SVGSerializer |
| **cli** | 提供命令行交互界面，解析用户输入并调用相应命令 | CLI, CommandParser |

#### 模块关系图：

```
┌─────────────────────────────────────┐
│           CLI Layer                 │
│  (CLI, CommandParser)               │
└───────────┬─────────────────────────┘
            │ 依赖
            ▼
┌─────────────────────────────────────┐
│        Commands Layer               │
│  (Command, XxxCommand,              │
│   CommandHistory)                   │
└───────────┬─────────────────────────┘
            │ 依赖
            ▼
┌─────────────────────────────────────┐
│         Core Layer                  │
│  (Shape, Document, Rect, Circle...) │
└─────────────────────────────────────┘
            ▲
            │ 依赖
┌───────────┴─────────────────────────┐
│          IO Layer                   │
│  (SVGParser, SVGSerializer)         │
└─────────────────────────────────────┘
```

### 1.2 设计模式的选择与实现

#### 1) Command模式（必需）

**目的**：将每个编辑操作封装为独立的命令对象，支持undo/redo功能。

**实现**：
- `Command`接口：定义`execute()`和`undo()`两个方法
- 具体命令类：`CreateCommand`, `DeleteCommand`, `MoveCommand`, `ScaleCommand`, `SetCommand`, `GroupCommand`, `UngroupCommand`, `AddToCommand`, `ZOrderCommand`
- `CommandHistory`：维护undo栈和redo栈，管理命令执行历史

**代码示例**：
```typescript
// commands/Command.ts
export interface Command {
  execute(): string;
  undo(): string;
}

// commands/MoveCommand.ts
export class MoveCommand implements Command {
  constructor(
    private document: Document,
    private id: string,
    private dx: number,
    private dy: number
  ) {}

  execute(): string {
    const shape = this.document.getShape(this.id);
    shape.move(this.dx, this.dy);
    return `${shape.getType()}#${this.id} moved by (${this.dx},${this.dy})`;
  }

  undo(): string {
    const shape = this.document.getShape(this.id);
    shape.move(-this.dx, -this.dy);
    return `${shape.getType()}#${this.id} moved back`;
  }
}
```

#### 2) Composite模式

**目的**：统一处理单个图形和图形容器，使得`move`/`scale`/`delete`等操作对叶子节点和组合节点一视同仁。

**实现**：
- `Shape`抽象基类：定义所有图形的通用接口
- 叶子类：`Rect`, `Circle`, `Ellipse`, `Line`, `Text`
- 组合类：`Group`（容器），包含`children: Shape[]`
- 所有操作方法（`move`, `scale`）在`Group`中递归调用子节点

**代码示例**：
```typescript
// core/Shape.ts
export abstract class Shape {
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  isContainer(): boolean { return false; }
}

// core/Group.ts
export class Group extends Shape {
  children: Shape[] = [];
  
  move(dx: number, dy: number): void {
    for (const child of this.children) {
      child.move(dx, dy);  // 递归调用
    }
  }
  
  isContainer(): boolean { return true; }
}
```

#### 3) Factory模式（简化版）

**目的**：根据类型名字符串创建对应的图形对象。

**实现**：在`CreateCommand`中使用switch语句根据类型创建图形实例。

**说明**：本阶段采用简单的switch分派，在架构方案中标注为待重构点（见1.4节）。

### 1.3 依赖方向规则

**规则**：
1. **CLI层 → Commands层 → Core层**：单向依赖，上层依赖下层
2. **IO层 → Core层**：IO层依赖Core层的领域模型
3. **禁止反向依赖**：Core层不得依赖Commands层或CLI层
4. **禁止跨层依赖**：CLI层不得直接操作Core层的图形对象（必须通过Commands层）

**理由**：
- 保持关注点分离：领域模型（Core）独立于操作方式（Commands）和交互方式（CLI）
- 便于测试：可以单独测试Core层的图形逻辑，无需启动CLI
- 便于扩展：未来可以添加GUI层，复用Commands和Core层

**违规检查**：
- ✅ CLI.ts import Command类：合法（上层→下层）
- ✅ CreateCommand.ts import Rect：合法（Commands→Core）
- ❌ Shape.ts import Command：违规（Core→Commands反向依赖）

### 1.4 变化点假设

| # | 变化点 | 应对策略 | 当前决策 |
|---|--------|----------|----------|
| 1 | **新增图形类型**（如polygon, path） | **留了扩展点**：抽象基类`Shape`定义接口，新类型继承即可；工厂方法在`CreateCommand`中添加case | 当前使用switch分派，标注为待重构（插件化阶段改为注册表） |
| 2 | **新增命令类型**（如旋转、复制） | **留了扩展点**：`Command`接口定义标准，新命令实现接口即可 | 已实现完整的Command模式 |
| 3 | **交互方式变化**（GUI、Web） | **留了隔离**：CLI层与Commands/Core分离，新UI可复用下层 | CLI层仅处理输入输出，核心逻辑在Commands层 |
| 4 | **文件格式变化**（支持SVG以外的格式） | **留了抽象**：IO层独立，可添加新的Parser/Serializer | 当前仅实现SVG，接口设计支持扩展 |
| 5 | **撤销/重做策略变化**（如快照式undo） | **未留**：当前memento模式与Command紧密耦合 | **决定不留**：Command模式足够高效，切换代价大于收益 |
| 6 | **ID生成策略**（如UUID） | **未留**：ID由用户显式提供 | **决定不留**：符合CLI设计哲学（显式优于隐式） |

## 2. 过程记录

### 2.1 关键设计讨论

#### 问题1：如何实现undo/redo？

**AI建议**：使用Command模式，每个命令保存执行前状态。

**我的思考**：
- Command模式是标准解法，符合要求
- 但需要注意：IO命令（read/save/init）执行后应禁用undo/redo，避免文档状态不一致

**最终方案**：
```typescript
// CommandHistory中添加enable/disable机制
class CommandHistory {
  private enabled: boolean = true;
  
  disable(): void {
    this.enabled = false;
    this.undoStack = [];
    this.redoStack = [];
  }
  
  enable(): void {
    this.enabled = true;
  }
}

// CLI层在IO命令后调用
handleSave(): string {
  // ... save logic ...
  this.history.disable();
  return result;
}
```

#### 问题2：Group容器的move操作如何实现？

**AI初始生成**：在Group中保存transform属性（类似SVG的transform属性）。

**我发现的问题**：
- 这种方式与SVG渲染一致，但不符合题目要求
- 题目明确要求："scale作用于容器时递归到每个子孙"，说明要直接修改子元素的几何属性

**纠正后的方案**：
```typescript
// Group的move递归修改所有子元素
move(dx: number, dy: number): void {
  for (const child of this.children) {
    child.move(dx, dy);  // 直接修改子元素坐标
  }
}
```

#### 问题3：如何处理缺失ID的SVG元素？

**题目要求**：自动分配ID并打印警告。

**实现难点**：需要保证生成的ID不与已有ID冲突。

**解决方案**：
```typescript
// SVGParser中维护计数器
private idCounter: Map<string, number> = new Map();

private generateId(tag: string): string {
  const count = (this.idCounter.get(tag) || 0) + 1;
  this.idCounter.set(tag, count);
  return `${tag}${count}`;  // 如 rect1, rect2...
}
```

### 2.2 代码生成与修正

#### 迭代1：类型错误修复

**AI生成代码**：SVGSerializer中使用隐式any类型。

**编译错误**：
```
error TS7006: Parameter 'line' implicitly has an 'any' type.
```

**修正**：添加显式类型注解：
```typescript
svg.split('\n').map((line: string, i: number) => ...)
```

#### 迭代2：ts-node兼容性问题

**问题**：ts-node在Node.js v25环境下报错。

**解决**：改用先编译后运行的方式：
```json
"scripts": {
  "build": "tsc",
  "cli": "node dist/main.js"
}
```

## 3. 一致性自查

### 3.1 模块划分一致性

| 方案中的模块 | 实际目录 | 状态 |
|-------------|---------|------|
| core | src/core/ | ✅ 一致 |
| commands | src/commands/ | ✅ 一致 |
| io | src/io/ | ✅ 一致 |
| cli | src/cli/ | ✅ 一致 |

**实际文件列表**：
```
src/core/: Shape.ts, Rect.ts, Circle.ts, Ellipse.ts, Line.ts, Text.ts, Group.ts, Document.ts
src/commands/: Command.ts, CreateCommand.ts, DeleteCommand.ts, MoveCommand.ts, ScaleCommand.ts, SetCommand.ts, GroupCommand.ts, UngroupCommand.ts, AddToCommand.ts, ZOrderCommand.ts, CommandHistory.ts
src/io/: SVGParser.ts, SVGSerializer.ts
src/cli/: CLI.ts, CommandParser.ts
```

**结论**：实际实现与方案完全一致。

### 3.2 依赖方向一致性

**抽样检查**：

1. **CLI.ts的import**：
```typescript
import { Document } from '../core/Document';           // ✅ CLI→Core
import { CommandHistory } from '../commands/CommandHistory'; // ✅ CLI→Commands
import { CreateCommand } from '../commands/CreateCommand';  // ✅ CLI→Commands
```

2. **CreateCommand.ts的import**：
```typescript
import { Command } from './Command';          // ✅ 同层
import { Document } from '../core/Document';  // ✅ Commands→Core
import { Rect } from '../core/Rect';         // ✅ Commands→Core
```

3. **Shape.ts的import**：
```typescript
// 无import语句
```
✅ Core层不依赖上层

4. **SVGParser.ts的import**：
```typescript
import { Document } from '../core/Document';  // ✅ IO→Core
import { Rect } from '../core/Rect';         // ✅ IO→Core
```

**结论**：依赖方向完全符合架构规则，无违规依赖。

## 4. 功能完整性和质量保证

### 4.1 功能完整性检查

按照`phase_cli_1.md`的命令总表逐一验证：

#### 文档类命令

| 命令 | 实现位置 | 测试结果 |
|------|---------|---------|
| init | CLI.handleInit() | ✅ 通过 |
| read | CLI.handleRead() + SVGParser | ✅ 通过（含缺失ID警告） |
| save | CLI.handleSave() + SVGSerializer | ✅ 通过 |
| canvas | CLI.handleCanvas() | ✅ 通过 |

#### 图形编辑类命令

| 命令 | 实现位置 | 测试结果 |
|------|---------|---------|
| create | CreateCommand | ✅ 通过（支持in子句） |
| delete | DeleteCommand | ✅ 通过 |
| move | MoveCommand | ✅ 通过 |
| scale | ScaleCommand | ✅ 通过 |
| set | SetCommand | ✅ 通过 |
| group | GroupCommand | ✅ 通过 |
| ungroup | UngroupCommand | ✅ 通过 |
| addto | AddToCommand | ✅ 通过 |
| front/back | ZOrderCommand | ✅ 通过 |

#### 显示类命令

| 命令 | 实现位置 | 测试结果 |
|------|---------|---------|
| tree | CLI.handleTree() | ✅ 通过（格式符合要求） |
| show | CLI.handleShow() | ✅ 通过 |
| help | CLI.handleHelp() | ✅ 通过 |

#### 撤销重做

| 命令 | 实现位置 | 测试结果 |
|------|---------|---------|
| undo | CommandHistory.undo() | ✅ 通过 |
| redo | CommandHistory.redo() | ✅ 通过（新编辑后清空redo栈） |

**结论**：所有必需功能均已实现且通过测试。

### 4.2 质量保证手段

#### 1) 测试脚本验证

创建了三个测试脚本覆盖关键场景：

**test_script.txt**：基础创建、分组、保存
```
init 400 200
create rect start 30 70 120 60 #4a90d9
create line edge 150 100 250 100 black
create rect end 250 70 120 60 #f5a623
group flow start edge end
save demo.svg
tree
```

**test_full.txt**：undo/redo功能
```
init 800 600
create rect bg 0 0 800 600 #ffffff
create text title 20 40 "My Diagram"
create circle c1 100 100 20 red
create rect box 200 80 60 60 #3366ff
group markers c1 box
move c1 30 0
undo
redo
set title text "My Diagram v2"
undo
delete box
undo
save test_output.svg
```

**test_read.txt**：读取SVG文件（含缺失ID）
```
read other.svg
tree
show c1
```

**测试结果**：所有脚本运行成功，输出符合预期。

#### 2) 手动SVG验证

生成的`demo.svg`文件：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <g id="flow">
    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>
    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>
    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>
  </g>
</svg>
```

✅ 结构正确，可在浏览器中正常渲染。

#### 3) 类型安全

- 全程使用TypeScript strict模式
- 所有类型错误均在编译时捕获
- 无any类型逃逸（除了必需的xml2js库交互处）

#### 4) 错误处理

实现了完整的错误消息体系（符合4.2节要求）：
```typescript
// 示例错误消息
"error: id already exists: r1"
"error: no such shape: r9"
"error: scale factor must be positive"
"error: undo not allowed after io command"
```

#### 5) 代码规范

- 面向对象范式：类层次清晰，字段封装
- 一类一文件：文件名=类名
- 禁止贫血模型：图形的操作方法内聚在Shape类中
- 多态而非switch：除了两处允许的分派点（命令名→命令类，类型名→图形类）

### 4.3 信心来源

1. **编译通过**：TypeScript严格模式无错误
2. **测试验证**：三个测试脚本覆盖核心功能
3. **输出正确**：生成的SVG文件可正常渲染
4. **架构清晰**：模块职责明确，依赖方向正确
5. **设计模式**：Command和Composite模式实现标准

## 5. 运行说明

### 安装依赖
```bash
npm install
```

### 编译
```bash
npm run build
```

### 运行
```bash
npm run cli
```

### 使用测试脚本
```bash
cat test_script.txt | npm run cli
```

### 交互式使用
```bash
npm run cli
svg> init 800 600
svg> create rect r1 100 100 200 150 #ff0000
svg> tree
svg> save output.svg
```
