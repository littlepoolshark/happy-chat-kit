# 前言

## 背景

在 AI 大模型横行的当下，前端侧要基于流式输出的对话流界面来实现特定任务似乎已经成为了一种常见的需求。在这种需求下，基于「 Ant Design X + react-markdown」 去做一个流式输出的对话流界面似乎是一个不错的选择。

但是，很快我们就会遇到问题。什么问题呢？那就是每个业务方都会有自己的特定UI展示的需求，这不是光纯 markdown 渲染就能满足的。

很快，我们发现了 remark 指令这个东西。通过 remark 指令，我们可以在 markdown 中插入自定义的指令，并在 `<ReactMarkdown />`层面声明指令到自定义组件的映射关系来实现特定的 UI 展示需求。

以上，本质上是通过一个松散的组合方案来解决了对话流界面展示特定UI展示需求的问题。如果直接不做任何约束，在实际的团队协作中编码中就会产生以下问题：

- 不同业务方之间的 remark 指令冲突；
- 不同业务场景下的对话流界面会重复编码大量相似的代码；
- 框架性代码跟业务性代码耦合得太深，导致代码的维护成本和调试成本陡增；

总而言之，代码得不到科学的管理，整体的代码的可调试性，健壮性和可扩展性得不到保障。

## 目标

为了解决以上问题，本人实现了 HappyChatKit 框架。HappyChatKit 旨在构建一个**高度可扩展的 SSE 自定义组件渲染框架**，它实现以下核心目标：

1. **分层解耦**：通过三层架构（核心层、协议层、渲染层）实现关注点分离；
2. **插件化扩展**：基于 UIManager 插件模式支持灵活的数据处理策略；
3. **组件化渲染**：通过 remark-directive 实现灵活的自定义组件渲染；
4. **状态一致性**：提供统一的状态管理和错误处理机制
5. **高度可测试**：每层职责明确，便于单元测试和集成测试。

# 前置知识

## SSE 规范简介

Server-Sent Events (SSE) 是 HTML5 标准的一部分，定义了服务器向客户端推送实时数据的标准协议。根据 [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) 的规范，SSE 消息具有以下基本格式：

```
event: message_type
data: {"key": "value"}
data: {"continuation": "of_data"}

```

> 格式说明：SSE 消息格式基于文本协议，每个字段占用一行，字段与值之间用「冒号」和「空格」分隔。

**关键字段说明**：

- **`event`** 字段：指定事件类型，客户端可根据此字段进行事件分类处理
- **`data`** 字段：包含实际的消息数据，多行 `data` 字段会被自动合并
- **消息分隔符**：两个连续的换行符（`\n\n`）标识一条完整消息的结束

> 重要概念说明：一条完整消息在 Ant Design X 和 HappyChatKit 中称之为 `chunk`

## 不同大模型服务商的流式 chat 接口数据格式现状

尽管都基于 SSE 协议，但不同的 AI 服务提供商在具体实现上存在显著差异，我们可以看看以下示例：

**OpenAI Chat Completions Streaming 格式**：

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}

data: [DONE]
```

**字节跳动 Coze 流式响应格式**：

```
event: conversation.message.delta
data: {"conversation_id":"123","message":{"id":"msg_123","type":"answer","content":"Hello","content_type":"text"}}

event: conversation.message.completed
data: {"conversation_id":"123","message":{"id":"msg_123","type":"answer","content":"Hello world","content_type":"text"}}

event: conversation.chat.completed
data: {"conversation_id":"123","status":"completed"}
```

**硅基流动流式响应格式**：

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-ai/DeepSeek-V2.5","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-ai/DeepSeek-V2.5","choices":[{"index":0,"delta":{"reasoning_content":"思考过程"},"finish_reason":null}]}

data: [DONE]
```

从上述示例可以看出，不同服务商在以下方面存在显著差异：

1. **事件类型命名**：OpenAI 不使用 `event` 字段，Coze 使用语义化的事件名称
2. **数据结构**：字段名称、嵌套层级、数据类型各不相同
3. **特殊字段**：硅基流动支持 `reasoning_content`，Coze 有 `conversation_id` 等
4. **结束标识**：OpenAI 使用 `[DONE]`，Coze 使用特定事件类型

这种格式不一致性给前端开发带来了以下挑战：

- **紧耦合风险**：直接处理特定格式会导致代码与大模型服务商强绑定
- **维护成本高**：支持新服务商需要修改核心处理逻辑
- **测试复杂度**：需要为每种格式编写独立的测试用例

### HappyChatKit 的解决方案

通过设计**协议层（Protocol Layer）**，将服务商特定的数据格式处理逻辑封装在独立的 UIManager 实例中，实现：

- **格式抽象**：核心层只处理标准化的数据流，不关心具体格式
- **策略隔离**：每个服务商的格式处理策略相互独立
- **扩展性**：新增服务商支持只需实现新的协议层，无需修改核心代码

## 底层基础设施简介

HappyChatKit 框架本质是对 Ant Design X 和 remark 生态的向上封装。了解这两个库/生态的基本原理，有助于理解 HappyChatKit 的设计和实现。

### remark 生态简介

