# SVG 编辑器 (CLI)

一个基于命令行的SVG矢量图形编辑器，支持创建、编辑、保存SVG文档。

## 功能特性

- ✅ 支持多种图形：矩形(rect)、圆形(circle)、椭圆(ellipse)、直线(line)、文本(text)
- ✅ 图形操作：创建、删除、移动、缩放、属性设置
- ✅ 分组管理：创建组、解散组、添加到组、Z-order调整
- ✅ 撤销/重做：完整的undo/redo支持
- ✅ 文件IO：读取和保存SVG文件
- ✅ 结构查看：树形显示和详细信息查看

## 架构设计

### 模块划分

```
src/
├── core/        # 核心领域模型（Shape, Document等）
├── commands/    # 命令模式实现（Command接口及各种命令）
├── io/          # SVG文件解析和序列化
└── cli/         # 命令行交互界面
```

### 设计模式

1. **Command模式**：所有编辑操作封装为命令对象，支持undo/redo
2. **Composite模式**：统一处理单个图形和图形容器
3. **Factory模式**：根据类型创建图形实例

详细架构文档见 [doc/README.md](doc/README.md)

## 快速开始

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

### 使用示例

```bash
svg> init 800 600
canvas 800x600 created

svg> create rect bg 0 0 800 600 #ffffff
rect#bg created

svg> create circle c1 100 100 20 red
circle#c1 created

svg> move c1 50 50
circle#c1 moved by (50,50)

svg> undo
circle#c1 moved back by (-50,-50)

svg> tree
svg (800x600)
├── rect#bg  x=0 y=0 w=800 h=600 fill=#ffffff
├── circle#c1  cx=100 cy=100 r=20 fill=red

svg> save output.svg
saved to output.svg (2 elements)
```

## 命令参考

### 文档操作

- `init [w] [h]` - 创建新画布
- `read <file.svg>` - 读取SVG文件
- `save [file.svg]` - 保存到文件
- `canvas [w] [h]` - 查看/设置画布尺寸

### 图形创建

- `create rect <id> <x> <y> <w> <h> [fill]`
- `create circle <id> <cx> <cy> <r> [fill]`
- `create ellipse <id> <cx> <cy> <rx> <ry> [fill]`
- `create line <id> <x1> <y1> <x2> <y2> [stroke]`
- `create text <id> <x> <y> "content"`
- `create g <id>` - 创建空组

支持 `in <containerId>` 子句直接指定父容器。

### 图形编辑

- `delete <id>` - 删除图形
- `move <id> <dx> <dy>` - 平移
- `scale <id> <factor>` - 缩放
- `set <id> <attr> <value>` - 设置属性

### 结构操作

- `group <newGid> <id1> <id2>...` - 创建组
- `ungroup <gid>` - 解散组
- `addto <gid> <id>` - 添加到组
- `front <id>` - 置于最前
- `back <id>` - 置于最后

### 显示

- `tree [id]` - 显示结构树
- `show <id>` - 显示图形详情
- `help` - 显示帮助

### 撤销重做

- `undo` - 撤销
- `redo` - 重做

## 测试

项目包含三个测试脚本：

```bash
# 基础功能测试
cat test_script.txt | npm run cli

# 完整功能测试（包括undo/redo）
cat test_full.txt | npm run cli

# 读取SVG文件测试
cat test_read.txt | npm run cli
```

## 技术栈

- TypeScript 7.x
- Node.js
- xml2js (SVG解析)

## 项目结构

```
pj1/
├── src/                    # 源代码
│   ├── core/              # 核心领域模型
│   ├── commands/          # 命令实现
│   ├── io/                # IO处理
│   ├── cli/               # CLI界面
│   └── main.ts            # 入口
├── doc/                   # 项目文档
│   └── README.md          # 架构文档
├── dist/                  # 编译输出
├── test_*.txt             # 测试脚本
├── package.json
└── tsconfig.json
```

## License

MIT
