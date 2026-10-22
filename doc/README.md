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

本项目采用与AI协作的方式完成，整个过程中我主导架构设计和关键决策，AI辅助代码实现。以下记录关键的设计讨论和迭代过程。

### 2.1 架构设计阶段

#### 第1轮：模块划分设计

**我的需求**：需要清晰的分层架构，便于后续扩展GUI界面。

**AI初步方案**：提出三层架构（core、commands、cli）。

**我的改进**：要求增加IO层独立处理文件读写，形成四层架构：
- core: 领域模型
- commands: 命令封装
- io: 文件处理
- cli: 交互界面

**最终决策**：采用四层架构，明确依赖方向规则：CLI→Commands→Core，IO→Core。

#### 第2轮：设计模式选择

**我的分析**：
- Command模式是必需的（题目要求），用于undo/redo
- Composite模式适合处理图形层级关系
- 需要考虑IO命令与编辑命令的区别

**关键问题**：我发现IO命令（read/save/init）执行后不应该支持undo，因为文档已经切换，undo栈应该清空。

**我的解决方案**：在CommandHistory中添加enable/disable机制：
```typescript
class CommandHistory {
  private enabled: boolean = true;
  
  disable(): void {
    this.enabled = false;
    this.undoStack = [];  // 清空历史
    this.redoStack = [];
  }
}
```

AI按照这个思路实现了完整的CommandHistory类。

### 2.2 实现过程中的问题发现与纠正

#### 迭代1：Group的move语义错误

**问题发现**：我在review AI生成的Group类时，发现其move实现使用了transform属性：
```typescript
// AI初始实现（错误）
class Group {
  transform: string = "";
  move(dx, dy) {
    this.transform = `translate(${dx},${dy})`;
  }
}
```

**我的分析**：
- 这种方式虽然符合SVG的transform机制，但不符合题目要求
- 题目明确说"scale作用于容器时递归到每个子孙"，说明要直接修改子元素属性

**我的纠正**：要求AI改为递归修改子元素的坐标：
```typescript
// 修正后的实现
move(dx: number, dy: number): void {
  for (const child of this.children) {
    child.move(dx, dy);  // 递归调用
  }
}
```

#### 迭代2：TypeScript类型错误

**问题发现**：编译时报错：
```
error TS7006: Parameter 'line' implicitly has an 'any' type.
```

**我的诊断**：SVGSerializer中map函数参数缺少类型注解，在strict模式下不允许。

**解决方案**：要求AI添加显式类型：
```typescript
svg.split('\n').map((line: string, i: number) => ...)
```

#### 迭代3：ts-node运行时错误

**问题发现**：运行`npm run cli`时报错，ts-node在Node.js v25下兼容性问题。

**我的决策**：放弃ts-node，改用标准的编译后运行方式：
```json
"scripts": {
  "build": "tsc",
  "cli": "node dist/main.js"
}
```

这样更稳定，也符合生产环境的最佳实践。

#### 迭代4：SVG解析的ID冲突处理

**我的需求**：题目要求读取SVG时，如果元素缺少ID要自动分配并警告。

**我的设计**：提出使用"标签名+序号"的方式生成ID（如rect1, rect2），并维护计数器避免冲突。

**AI实现**：按照我的方案实现了SVGParser中的generateId方法：
```typescript
private idCounter: Map<string, number> = new Map();

private generateId(tag: string): string {
  const count = (this.idCounter.get(tag) || 0) + 1;
  this.idCounter.set(tag, count);
  return `${tag}${count}`;
}
```

并在解析时打印警告：`warning: assigned id rect1 to unnamed <rect>`

### 2.3 测试与验证

**我的测试策略**：
1. 创建三个测试脚本覆盖不同场景
2. 验证生成的SVG文件可在浏览器正常渲染
3. 测试undo/redo在IO命令后正确禁用

**测试发现的问题**：
- tree命令输出格式需要调整，要求内联几何属性便于查看
- 错误消息格式需要统一前缀"error:"

**最终结果**：所有测试通过，功能完整实现。

### 2.4 协作总结

整个开发过程中：
- **架构设计**：由我主导，提出四层架构和依赖规则
- **关键决策**：IO命令后禁用undo、Group递归实现等均由我决定
- **问题发现**：代码review中发现的语义错误、类型错误等由我指出
- **代码实现**：AI按照我的需求和规范快速生成代码
- **迭代优化**：根据编译和测试结果持续改进

这种协作模式充分发挥了AI的代码生成能力，同时保持了我对架构和质量的把控。

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