#### 什么是 remark？

基于 unified 的 Markdown 处理生态，处理 mdast （Markdown AST），负责 Markdown 的解析与语法扩展。

- 解析： remark-parse （底层由 micromark 驱动）生成 mdast 。
- 扩展：如 remark-gfm （GitHub风味）、 remark-directive （自定义指令语法）等。

#### 什么是 rehype？

基于 unified 的 HTML 处理生态，处理 hast （HTML AST），负责 HTML 层面的转换、清洗与增强。

- 解析/转换： rehype-parse （解析 HTML）、 rehype-stringify （输出 HTML）；
- 安全与增强： rehype-raw （允许 Markdown 中的原始 HTML）、 rehype-sanitize （安全清洗）、 rehype-highlight （代码高亮）等。

#### 什么是 react-markdown？

react-markdown 是 remark 与 rehype 的组合封装，最终实现将 markdown 文本转换为 React 组件树。

#### 三者之间的区别与联系

##### 区别

1. 所在的层级和职责不一样：

- remark 是在 markdown 解析阶段，根据 markdown 语法来解析 markdown 文本，最终得到一颗 mdast 树 。
- rehype 是在 HTML 解析阶段，将 mdast 树转换为 hast 树，并负责对 hast 树进行转换、清洗与增强。
- react-markdown 是在界面渲染阶段， 负责将 hast 树转换为 React 组件树。

##### 联系

1. 三者都是基于 unified 生态，共享相同的插件系统。
2. remark 与 rehype 可以独立使用，也可以组合使用。
3. react-markdown 是 remark 与 rehype 的组合封装，最终实现将 markdown 文本转换为 React 组件树。

![markdown-ecosystem](./markdown-ecosystem.png)

#### 基于上述三者的完整渲染流程

1. 输入：Markdown 文本
2. remark 解析（remark-parse）：根据 Markdown 语法生成 mdast 树。生成的 mdast 传递给所有的 remark 插件；而 rehype 就是 remark 其中的一个插件之一；
3. rehype 转换（rehype-parse）：将 mdast 树 转换为 hast 树。生成的 hast 传递给所有的 rehype 插件（对的， rehype 也有自己的插件系统）进行处理；
4. react-markdown 渲染：使用 hast → JSX 的映射将节点渲染成 React 组件（<react-markdown> 组件的 components 属性就是为了定制这种渲染映射关系）。
5. 输出：渲染后的 React 组件树

# 设计与实现

## 设计原则

### 单一职责原则

每个层级和组件都有明确的职责边界：

- **核心层**：专注于流控制、插件生命周期管理和通用工具函数
- **协议层**：专注于特定业务场景的数据处理策略
- **渲染层**：专注于 Markdown 解析和 React 组件渲染

### 依赖倒置原则

低层模块不依赖高层模块，两者都依赖于抽象：

- 核心层定义 `ChatUIManager` 接口，协议层实现具体策略
- 渲染层通过 Context 消费核心层提供的组件映射

### 开闭原则

对扩展开放，对修改封闭：

- 通过 UIManager 插件机制支持新的数据处理策略
- 通过 remark-directive 支持新的自定义组件类型

### 组合优于继承

- 协议层通过组合不同的 UIManager 插件实现对不同的 SSE chunk 协议的支持
- UIManager 实例通过 plugins 函数组合来实现不同的处理策略
- 渲染层通过组合不同的渲染层组件来实现特定的渲染需求
- 多个 UIManager 实例协作完成复杂的字符串拼接逻辑

## 三层架构

```
┌────────────────────────────────────────────────────────────────────┐
│                        渲染层 (Renderer)                            │
│  ┌─────────────────┐  ┌───────────────────┐  ┌───────────────────┐ │
│  │ MarkdownRenderer│  │ AutoScrollToBottom│  │ HappyChatMessageFlow│ │
│  └─────────────────┘  └───────────────────┘  └───────────────────┘ │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 │                                  │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │ useComponents Hook
┌─────────────────────────────────┼─────────────────────────────┐
│                        协议层 (Protocol)                       │
│  ┌──────────────────────────┐  ┌────────────────────────────┐ │
│  │    builtin UIManagers    │  │ custom-component UIManagers│ │
│  └──────────────────────────┘  └────────────────────────────┘ │
│                                                               │
└─────────────────────────────────┼─────────────────────────────┘
                                  │ ChatUIManager Interface
┌─────────────────────────────────┼──────────────────────────────┐
│                         核心层 (Core)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ useHappyChatCore  │  │ HappyChatProvider │  │ ChatKit class   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │        │
│           └─────────────────────┼─────────────────────┘        │
│                                 │                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │ SSE Stream Processing
                            ┌─────┴─────┐
                            │ XStream   │
                            │ (SSE API) │
                            └───────────┘
```

### 三层详解

#### 核心层 (Core)

##### 职责

核心层的职责是提供流控制、插件生命周期管理和通用工具函数

##### 关键组件

- useHappyChatCore: 提供流控制、插件生命周期管理和通用工具函数的 React Hook
- ChatKit class: 承载用户对框架的配置性功能

##### 实现原理

###### 单向时序性

在深入代码讲解实现原理之前，我们不妨先了解一下 SSE chunk的一个基础特性 - **「单向时序性」**。

服务器发送事件（SSE）通过 EventSource 建立一个持久的、单向的连接，客户端持续接收来自服务器的消息，每条消息以文本块的形式写入事件流，浏览器以 message 事件逐条处理这些消息。

事件流以 MIME 类型 `text/event-stream` 传输，消息之间由一对换行符分隔；当连续出现多行以 `data:` 开头时，客户端会将其按规范合并为一条消息的 data 字段（在各 data 行之间插入换行）。

从抽象建模角度，我们将到达的消息建模为一个"数组"，数组的每个元素就是一条 chunk；消息按到达的时序被迭代消费，这个时序特性源于事件流的线性文本块格式与逐条分派的处理模型。

###### 主流程

核心层的本质是基于 SSE chunk 的「单向时序性」的特性，实现了一个 SSE chunk
流程管理框架。并且在这个框架上利用 hook 思想来支持自定义扩展。

首先，我们得实现核心框架。核心代码其实就是下面的几行代码：

```typescript
for await (const chunk of XStream({
  readableStream: response.body,
})) {
  // .......
}
```

> 从上面的代码我们可以看出，最底层并且核心的工作 - 「将二进制流转换为 SSE chunk 流」已经被 Ant design X 的 XStream 库实现了。HappyChatKit 只是站在巨人的肩膀上罢了。

然后，我们在这个框架代码的前，中，后分别添加 hook 来支持自定义扩展。

- SSE chunk 迭代之前调用 `onChunksStart` hook
- SSE chunk 迭代时调用 `onChunk` hook
- SSE chunk 迭代结束调用 `onChunksEnd` hook

```typescript
let chunks: Chunk[] = [];

onChunksStart?.(onUpdate);
for await (const chunk of XStream({
  //@ts-ignore
  readableStream: response.body,
})) {
  chunks.push(chunk);
  if (isFirstChunk) {
    isFirstChunk = false;
    onFirstChunk?.(chunk, onUpdate);
  }
  onChunk?.(chunk, onUpdate);
}
onChunksEnd?.(chunks, onUpdate);
onSuccess(chunks);
```

从 `onChunksStart()`,`onChunk()`和`onChunksEnd()` 的函数调用签名来看，我们把接收到的 chunk 或者 chunks，透传给外部。于此同时，如何更新 Ant design X 的 message 状态也交给了外部来决定。这就是核心层做到业务无关的的秘诀之所在。

值得指出的有两点：

- 第一是 `onWaiting()` 这个 hook 的设计初衷。之所以设计这个 hook 是因为，用户在输入框输入一个问题到我们 chat 接口请求之间可能会存在一个等待时间？这种情况一般会发生在浏览器过于繁忙，我们发出去的请求此时正在排队中， 还没有跟服务器建立 TCP 链接。为了更好的用户体验，我们需要在这种情况下，给用户一个反馈。所以，`onWaiting()` 这个 hook 就应运而生了。
- 第二是 HappyChatKit 已经将(答案) message 的数据结构固化为 `HappyMessage`：

```typescript
export interface HappyMessage {
  content: string;
  error?: {
    type: ErrorType;
    error: Error;
    meta?: { HttpStatus: number };
  };
  isWaiting?: boolean;
  isAborted?: boolean;
  // 应该支持协议层自己的自定义字段
  // [key: string]: any;
}
```

最后，处理一些边角的特性：

- 错误处理：在迭代过程中如果出现错误，需要调用 `onError` hook 并传递错误信息。
- loading 状态管理：在请求开始时，需要设置 loading 状态为 true；在请求结束时（无论成功或失败），需要设置 loading 状态为 false。

###### SSE chunk UI 管理实例

HappyChatKit 深刻洞察了一个流式对话界面的在前端技术实现的一个本质：**给定一个 SSE chunk 数组，通过迭代，我们如何实现一个最终字符串的拼接**。

可喜的是，通过核心框架（sse chunk 迭代）和 onChunk() hook， 我们可以逐一逐一地作用于每一个 SSE chunk。**负责将每一种类型的 SSE chunk 转换为总体字符串中的一个部分的那个主体就是 SSE chunk UI 管理实例 - `UIManager`**。这是 HappyChatKit 框架在流式对话界面业务场景下的一个很核心的抽象。

每一个 SSE chunk 都可以归属到一个类别上。对这个类别的 chunk 在 UI 上的表现（主要是通过干预最终总字符串的拼接）的管理人就是 `ChatUIManager`。所有的 SSE chunk UI 管理实例都需要实现一个接口 - `ChatUIManager`。

```typescript
export interface ChatUIManager {
  // 自定义组件类型
  type: string;
  // 自己维护的内部状态
  state: any;
  component: React.FC<any> | null;
  plugins: (instances: ChatUIManager[]) => {
    onChunksStart?: () => HappyMessage;
    onChunksEnd?: () => HappyMessage | undefined;
    onChunk?: (data: string | Record<string, any>) => HappyMessage | undefined;
    onError?: (currentContent: string, errorType: string, error: any, meta: any) => null | string;
  };
  reset?: () => void;
  render?: () => string;
}
```

在 HappyChatKit 中，我们将 UIManager 分类两类：

- 内置的 UIManager - 服务提供商 chat 接口协议相关的 UIManager
- 自定义组件 UIManager - 实现了 HappyChatKit 框架固化了的 SSE 自定义组件协议

每个 chat 接口服务提供商返回的 SSE chunk 的格式都是不一样的，这一点在上面的章节已经指出来了。基于 ChatUIManager 接口来实现不同的 UIManager 实例，这是协议层要做的事情，在本章节就不展开说明了。现在要说的是，**自定义组件 UIManager 实例**。

在 HappyChatKit 框架中，我们规定了 SSE 自定义组件协议是：

1. 必须只能用一条 SSE chunk 来表示一个自定义组件
2. SSE chunk 的 `event` 字段必须有，且它的值是 `custom-component`;
3. SSE chunk 的 `data` 字段必须有，且它的值是一个 JSON 字符串，这个 JSON 字符串表示了自定义组件的属性
4. 上面所提到的 JSON 字符串必须包含一个 `type` 字段和一个 `props` 字段，用来表示自定义组件的类型和该组件渲染时所需的属性
5. `props` 字段的值必须是一个 JSON 序列化字符串

下面给出一个SSE chunk 的例子：

```json
event:custom_component
data:{"type":"suggestions","props":"[{\"text\":\"继续处理其他待融资项目\"}]","sessionId":"13ad6814-b53c-4694-9e35-9bebf8b8b1cb"}

```

因为 SSE 中的自定义组件是有固定协议的，所以，HappyChatKit 框架内置了一个工厂函数 `UIManagerFactory` 来创建自定义组件 UIManager 实例。源码见 `happy-chat-kit/src/core/utils/index.ts`

```typescript
export const UIManagerFactory = (Component: ComponentWithMeta, directiveType: RemarkDirectiveType): ChatUIManager => {
  const directiveName = Component.directiveName;
  if (!directiveName) {
    throw new Error(`UIManagerFactory: directiveName static property of ${Component.displayName} not found`);
  }
  return {
    type: directiveName,
    state: {},
    component: Component,
    render() {
      switch (directiveType) {
        case RemarkDirectiveType.Text:
          // Text directive 通常是内联的，格式类似于 leaf directive
          return renderRemarkTextDirective(this.type, this.state);
        case RemarkDirectiveType.Leaf:
          return renderRemarkLeafDirective(this.type, this.state);
        case RemarkDirectiveType.Container:
          // Container directive 需要内容参数，这里暂时传空字符串
          // 实际使用时可能需要从 state 中获取 content
          return renderRemarkContainerDirective(this.type, this.state, this.state.content || '');

        default:
          // 默认使用 leaf directive 格式
          return renderRemarkTextDirective(this.type, this.state);
      }
    },
    plugins(instances: ChatUIManager[]) {
      return {
        onChunk: (data) => {
          this.state = data;
          return {
            content: this.render!(),
          };
        },
      };
    },
  };
};
```

可以看出，`UIManagerFactory` 函数的生成的 UIManager 实例的核心是 `render` 方法。而 render 方法的实现就是根据我们注册自定义组件时候指定的 `RemarkDirectiveType` 来决定如何拼出符合 remark directive 格式的字符串。而最后，总字符串中的 remark directive 格式的字符串会被 react-markdown 经过一系列的流程（上面「底层基础设施简介」小节已经介绍过了）来渲染成最终的 React 组件。

###### 小结

综上，可以看出，核心层实现的核心要素有三个：

- 一个 SSE chunk 迭代框架

```typescript
for await (const chunk of XStream({ readableStream: response.body })) {
  // ......
}
```

- 一个生命周期 hook 框架

```typescript
export interface ChatUIManagerLifecycleHooks {
  onChunksStart?: () => HappyMessage;
  onChunksEnd?: () => HappyMessage | undefined;
  onChunk?: (data: string | Record<string, any>) => HappyMessage | undefined;
  onError?: (currentContent: string, errorType: string, error: any, meta: any) => null | string;
}
```

- 一个接口 - `ChatUIManager`

```typescript
export interface ChatUIManager {
  type: string;
  state: any;
  component: React.FC<any> | null;
  plugins(instances: ChatUIManager[]): ChatUIManagerLifecycleHooks;
  reset?: () => void;
  render?: () => string;
}
```

有了上面的三个要素的概念后，核心层实现原理可以表述为：“先利用 SSE chunk 迭代框架来迭代 SSE 流中的每一个 chunk，并找到这个 chunk 对应的 UIManager 实例。然后提供一个基于 hook 的生命周期管理框架来让 UIManager 实例来决定如何拼接出最终完整的内容字符串。”

最后，是集中处理了错误，通过状态和方法的传递问题（传递到自定义组件内部）。这部分虽然比较细节和琐碎，但是对于它们的实现却使得整个核心层完全自洽，闭环了。

#### 协议层 (Protocol)

从另外一个角度，协议层也可以称之为「业务层」。因为 SSE 协议本身就是业务强相关的。换一种通俗的说法，每一个开发团队的流式聊天界面所对接的 chat 接口所返回的数据格式很大概率不同的。这种不确定性，就是核心层需要跟协议层解耦的原因。

> 据我了解，很多公司不会让前端直接对接大模型的 chat 接口，而是会有一个中间层来处理。这就导致了所返回的 SSE 协议格式会因公司而异。

##### 职责

协议层的职责是通过实现各种类型 SSE chunk 的 UI Manager 来实现最终的喂给 react-markdown 内容字符串的拼接。

##### 关键组件

- `useXxxChat()` hook - Xxx 是业务命名空间。比如，当前用作于示例的协议层的业务命名空间是 `happy`。那么，我们就要实现一个 `useHappyChat()` hook。
- 内置的 UI Manager 的实现 - 比如，示例协议层就有三个内置的 UI Manager 实现，分别是 `Answer`、`Heartbeat`、`TOC`。

##### 实现原理

本章节通过介绍 happy 这个业务空间的协议层实现，来描述协议层的实现原理。在进一步深入之前，我们有必要了解具体的 happy 协议是什么？

###### happy 协议

1. 主体类的 SSE chunk - Answer。它对应的 chunk 协议为：
   - event 字段值为：“answer”
   - data 字段值为：一个包含必须字段 `content` 的 JSON 字符串，包含了回答的内容。

一个示例如下：

```
event:answer
data:{"content":"以下是我们主要的融资"}
```

2. 思考链的 SSE chunk - TOC。它对应的 chunk 协议为：
   - 思考开始的时候，用一个标志性的 chunk 来进行标识。
     - event 字段值为：“custom_component”；
     - data 字段值为： 它的值是通过对一个对象的序列化得到的字符串。该对象的格式为：
     ```
     {
       "type": "mci_cot",
       "props": {"status":"start"}
     }
     ```
   - 思考结束的时候，用一个标志性的 chunk 来进行标识。
     - event 字段值为：“custom_component”；
     - data 字段值为： 它的值是通过对一个对象的序列化得到的字符串。该对象的格式为：
     ```
     {
       "type": "mci_cot",
       "props": {"status":"end"}
     }
     ```
   - 思考过程中，使用 answer 类的 chunk 来输出思考过程。

一个示例如下：

```
event:custom_component
data:{"type":"mci_cot","props":"{\"status\":\"start\"}","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"> 嗯，接收到用户关","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:heartbeat
data:{"type":"heartbeat","session_id":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"于滴灌投资主要策略的","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"问题，系统开始解析请","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"求。首先验证网络连接","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"状态，确认Respo","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

event:answer
data:{"content":"nse code为2","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}

......

event:custom_component
data:{"type":"mci_cot","props":"{\"status\":\"end\"}","sessionId":"8bcb77b8-a652-4f89-8a72-ca3741eac7df"}
```

3. 心跳 SSE chunk - Heartbeat。目的是为了保持 SSE 连接的活跃，防止超时。它对应的 chunk 协议为：
   - event 字段值为：“heartbeat”

一个示例如下：

```
{
  "type": "heartbeat",
  "session_id": "8bcb77b8-a652-4f89-8a72-ca3741eac7df"
}
```

4. 自定义组件的 SSE chunk - CustomComponent。它对应的 chunk 协议为：
   - event 字段值为：“custom_component”
   - data 字段值为： 一个合法的 json 字符串。代表的是该自定义组件渲染所需要的属性：
   ```
   {
     "type": "xxx", // 任意的自定义组件名
     "props": {"key1":"val1"} // 任意的键值对
   }
   ```

#### 渲染层 (Renderer)

##### 职责

渲染层的职责是将 `HappyMessage` 格式的对象渲染为 React 组件。它负责：

1. **Markdown 解析与渲染**：使用 react-markdown 将内容字符串转换为 React 组件树
2. **自定义组件映射**：将 remark-directive 指令映射到对应的 React 组件
3. **消息流展示**：提供对话气泡列表的展示和交互
4. **状态反馈**：展示加载状态、错误状态、等待状态等 UI 反馈

##### 关键组件

- **MarkdownRenderer**：基于 react-markdown 的 Markdown 渲染器，集成 remark-directive 插件系统
- **HappyChatMessageFlow**：基于 Ant Design X Bubble.List 的消息流组件，管理对话展示
- **AutoScrollToBottom**：自动滚动到底部的辅助组件
- **ActionBar / AnswerBubbleFooter**：消息操作栏和答案底部信息展示

##### 实现原理

###### MarkdownRenderer

`MarkdownRenderer` 是渲染层的核心组件，它负责将包含 remark-directive 指令的 Markdown 文本渲染为 React 组件。其工作原理如下：

```typescript
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isRequesting, request2Agent }) => {
  const components = useComponents(isRequesting, request2Agent);

  return (
    <AgentRequestContext.Provider value={{ isRequesting, request2Agent }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks, remarkDirective, remarkDirectiveRehype]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components as any}
      >
        {preprocessMessage(content)}
      </ReactMarkdown>
    </AgentRequestContext.Provider>
  );
};
```

关键实现要点：

1. **插件链配置**：通过 `remarkPlugins` 和 `rehypePlugins` 配置 Markdown 处理管道
   - `remarkDirective` / `remarkDirectiveRehype`：解析指令语法并转换为 HTML
   - `remarkGfm`：支持 GitHub Flavored Markdown
   - `remarkMath` / `rehypeKatex`：支持数学公式渲染
   - `rehypeRaw`：允许原始 HTML

2. **自定义组件映射**：通过 `useComponents` Hook 动态获取所有注册的自定义组件，并传递给 react-markdown 的 `components` 属性

3. **上下文传递**：通过 `AgentRequestContext` 向自定义组件传递 `isRequesting` 和 `request2Agent` 方法，使自定义组件能够与聊天系统交互

###### useComponents Hook

`useComponents` 负责收集所有注册的自定义组件，并将其包装为高阶组件：

```typescript
export const useComponents = (isRequesting: () => boolean, request2Agent?: (userInput: string) => void) => {
  const instances = useInstances();
  return useMemo(() => {
    return instances
      .filter((instance) => !!instance.component)
      .filter((instance) => isReactComponentV2(instance.component))
      .reduce<Record<string, React.FC<HappyReactMarkdownComponentProps>>>(
        (acc, instance) => {
          if (instance.component) {
            acc[instance.type] = withMarkdownComponentProps(instance.component);
          }
          return acc;
        },
        {},
      );
  }, [instances]);
};
```

该 Hook 的工作流程：

1. 通过 `useInstances` 获取所有 UIManager 实例
2. 过滤出具有有效 React 组件的实例
3. 使用 `withMarkdownComponentProps` HOC 包装每个组件，注入通用功能

###### withMarkdownComponentProps HOC

这是一个高阶组件，为自定义组件提供以下能力：

1. **Props 解析**：将 remark-directive 中的 JSON 字符串 props 解析为 JavaScript 对象
2. **上下文注入**：从 `AgentRequestContext` 获取 `isRequesting` 和 `request2Agent`
3. **错误边界**：通过 `ErrorBoundary` 包裹组件，防止单个组件错误导致整个应用崩溃
4. **Props 校验**：如果组件定义了 `validator` 静态方法，会在渲染前进行校验

```typescript
export const withMarkdownComponentProps = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
): React.FC<HappyReactMarkdownComponentProps> => {
  const WrappedComponent: React.FC<HappyReactMarkdownComponentProps> = ({
    node,
    children,
    props: propsString,
    ...rest
  }) => {
    const rawProps = propsString ?? (rest as any).dataProps ?? ...;
    const parsedProps = safeJsonParse<Record<string, any>>(
      typeof rawProps === 'string' ? rawProps : '{}',
      {},
    );
    const { isRequesting, request2Agent } = React.useContext(AgentRequestContext);

    return (
      <ErrorBoundary componentName={Component.displayName || ...}>
        <ValidationGate
          Component={Component}
          parsedProps={parsedProps}
          componentProps={{ props: parsedProps, node, children, ...rest }}
          isRequesting={isRequesting}
          request2Agent={request2Agent}
        />
      </ErrorBoundary>
    );
  };
  return React.memo(WrappedComponent);
};
```

###### HappyChatMessageFlow

消息流组件负责对话的整体布局和展示：

```typescript
function HappyChatMessageFlow({ messages, isRequesting, request2Agent, ... }) {
  const roles: GetProp<typeof Bubble.List, 'roles'> = {
    ai: { placement: 'start', typing: { step: 5, interval: 20 }, avatar: ..., styles: ... },
    user: { placement: 'end', avatar: ..., styles: ... },
  };

  const bubbleItems = visibleMessages.map(({ id, message, status }, index) => {
    // 根据消息状态渲染不同的 UI
    // - 用户消息：纯文本展示
    // - AI 消息：MarkdownRenderer 渲染 + Footer
    // - 加载状态：显示 Loading
    // - 错误状态：显示错误信息和重试按钮
  });

  return (
    <div className="happy-chat-message-flow">
      <Bubble.List items={bubbleItems} roles={roles} />
    </div>
  );
}
```

该组件的特点：

1. **角色区分**：为 AI 和用户消息配置不同的展示样式（位置、头像、颜色等）
2. **状态感知**：根据消息的 `status`（loading/success/error）渲染不同的 UI
3. **Footer 定制**：为答案气泡添加操作栏（复制、重试）和免责声明
4. **心跳检测**：识别心跳指令，在长时间无响应时显示加载状态

### 层间通信

HappyChatKit 的三层架构通过以下机制实现通信：

#### 1. Context 传递（自上而下）

通过 React Context 实现跨层数据传递：

```
HappyChatProvider (Core)
    ↓ UIManagerContext
useInstances (Core)
    ↓ instances
useComponents (Renderer)
    ↓ components
MarkdownRenderer
```

- **UIManagerContext**：由 `HappyChatProvider` 提供，包含所有 UIManager 实例
- **AgentRequestContext**：由 `MarkdownRenderer` 提供，包含 `isRequesting` 和 `request2Agent`

#### 2. Hook 组合（横向连接）

各层通过 Hook 组合实现功能连接：

```typescript
// useHappyChat (Protocol Layer)
const useHappyChat = () => {
  const instances = useInstances();           // 从 Core 获取实例
  const { messages, request2Agent } = useHappyChatCore({  // 调用 Core Hook
    onChunk: (chunk, updater) => {
      // 协议层处理逻辑
      const manager = getInstance(instances, eventType);
      const result = manager.plugins(instances).onChunk?.(data);
      updater(result);
    },
  });
  // ...
};
```

#### 3. 回调函数（自下而上）

通过回调函数将底层事件传递到上层：

```
XStream (SSE 解析)
    ↓ chunk
useHappyChatCore.onChunk
    ↓ 调用 protocol onChunk
useHappyChat.onChunk
    ↓ 调用 manager.plugins.onChunk
UIManager.plugins
    ↓ 返回新内容
更新 message 状态
    ↓
React 重新渲染
```

#### 4. Ref 同步（跨渲染周期）

使用 Ref 保持跨渲染周期的数据一致性：

```typescript
const useHappyChat = () => {
  const currentContentRef = useRef('');  // 累积内容
  const instancesRef = useRef([...instances]);  // 稳定的实例引用

  const onChunk = (chunk, updater) => {
    currentContentRef.current += newContent;  // 更新 Ref
    updater({ content: currentContentRef.current });  // 更新状态
  };
};
```

#### 5. 数据流总结

完整的数据流如下图所示：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据流向图                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Input                                                         │
│      │                                                              │
│      ▼                                                              │
│  request2Agent ────────► useHappyChatCore ──────► useXAgent         │
│                              │                         │            │
│                              │◄──────── SSE Stream ◄──┘            │
│                              │                                      │
│                              ▼                                      │
│                         onChunk Hook                                │
│                              │                                      │
│                              ▼                                      │
│                    ┌─────────────────┐                              │
│                    │  UIManager 路由  │                              │
│                    │  (getInstance)  │                              │
│                    └────────┬────────┘                              │
│                             │                                       │
│            ┌────────────────┼────────────────┐                      │
│            ▼                ▼                ▼                      │
│       Answer.plugins   TOC.plugins    Heartbeat.plugins             │
│            │                │                │                      │
│            └────────────────┼────────────────┘                      │
│                             │                                       │
│                             ▼                                       │
│                      拼接 content 字符串                             │
│                             │                                       │
│                             ▼                                       │
│                      HappyMessage.content                           │
│                             │                                       │
│                             ▼                                       │
│                    MarkdownRenderer                                 │
│                             │                                       │
│                             ▼                                       │
│                 react-markdown + remark-directive                   │
│                             │                                       │
│                             ▼                                       │
│                      React Components                               │
│                             │                                       │
│                             ▼                                       │
│                      DOM 渲染                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

# 使用&扩展指南

## 快速开始（使用 Preset）

对于大部分应用场景，推荐直接使用 `happy-chat-kit/preset`，它提供了开箱即用的完整功能：

```tsx
import { HappyChatProvider, useHappyChat, HappyChatMessageFlow } from 'happy-chat-kit/preset';

function App() {
  return (
    <HappyChatProvider>
      <ChatPage />
    </HappyChatProvider>
  );
}

function ChatPage() {
  const { messages, request2Agent, isRequesting } = useHappyChat({
    request: async (message, ctrl) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: ctrl.signal,
      });
      return response;
    },
  });

  return (
    <HappyChatMessageFlow
      messages={messages}
      request2Agent={request2Agent}
      isRequesting={isRequesting}
    />
  );
}
```

## 注册自定义组件

### 1. 创建自定义组件

自定义组件需要满足 `ComponentWithMeta` 接口，即定义 `directiveName` 和 `displayName` 静态属性：

```tsx
import type { ComponentWithMeta, ParsedHappyReactMarkdownComponentProps } from 'happy-chat-kit';

export interface SuggestionsProps {
  items: Array<{ text: string; value?: string }>;
}

const Suggestions: ComponentWithMeta<ParsedHappyReactMarkdownComponentProps<SuggestionsProps>> = ({
  props,
  request2Agent,
}) => {
  const { items } = props;

  return (
    <div className="suggestions">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => request2Agent?.(item.value || item.text)}
        >
          {item.text}
        </button>
      ))}
    </div>
  );
};

Suggestions.directiveName = 'suggestions';
Suggestions.displayName = 'Suggestions';

export default Suggestions;
```

### 2. 注册组件

使用 `ChatKit` 类注册自定义组件：

```tsx
import { happyChatKit } from 'happy-chat-kit/preset';
import Suggestions from './components/Suggestions';
import LoginForm from './components/LoginForm';

// 单个注册
happyChatKit.register(Suggestions);

// 批量注册
happyChatKit.registerBatch([
  Suggestions,
  { component: LoginForm, type: RemarkDirectiveType.Leaf },
]);

// 创建 Provider
export const Provider = happyChatKit.createProvider();
```

### 3. 在应用中使用

```tsx
import { Provider } from './chat-config';

function App() {
  return (
    <Provider>
      <YourApp />
    </Provider>
  );
}
```

### 4. 后端返回格式

自定义组件对应的 SSE chunk 格式如下：

```
event: custom_component
data: {"type": "suggestions", "props": "{\"items\":[{\"text\":\"选项1\"},{\"text\":\"选项2\"}]}"}
```

> **注意**：`props` 字段必须是 JSON 序列化后的字符串。

## 选择 Directive 类型

HappyChatKit 支持三种 remark-directive 类型，根据组件需求选择合适的类型：

| 类型 | 语法 | 适用场景 | 示例 |
|------|------|----------|------|
| TextDirective | `:name{props}` | 行内元素，如标签、徽章 | `:agent_name{name="AI助手"}` |
| LeafDirective | `::name{props}` | 块级元素，无内容 | `::login_form{title="登录"}` |
| ContainerDirective | `:::name{props}\n内容\n:::` | 包裹内容的块级元素 | TOC 组件 |

选择建议：
- **TextDirective**：用于行内展示的小组件，如用户名标签、状态徽章
- **LeafDirective**：用于独立的交互组件，如表单、按钮组
- **ContainerDirective**：用于需要包裹 Markdown 内容的组件，如折叠面板、卡片

## 实现自定义协议层

如果预设的协议层不满足需求，可以在 Core 层基础上实现自己的协议层：

### 1. 实现自定义 UIManager

```typescript
import type { ChatUIManager } from 'happy-chat-kit';
import { SSEChunkEvent } from 'happy-chat-kit';

export class MyCustomManager implements ChatUIManager {
  type = 'my_event';
  state = { data: '' };
  component = null;

  plugins = (instances: ChatUIManager[]) => ({
    onChunk: (data: string | Record<string, any>) => {
      this.state.data += data as string;
      return { content: this.state.data };
    },
    onError: () => {
      this.reset();
      return null;
    },
  });

  reset = () => {
    this.state.data = '';
  };
}
```

### 2. 实现自定义 Hook

```typescript
import { useHappyChatCore, useInstances } from 'happy-chat-kit';

export const useMyChat = ({ request }) => {
  const instances = useInstances();

  return useHappyChatCore({
    request,
    onChunk: (chunk, updater) => {
      // 自定义 chunk 处理逻辑
      const eventType = chunk.event?.trim();
      const data = JSON.parse(chunk.data || '{}');

      // 根据 eventType 路由到对应的 UIManager
      // ...

      updater({ content: newContent });
    },
  });
};
```

### 3. 配置 Provider

```tsx
import { ChatKit } from 'happy-chat-kit';
import { MyCustomManager } from './managers';

const chatKit = new ChatKit([new MyCustomManager()]);
export const Provider = chatKit.createProvider();
```

## 高级用法

### Props 校验

自定义组件可以添加 `validator` 静态方法进行 props 校验：

```tsx
import { z } from 'zod';

const PropsSchema = z.object({
  title: z.string(),
  items: z.array(z.object({ text: z.string() })),
});

const MyComponent: ComponentWithMeta<...> = (props) => {
  // ...
};

MyComponent.validator = (props) => {
  return PropsSchema.safeParse(props).success;
};
```

### 访问请求状态

自定义组件可以通过 `isRequesting` 函数获取当前请求状态：

```tsx
const MyComponent = ({ isRequesting, ...props }) => {
  const requesting = isRequesting();  // true or false

  return (
    <div className={requesting ? 'loading' : ''}>
      {/* ... */}
    </div>
  );
};
```

### 主动发送消息

自定义组件可以通过 `request2Agent` 方法主动触发新请求：

```tsx
const QuickReplies = ({ props, request2Agent }) => {
  const handleClick = (text) => {
    request2Agent?.(text);  // 发送新消息
  };

  return (
    <div>
      {props.options.map((opt) => (
        <button key={opt} onClick={() => handleClick(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
};
```

## 调试技巧

### 1. 查看 UIManager 实例

```tsx
const instances = useInstances();
console.log('Registered managers:', instances.map(i => i.type));
```

### 2. 追踪 Chunk 流

在 `onChunk` 回调中添加日志：

```typescript
const useMyChat = () => {
  return useHappyChatCore({
    onChunk: (chunk, updater) => {
      console.log('Received chunk:', chunk);
      // ...
    },
  });
};
```

### 3. 检查生成的 Directive 字符串

```typescript
const manager = new Answer();
console.log('Rendered directive:', manager.render?.());
```

## 最佳实践

1. **保持组件纯粹**：自定义组件应尽量保持纯展示逻辑，业务逻辑放在 Hook 或外部
2. **错误边界**：利用内置的 ErrorBoundary，不必担心组件渲染错误导致整个应用崩溃
3. **类型安全**：充分利用 TypeScript 类型定义，特别是 `ComponentWithMeta` 和 `ParsedHappyReactMarkdownComponentProps`
4. **性能优化**：大型列表考虑使用 `React.memo`，避免不必要的重渲染
5. **协议文档**：团队协作时，维护一份 SSE 协议文档，明确各 event type 的数据格式

---

至此，HappyChatKit 的架构深度解析已完成。通过三层架构的设计，HappyChatKit 实现了关注点分离、高度可扩展和良好的可测试性，为构建复杂的流式对话界面提供了坚实的基础。
