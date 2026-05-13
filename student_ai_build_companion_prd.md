# PRD｜面向 K-12 学生的 AI Build Companion

## 0. 产品一句话

一个面向 K-12 学生个人创作的 AI 项目实现伙伴。它不从课程、教师任务或编程知识点开始，而从学生自己的创作动机开始：学生只需要说“我想做一个……”，系统就帮助他把模糊想法转化为可执行的 milestone path，并在每个 milestone 中通过 live preview、小步 coding、视觉化 debugging 和轻量解释，帮助学生一边做出作品，一边理解它是如何运作的。

**核心表达：**

> From “I want to make…” to “I made it, and I know how it works.”

中文表达：

> 从“我想做一个……”到“我做出来了，而且我知道它怎么动起来的。”

---

## 1. 产品定位

### 1.1 产品不是

本产品不是一个强课堂绑定的 AI 编程助教。

它不是：

- 教师布置任务后，学生按课程步骤完成的课堂平台
- 以年级、课时、教学目标为入口的课程管理系统
- 一个让学生选择“我要学变量/循环/函数”的学习系统
- 一个直接替学生完成整个项目的 AI app builder
- 一个成人版 Cursor / Claude Code / Codex 的儿童皮肤版
- 一个“低价 API 中转站”

### 1.2 产品是

本产品是一个 **learning-supported vibe coding companion**。

它面向学生自发创作场景：

- 学生突然想做一个小游戏
- 学生想做一个网页
- 学生想做一个动画
- 学生想做一个互动故事
- 学生想做一个学习工具
- 学生想模仿某个他喜欢的数字作品
- 学生只有一个模糊想法，但不知道从哪里开始

产品的职责不是先判断“这个项目适不适合你”，而是帮助学生回答：

1. 这个想法可以变成什么样的项目？
2. 最小可运行版本是什么？
3. 可以拆成哪些清晰的小 milestone？
4. 每个 milestone 怎么判断完成？
5. 当前 milestone 的逻辑是什么？
6. 怎么通过代码做出第一个可见结果？
7. 运行后哪里不对？如何从现象定位 bug？
8. 当前完成后，下一步自然做什么？

### 1.3 核心原则

> 学习性要嵌入创作过程，而不是压在创作过程之上。

也就是说，产品不是把学生的创作冲动转化成“上课”，而是在学生制作过程中，轻轻加入计划、判断、解释、调试和迁移。

---

## 2. 背景与问题

### 2.1 现有成人 vibe coding 工具的问题

成人 vibe coding 工具通常追求：

```text
prompt → code → run → fix → ship
```

它们的目标是快速完成项目，适合已有判断力的开发者或成人用户。

但对于 K-12 学生，直接使用这类工具会出现几个问题：

1. 学生容易跳过问题拆解，直接要求 AI 完成整个项目。
2. 学生可能看到作品能跑，但不知道项目是如何实现的。
3. 代码生成过程是黑箱，学生难以建立 computational thinking。
4. debug 阶段容易变成“AI 自动修好”，学生看不到问题如何被定位。
5. 项目越做越复杂后，学生失去控制权，变成“AI 在做我的项目”。
6. 学生的 motivation 可能被繁重解释、表单和学习任务打断。

### 2.2 现有 K-12 编程学习工具的问题

传统 K-12 编程学习工具往往有较强的课程结构：

```text
lesson → concept → exercise → project
```

这适合课堂教学，但不一定适合学生自发创作。

学生真实的创作动机常常是：

```text
我想做一个……
```

而不是：

```text
我想学习变量、条件判断和事件监听。
```

因此，如果产品入口一开始就要求学生选择年级、学习目标、项目类型、课时、知识点，可能会过早消耗学生的创作冲动。

### 2.3 产品机会

我们要做的是介于两者之间的新形态：

| 类型 | 核心目标 | 问题 |
|---|---|---|
| 成人 vibe coding 工具 | 快速做出作品 | 学习脚手架弱 |
| 课堂编程学习平台 | 按课程学习概念 | 对自发创作支持弱 |
| 本产品 | 从学生想法出发，一边做一边理解 | 需要平衡 motivation 与 learning |

产品机会在于：

> 把 vibe coding 从“自然语言直接生成代码”改造成“学生创作动机驱动的项目实现路径”。

---

## 3. 目标用户

### 3.1 核心用户

K-12 学生，尤其是：

- 有创作冲动但不知道如何开始的学生
- 对游戏、网页、动画、互动故事、工具类项目感兴趣的学生
- 已经接触过 Scratch、Python、p5.js、HTML/CSS/JavaScript 或类似工具，但还不能独立规划项目的学生
- 没有强编程基础，但愿意通过做项目学习的学生
- 不一定在课堂中使用，而是在课后、周末、兴趣活动、自主学习中使用

### 3.2 次级用户

虽然产品不强绑定课堂和教师，但未来仍可能服务：

- 家长：希望孩子做有创造性的技术项目
- 课外编程机构：作为项目制创作工具
- 学校教师：可选使用，不作为核心入口
- 青少年创客空间：支持学生自由项目

### 3.3 用户心态

学生使用产品时，最重要的心理状态通常不是“我要学习编程”，而是：

- 我想把脑子里的东西做出来
- 我想做一个可以玩的东西
- 我想模仿一个我喜欢的游戏/网站/动画
- 我想让别人看到我的作品
- 我想马上看到它动起来
- 我不知道第一步怎么做

因此，产品必须保护 motivation window。

---

## 4. 核心用户痛点

### 4.1 想法模糊

学生常常只有一个模糊起点：

- 我想做一个跑酷游戏
- 我想做一个宠物养成游戏
- 我想做一个 AI 聊天角色
- 我想做一个海洋生态系统动画
- 我想做一个帮我背单词的小游戏

但他们不知道：

- 这个项目要分几步做
- 第一版应该做多小
- 哪些功能先做，哪些功能后做
- 每一步需要什么代码逻辑
- 怎样判断这一步完成了

### 4.2 直接 coding 容易失控

如果系统直接生成完整代码，学生会遇到：

- 代码太长，看不懂
- 出现 bug 不知道哪里错
- 修改一个地方影响其他地方
- 项目越来越不像自己想的
- AI 加了很多自己没有要求的功能
- 学生变成“看 AI 操作”，而不是“自己制作”

### 4.3 学习活动太重会破坏动机

如果每一步都要求学生写大量解释、反思、概念总结，会导致：

- 学生觉得像在做作业
- 制作节奏被打断
- 原本的创作兴奋消失
- 学生为了完成解释而不是为了理解而回答

因此，解释与反思必须轻量，且服务于当前制作。

### 4.4 bug 不直观

对于 K-12 学生来说，bug 最容易被理解的方式不是：

```text
TypeError: Cannot read properties of undefined
```

而是：

- 按钮点了没反应
- 角色跳起来不落下
- 分数变成 NaN
- 障碍物不出现
- 页面乱掉了
- 游戏一开始就结束

因此，live preview / deployment 不是附属功能，而是 debugging 和学习的核心界面。

---

## 5. 设计目标

### 5.1 产品目标

1. 帮助学生从模糊 idea 生成清晰 project path。
2. 把项目拆成边界清楚、可运行、可预览的小 milestone。
3. 每个 milestone 都有轻量 done checklist。
4. 在 coding 前提供简短 logic sketch。
5. 通过 feature coding cycle 支持小步制作。
6. 通过 live preview 让学生直接看到结果和 bug。
7. 通过视觉化 debugging 从现象定位问题。
8. 通过 mini-explain 帮助学生知道“刚刚做了什么”。
9. 通过 next milestone question 保持创作动能。

### 5.2 学习目标

产品不要求学生显性选择学习目标，但系统内部应能识别并记录学生正在接触的知识与技能，例如：

- event
- variable
- condition
- loop
- function
- state
- coordinate
- animation
- user input
- collision
- data storage
- UI layout
- feedback logic
- debugging strategy

这些知识点不作为入口表单，而是作为系统内部的 scaffolding 和后续推荐依据。

### 5.3 体验目标

学生应该感觉：

- AI 在帮我把想法做出来
- 这个项目还是我的
- 我知道下一步该做什么
- 每一步都有可见结果
- bug 是可以被看见和修复的
- 我不用先学一大堆概念，也能开始
- 但我做完以后，确实比之前更懂一点

---

## 6. 总体产品链路

原始理论链路：

```text
goal → plan → criteria → logic → code → test → explain → reflect → transfer
```

产品化后的学生体验链路：

```text
idea → path → milestone → done checklist → logic sketch → build → preview/test → fix → mini-explain → next milestone
```

### 6.1 阶段说明

| 阶段 | 学生看到的表达 | 系统实际做的事 |
|---|---|---|
| idea | 我想做一个…… | 捕捉学生动机与项目方向 |
| path | 我们可以这样一步步做 | 生成项目路线图 |
| milestone | 先完成这个小目标 | 拆分小而清晰的开发阶段 |
| done checklist | 做到这些就算完成 | 建立当前 milestone 的完成标准 |
| logic sketch | 这个功能大概这样工作 | 用轻量方式解释运行逻辑 |
| build | 我们来做这个功能 | 小步生成或修改代码 |
| preview/test | 运行看看 | 在 live preview 中观察结果 |
| fix | 看哪里不对 | 从现象出发 debug |
| mini-explain | 刚刚我们让它多了什么能力？ | 轻量检查理解 |
| next milestone | 下一步做什么？ | 连接下一阶段，保持 momentum |

---

## 7. 核心功能模块

## 7.1 Module A：Idea Input / 极简入口

### 功能目标

让学生直接表达自己的创作想法，不要求先填写年级、项目类型、学习目标或课时。

### 入口文案

主输入框：

```text
What do you want to make?
你想做什么？
```

辅助入口：

```text
我已经有想法了
我有一点想法，但说不清
我想看看别人做了什么
```

### 设计原则

- 不要求选择年级
- 不要求选择项目类型
- 不要求选择学习目标
- 不要求选择课时
- 不要求一开始说清楚所有需求
- 允许非常模糊的输入
- 允许学生用自然语言、关键词、草图描述项目

### 输入示例

```text
我想做一个恐龙逃跑游戏
```

```text
我想做一个能帮我背单词的小游戏
```

```text
我想做一个会动的海洋生态系统
```

```text
我想做一个班级投票网站
```

```text
我想做一个像宝可梦一样的小游戏
```

### 系统行为

系统不直接生成完整项目，而是进入轻量澄清。

---

## 7.2 Module B：Light Clarification / 轻量澄清

### 功能目标

通过 2–3 个问题快速把学生的模糊 idea 变成可规划项目。

### 设计原则

- 问题数量少
- 优先使用选项
- 允许自由输入
- 问题必须服务于下一步规划
- 不问过于抽象或课程化的问题

### 示例

学生输入：

```text
我想做一个恐龙逃跑游戏
```

系统回应：

```text
太好了。我们可以先把它做成一个能玩的最小版本。

我理解你的想法是：
玩家控制一只恐龙，躲开障碍物，跑得越久分数越高。

你想让它更像哪一种？

A. 像 Chrome 小恐龙：按空格跳跃
B. 像跑酷游戏：左右移动躲障碍
C. 像剧情游戏：选择路线逃跑
D. 我想自己说
```

### 可选问题类型

1. 作品类型问题

```text
这个项目更像：
A. 游戏
B. 动画
C. 网页
D. 工具
E. 我不确定
```

2. 交互方式问题

```text
用户主要怎么操作？
A. 点击
B. 拖动
C. 按键盘
D. 输入文字
E. 选择选项
```

3. 最小版本问题

```text
如果先做一个最小版本，你最想先看到什么？
A. 一个角色动起来
B. 一个按钮能用
C. 一个页面出现
D. 一个问题能被回答
E. 一个简单游戏规则能跑
```

### 输出

生成 Project Path。

---

## 7.3 Module C：Project Path Generator / 项目路线生成

### 功能目标

将学生的 idea 转化为一个可执行的 milestone path。

### 核心要求

每个 milestone 必须：

1. 边界清晰
2. 不过大
3. 有可见结果
4. 能在 live preview 中验证
5. 只引入少量新概念
6. 自然连接下一个 milestone

### Project Path 示例

学生项目：恐龙逃跑游戏

```text
Project Path：恐龙逃跑游戏

最终效果：
一只恐龙在地面上奔跑，玩家按空格跳过障碍物，碰到障碍物会失败，跑得越久分数越高。

Milestone 1：画出恐龙和地面
你会做出：屏幕上出现一只恐龙，站在地面上。
你会用到：画面、位置、角色。

Milestone 2：让恐龙按空格跳起来
你会做出：按空格时，恐龙跳起再落下。
你会用到：键盘事件、速度、重力。

Milestone 3：让障碍物从右边出现
你会做出：仙人掌从右往左移动。
你会用到：循环、位置变化。

Milestone 4：判断碰撞
你会做出：恐龙碰到仙人掌时游戏失败。
你会用到：条件判断、碰撞检测。

Milestone 5：加分数和重新开始
你会做出：分数增加，失败后可以重玩。
你会用到：变量、游戏状态。
```

### Project Path UI

建议用路线图或卡片流呈现：

```text
[1 画出角色] → [2 让角色跳跃] → [3 加障碍物] → [4 碰撞失败] → [5 分数重玩]
```

每个 milestone card 包含：

- milestone 名称
- 可见结果
- 预计要做的东西
- 可能用到的概念
- 当前状态：未开始 / 正在做 / 已完成 / 需要修复

### 学生操作

学生可以：

- 接受路径
- 调整 milestone 顺序
- 删除某个 milestone
- 添加自己想要的 milestone
- 把某个 milestone 拆小
- 让 AI 解释为什么建议这样分

### 关键限制

系统不能一口气生成完整项目代码。

系统应默认从 Milestone 1 开始，除非学生明确选择其他 milestone。

---

## 7.4 Module D：Milestone Done Checklist / 完成条件

### 功能目标

为每个 milestone 生成清晰、轻量、可观察的完成条件。

不要叫 rubric，不要叫 assessment criteria。学生端叫：

```text
Done when...
完成条件
```

### 示例

Milestone 2：让恐龙按空格跳起来

```text
完成条件：
□ 按空格时，恐龙会向上移动
□ 恐龙不会一直飞走，会落回地面
□ 恐龙落地后，可以再次跳
□ 不按空格时，恐龙保持在地面上
```

### 设计原则

- 每个 checklist 3–5 条
- 每条都能在 preview 中观察
- 避免抽象描述
- 不要像评分表
- 不要一开始加入过多知识术语
- 允许学生调整偏好

### 学生参与

系统可以问一个轻量定制问题：

```text
你想让恐龙跳得：
A. 低一点，比较真实
B. 高一点，比较夸张
C. 我想自己输入高度
```

这个过程实际上是在 co-construct criteria，但学生感觉是在定制作品。

---

## 7.5 Module E：Logic Sketch / 轻量逻辑草图

### 功能目标

在 coding 前，用短句和简单图示帮助学生理解当前功能如何工作。

### 设计原则

- 不长篇讲概念
- 不强行上课
- 不要求学生写复杂解释
- 只解释当前 milestone 必须理解的运行逻辑
- 尽量用“动作链”表达

### 示例

Milestone 2：让恐龙跳起来

```text
这个跳跃功能大概这样工作：

玩家按下空格
→ 恐龙获得一个向上的速度
→ 每一帧，重力把恐龙往下拉
→ 如果恐龙碰到地面，就停止下落
```

图示：

```text
[Space key]
    ↓
[jump speed]
    ↓
[gravity pulls down]
    ↓
[land on ground]
```

### 可选交互

在进入 coding 前，系统可以问一个轻量 prediction：

```text
如果没有“重力”这一步，恐龙可能会怎样？

A. 跳起来后一直飞走
B. 自动变成红色
C. 游戏马上结束
```

注意：此类问题应短、轻、服务于制作，不应给学生造成考试感。

---

## 7.6 Module F：Feature Coding Cycle / 小步制作循环

### 功能目标

吸收 PRIMM 思想，但不在学生端显性称为 PRIMM。学生端可以叫：

```text
Guess → Try → Look → Change → Build
```

### PRIMM 转译

| PRIMM | 学生端表达 | 产品行为 |
|---|---|---|
| Predict | Guess | 先猜一下会发生什么 |
| Run | Try | 运行预览 |
| Investigate | Look | 看代码与画面的关系 |
| Modify | Change | 改一小处 |
| Make | Build | 做成自己的版本 |

### 标准循环

```text
1. AI 提出当前小功能
2. 学生做一个轻量预测或选择
3. AI 生成小 patch
4. 系统显示 change summary
5. 学生运行 preview
6. 学生观察是否符合 done checklist
7. 如果成功，学生进行一个小修改
8. 如果失败，进入 visual debugging
9. 完成后 mini-explain
10. 连接到下一个 milestone
```

### 示例

AI：

```text
我们现在要做：按空格让恐龙跳起来。

Before we code:
你觉得按空格后，恐龙应该发生什么？

A. 立刻向上跳，然后落下
B. 慢慢变大
C. 消失再出现
```

学生选择 A。

AI：

```text
好，我们先做一个小版本。
这次我只会添加跳跃相关的代码，不会改其他功能。
```

系统展示 change summary：

```text
这次会改动：
- 添加一个 jump speed
- 监听空格键
- 让恐龙每一帧受到 gravity 影响
```

然后生成代码或 patch。

### 代码展示原则

学生端不应只看到大段代码。建议提供三种视图：

1. Preview-first view：默认显示作品运行效果。
2. Change summary：用自然语言总结改了什么。
3. Code view：可展开，显示实际代码。

对于低龄学生，默认隐藏完整代码；对于更有兴趣的学生，可以展开查看。

---

## 7.7 Module G：Live Preview / Deployment Surface

### 功能目标

让每次 coding 都能立刻看到运行结果；让 bug 以可观察现象出现，而不是只以错误日志出现。

### 为什么重要

Live Preview 是本产品的核心学习表面。

学生通过 preview 理解：

- 功能是否实现
- bug 出在哪里
- 改动产生了什么效果
- 代码与画面之间的关系
- 当前 milestone 是否完成

### UI 建议

主界面建议三栏布局：

```text
左栏：Project Path / Milestones
中间：Live Preview
右栏：AI Build Companion
底部：Code / Changes / Console，可折叠
```

中间 Live Preview 应始终保持核心位置。

### Preview 功能

- Run / Stop / Restart
- Auto-refresh after patch
- Version history
- Screenshot bug capture
- Highlight changed behavior
- Compare before / after
- Share preview link
- Fullscreen play mode
- Console 可折叠

### Deployment 功能

产品应支持学生随时获得一个可运行链接：

```text
Share my project
复制链接
全屏试玩
```

这里的 deployment 不一定是正式生产部署，但必须让学生感受到作品真的可以被打开、试玩和分享。

---

## 7.8 Module H：Visual Debugging / 视觉化调试

### 功能目标

从运行现象出发帮助学生理解和修复 bug。

### 设计原则

- 先描述看到的现象
- 再让学生猜测可能原因
- 再定位相关逻辑或代码
- 最后提供小修复
- 不直接黑箱修好

### Debugging Flow

```text
1. 观察现象
2. 选择可能原因
3. 系统解释原因
4. 展示相关代码或逻辑
5. 提供修复建议
6. 学生选择：看解释 / 应用 / 自己改
7. 运行 preview 验证
```

### 示例：角色跳起来不落下

系统观察：

```text
我看到一个问题：
恐龙跳起来之后没有落回地面。
```

系统提问：

```text
你觉得问题可能在哪里？

A. 空格键没有被识别
B. 恐龙有向上的速度，但没有被拉下来
C. 地面颜色不对
```

学生选择 B。

系统解释：

```text
对，更可能是 B。
现在恐龙会向上动，但我们还没有让 gravity 每一帧把它拉下来。
```

修复建议：

```text
我建议加上这一点：
每一帧，让 vertical speed 增加一点 gravity。

这样恐龙会先上升，然后慢慢落下。
```

操作：

```text
[看代码变化] [应用修复] [我想自己改]
```

### Debugging 不同类型

1. Interaction bug

- 按钮没反应
- 键盘输入无效
- 拖动不起作用

2. Motion bug

- 角色不动
- 角色飞走
- 角色抖动
- 障碍物速度异常

3. State bug

- 分数不变
- 分数变 NaN
- 游戏状态不切换
- 失败后无法重玩

4. Layout bug

- 元素挤在一起
- 按钮超出屏幕
- 文字看不清

5. Logic bug

- 答对却显示错误
- 碰撞判断太早或太晚
- 条件永远不触发

### 关键要求

Debugging 必须依赖 live preview，而不是只依赖 console。

---

## 7.9 Module I：Mini Explain / 轻量解释

### 功能目标

在 milestone 或关键改动完成后，用非常轻的方式帮助学生确认自己理解了“刚刚发生了什么”。

### 设计原则

- 不写长反思
- 不做大段解释题
- 不打断创作节奏
- 一次只问一个问题
- 问题应服务于下一步制作

### 题型

1. 选择题

```text
这一步我们主要让项目多了什么能力？

A. 屏幕上出现角色和地面
B. 让角色跳起来
C. 让游戏结束
```

2. 一句话解释

```text
用一句话说：这次改动让项目多了什么能力？
```

3. 点击对应

```text
点击你认为负责“跳起来”的那一小段代码。
```

4. 预测下一步

```text
如果我们接下来要加障碍物，你觉得需要先做什么？

A. 让一个物体从右边移动过来
B. 改恐龙颜色
C. 删除地面
```

### 何时触发

- 每个 milestone 完成后
- 关键 bug 修复后
- 学生连续多次让 AI 自动生成后
- 进入下一个 milestone 前

### 不应触发

- 学生刚刚输入创作想法时
- 学生正在高兴试玩时
- 学生频繁修改视觉样式时
- 学生明显处于高 momentum 状态时

---

## 7.10 Module J：Next Milestone Bridge / 下一步连接

### 功能目标

把当前完成的内容自然连接到下一个 milestone，保持创作 momentum。

### 示例

Milestone 2 完成：恐龙可以跳。

系统：

```text
现在恐龙已经能跳起来了。

下一步要让它更像跑酷游戏，你想先做什么？

A. 加一个从右边移动过来的仙人掌
B. 加分数
C. 加背景移动
D. 我想自己说
```

### 设计原则

- 不强制反思
- 不要求写学习总结
- 把“反思”转化为“下一步选择”
- 让学生感觉项目正在成长

---

## 8. 用户流程

## 8.1 首次完整流程

```text
1. 学生打开产品
2. 输入：我想做一个……
3. AI 进行 2–3 个轻量澄清
4. AI 生成 Project Path
5. 学生确认或调整 path
6. 系统默认进入 Milestone 1
7. AI 生成 Done Checklist
8. AI 展示 Logic Sketch
9. 学生做一个轻量 Guess
10. AI 生成小 patch
11. 学生运行 Live Preview
12. 系统帮助检查 checklist
13. 如果出现 bug，进入 Visual Debugging
14. 如果完成，进行 Mini Explain
15. 系统连接到下一个 milestone
```

## 8.2 Returning User 流程

```text
1. 学生打开已有项目
2. 系统显示当前 Project Path 和进度
3. 系统提示：你上次完成了 X，现在可以继续 Y
4. 学生选择继续当前 milestone 或进入下一个 milestone
5. 进入 feature coding cycle
```

系统文案示例：

```text
欢迎回来。
你上次已经完成了：恐龙可以跳起来。

现在可以继续：让仙人掌从右边出现。
```

## 8.3 学生偏离原计划

学生可能在 Milestone 2 中突然说：

```text
我想先给恐龙换成机器人
```

系统不应拒绝，而应轻量处理：

```text
可以，这是一个外观改动，不会影响我们正在做的跳跃功能。

你想：
A. 现在换外观
B. 先完成跳跃，再换外观
C. 把“换成机器人”加入后面的 polish step
```

### 原则

- 不强行压制学生创意
- 但帮助学生理解主线与支线
- 避免项目失控

---

## 9. 信息架构

### 9.1 主界面

建议结构：

```text
┌─────────────────────────────────────────────┐
│ Top Bar: Project Name / Save / Share / Help │
├───────────────┬────────────────┬────────────┤
│ Project Path  │  Live Preview   │ AI Companion│
│ Milestones    │  Run Surface    │ Chat/Guide │
│ Checklist     │                │            │
├───────────────┴────────────────┴────────────┤
│ Bottom Drawer: Code / Changes / Console     │
└─────────────────────────────────────────────┘
```

### 9.2 左栏：Project Path

内容：

- 项目名称
- 当前 milestone
- Milestone list
- Done Checklist
- Progress status

状态：

- Not started
- In progress
- Needs fix
- Done

### 9.3 中间：Live Preview

内容：

- 运行画面
- Run / Stop / Restart
- Fullscreen
- Share
- Bug capture
- Before / after compare

### 9.4 右栏：AI Build Companion

内容：

- 当前引导
- 选项问题
- 学生输入
- 建议
- 小解释
- 下一步

### 9.5 底部：Code / Changes / Console

默认折叠。

Tabs：

- Changes：这次改了什么
- Code：实际代码
- Console：错误日志
- History：版本记录

低龄用户默认显示 Changes，不默认显示完整 Code。

---

## 10. Agent 行为设计

### 10.1 Agent 总体角色

Agent 不是教师，不是监工，也不是代工者。

Agent 是：

> 一个懂编程、懂项目拆解、懂孩子创作动机、不会抢走作品控制权的制作伙伴。

### 10.2 Agent 核心规则

1. 不直接完成整个项目。
2. 先把 idea 拆成 path。
3. 每次只处理一个 milestone。
4. 每次只改动当前 milestone 所需代码。
5. 尽量保持学生原始创意。
6. 不主动添加学生未要求的大功能。
7. 遇到 bug 时先描述现象，再定位原因。
8. 解释要短，服务于制作。
9. 每个 milestone 完成后连接下一步。
10. 保护学生 motivation 优先于展示教学完整性。

### 10.3 Agent 内部模块

| 模块 | 学生端角色名 | 内部职责 |
|---|---|---|
| Idea Buddy | 想法伙伴 | 理解模糊想法，轻量澄清 |
| Path Builder | 路线规划器 | 生成 milestone path |
| Milestone Coach | 里程碑伙伴 | 处理当前 milestone |
| Build Agent | 制作助手 | 生成小 patch |
| Preview Agent | 预览检查员 | 检查运行结果 |
| Fix Agent | 修复伙伴 | 从现象出发 debug |
| Next-Step Agent | 下一步推荐器 | 连接下一个 milestone |

### 10.4 Agent 状态机

```text
IDEA_CAPTURED
→ CLARIFYING
→ PATH_GENERATED
→ PATH_CONFIRMED
→ MILESTONE_SELECTED
→ CHECKLIST_GENERATED
→ LOGIC_SKETCHED
→ READY_TO_BUILD
→ PATCH_PROPOSED
→ PATCH_APPLIED
→ PREVIEW_RUNNING
→ NEEDS_DEBUG / MILESTONE_DONE
→ MINI_EXPLAIN
→ NEXT_MILESTONE
```

### 10.5 关键“学习刹车”

产品不是完全自由生成器，因此需要轻量刹车：

```text
No path, no full project.
没有路径，不生成完整项目。

No milestone, no coding.
没有当前 milestone，不开始 coding。

No visible result, no done.
没有可见结果，不标记完成。

No heavy reflection.
不做重反思。

Always next step.
每次解释后都连接下一步。
```

---

## 11. Prompt / Instruction 草案

### 11.1 System Instruction 草案

```text
You are an AI build companion for K-12 students.
Your goal is to help students turn their own project ideas into working digital creations while preserving their motivation, agency, and understanding.

Core rules:
- Do not directly complete the entire project.
- Do not force students to choose grade, lesson length, or learning objectives at entry.
- Start from the student's own idea.
- If the idea is vague, ask only 2–3 lightweight clarification questions.
- Turn the idea into a milestone-based project path.
- Each milestone must be small, visible, and testable in live preview.
- For each milestone, create a short done checklist.
- Before coding, show a short logic sketch.
- Code in small patches only.
- After each patch, encourage the student to run and observe the live preview.
- When debugging, start from visible behavior, not error logs.
- Explanations must be short and useful for the current build.
- Avoid long reflections unless the student asks.
- After a milestone is completed, connect it to the next milestone.
- Always protect the student's creative momentum.

Tone:
- Encouraging
- Clear
- Not childish
- Not overly academic
- Not teacher-like
- More like a helpful project partner
```

### 11.2 Path Generation Prompt 草案

```text
Given the student's project idea, generate a milestone-based project path.

Requirements:
- Do not generate code yet.
- Create 4–6 milestones.
- Each milestone must have a visible output.
- Each milestone should be small enough to complete in one build cycle.
- Start with a minimum playable or visible version.
- Mention concepts lightly, without making them feel like a lesson.
- Use student-friendly language.
- Preserve the student's original idea.
- Do not add large features not requested by the student.
```

### 11.3 Milestone Prompt 草案

```text
For the selected milestone, generate:
1. A short milestone goal.
2. A done checklist with 3–5 visible criteria.
3. A simple logic sketch.
4. One lightweight prediction question.
5. A small build plan.

Do not write code until the student confirms or answers the prediction question.
```

### 11.4 Debug Prompt 草案

```text
When a bug appears, respond in this order:
1. Describe the visible behavior in plain language.
2. Ask the student to choose a likely cause from 2–3 options.
3. Explain the likely cause briefly.
4. Show the smallest relevant code or logic area.
5. Propose a small fix.
6. Let the student choose: see explanation, apply fix, or try themselves.
7. After applying, ask the student to run preview again.

Do not silently fix the bug without explaining the visible cause.
```

---

## 12. Milestone 质量标准

### 12.1 好的 milestone

一个好的 milestone 应该：

- 有清楚边界
- 有一个可见成果
- 可以独立运行或验证
- 不包含太多功能
- 不需要学生一次理解太多概念
- 能自然连接下一步

### 12.2 示例

坏 milestone：

```text
完成游戏核心逻辑
```

问题：太大，不可观察，边界模糊。

好 milestone：

```text
按空格后，恐龙跳起并落回地面
```

原因：可观察、可测试、边界清晰。

坏 milestone：

```text
制作完整背单词系统
```

好 milestone：

```text
显示一个英文单词，并让玩家选择对应中文意思
```

坏 milestone：

```text
做一个海洋生态系统
```

好 milestone：

```text
让三种海洋生物在屏幕中缓慢移动
```

---

## 13. 项目类型支持

虽然入口不要求学生选择项目类型，但系统内部需要识别项目类型，以便生成合适路径。

### 13.1 初期建议支持类型

1. Simple game

- 跑酷游戏
- 接物游戏
- 问答游戏
- 迷宫游戏
- 点击反应游戏

2. Interactive story

- 分支故事
- 角色对话
- 选择结局

3. Animation / simulation

- 生态系统动画
- 天气模拟
- 星球运动
- 生物运动

4. Learning tool

- 背单词小游戏
- 数学练习器
- quiz app
- flashcard tool

5. Simple website

- 个人主页
- 班级投票页
- 作品展示页
- 兴趣介绍页

### 13.2 初期不建议重点支持

- 大型多人在线游戏
- 复杂 3D 游戏
- 涉及真实支付的产品
- 涉及外部账号系统的复杂应用
- 高风险社交产品
- 需要复杂后端安全设计的系统

对于过大项目，系统应帮助学生缩小为 minimum version，而不是直接拒绝。

示例：

```text
这个想法很大。我们可以先做一个小版本：
先让一个玩家在本地完成核心玩法，之后再考虑多人功能。
```

---

## 14. Live Preview 技术要求

### 14.1 基础要求

- 支持即时运行
- 支持自动刷新
- 支持错误捕捉
- 支持 preview link
- 支持版本回滚
- 支持 before / after 对比

### 14.2 运行环境建议

MVP 阶段建议优先支持：

- HTML/CSS/JavaScript
- p5.js
- simple React sandbox
- block-like abstraction for younger learners

不建议 MVP 一开始支持过多语言。

### 14.3 安全要求

- 沙箱运行学生代码
- 禁止任意网络请求或默认限制外部请求
- 禁止暴露 API keys
- 限制文件系统访问
- 限制危险脚本
- 支持内容安全审查
- 支持项目公开/私密设置

---

## 15. Versioning / History

### 15.1 为什么重要

学生在 AI 帮助下制作项目时，很容易出现：

- AI 改坏了
- 学生想回到之前版本
- 某个功能完成后希望保存
- debug 过程中需要比较前后差异

### 15.2 功能需求

- 每次 patch 自动生成 checkpoint
- milestone 完成时生成 named checkpoint
- 支持 rollback
- 支持 before / after preview
- 支持 change summary

### 15.3 学生端文案

```text
已保存一个版本：恐龙可以跳起来
```

```text
这个修改让项目出问题了。要回到上一个能运行的版本吗？
```

---

## 16. Motivation Protection 机制

### 16.1 需要保护的时刻

- 学生刚输入想法时
- 学生第一次看到作品运行时
- 学生正在试玩时
- 学生主动提出创意修改时
- 学生遇到 bug 但还没有挫败时

### 16.2 应避免的行为

- 一开始要求填复杂表单
- 一开始解释大量编程概念
- 频繁要求反思
- 频繁纠正学生想法
- 过早说“这个太难”
- 用课程语言压过创作语言
- AI 自作主张添加很多功能

### 16.3 应鼓励的行为

- 快速把想法变成路径
- 尽快让学生看到第一个可运行结果
- 保留学生的命名、角色和风格
- 把困难项目缩小，而不是否定
- 把解释压缩成当前需要的一小点
- 每次完成后推荐一个自然下一步

---

## 17. 轻量学习记录

虽然产品不强绑定教师，但可以为学生自己保留轻量学习记录。

### 17.1 记录内容

- 我做了什么项目
- 我完成了哪些 milestone
- 我学会/用到了哪些概念
- 我修复过哪些 bug
- 我做过哪些关键决定
- 我分享了哪个版本

### 17.2 展示方式

不要叫“学习档案”太正式，可以叫：

```text
My Build Journey
我的制作路线
```

### 17.3 示例

```text
这个项目里，你已经完成：
✓ 画出角色和地面
✓ 让角色按空格跳起来
✓ 修复了“角色飞走不落下”的 bug

你用到过：
- keyboard event
- position
- speed
- gravity
```

### 17.4 用途

- 帮学生回顾
- 帮系统推荐下一步
- 未来可作为作品展示的一部分
- 可选分享给家长或老师

---

## 18. MVP 范围

### 18.1 MVP 目标

验证以下核心假设：

1. 学生愿意从“我想做一个……”开始与 AI 共创。
2. LLM 可以把模糊 idea 稳定拆成小 milestone。
3. 小 milestone + live preview 可以维持学生 motivation。
4. 学生可以接受轻量 done checklist 和 mini explain。
5. Visual debugging 比纯错误日志更适合 novice learners。

### 18.2 MVP 必做功能

1. Idea input
2. Light clarification
3. Project Path generation
4. Milestone selection
5. Done checklist
6. Logic sketch
7. Small patch coding
8. Live preview
9. Visual debugging basic flow
10. Mini explain
11. Next milestone bridge
12. Version checkpoint

### 18.3 MVP 可暂缓功能

- 教师 dashboard
- 家长 dashboard
- 多人协作
- 完整课程系统
- 高级知识图谱
- 多语言编程环境
- 完整 block-based editor
- 大规模作品社区
- AI 自动评分

### 18.4 MVP 推荐技术路径

前端：

- React / Next.js
- 三栏式 workspace
- iframe preview
- Monaco editor 可选

运行环境：

- HTML/CSS/JS sandbox
- p5.js sandbox
- WebContainer 或类似轻量运行环境

后端：

- Node.js / Python agent orchestrator
- LLM API integration
- project state storage
- patch generation and validation

数据库：

- users
- projects
- milestones
- checkpoints
- chat/build events
- learning trace

---

## 19. 数据结构草案

### 19.1 Project

```json
{
  "project_id": "string",
  "owner_id": "string",
  "title": "Dinosaur Runner",
  "original_idea": "我想做一个恐龙逃跑游戏",
  "project_type_inferred": "game",
  "current_milestone_id": "m2",
  "status": "in_progress",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 19.2 Milestone

```json
{
  "milestone_id": "m2",
  "project_id": "string",
  "title": "让恐龙按空格跳起来",
  "visible_output": "按空格时，恐龙跳起再落下",
  "concepts": ["keyboard event", "speed", "gravity"],
  "done_checklist": [
    "按空格时，恐龙会向上移动",
    "恐龙不会一直飞走，会落回地面",
    "恐龙落地后，可以再次跳"
  ],
  "status": "in_progress"
}
```

### 19.3 Build Event

```json
{
  "event_id": "string",
  "project_id": "string",
  "milestone_id": "m2",
  "event_type": "patch_applied",
  "summary": "添加跳跃速度和重力",
  "student_action": "confirmed",
  "ai_action": "generated_patch",
  "created_at": "datetime"
}
```

### 19.4 Checkpoint

```json
{
  "checkpoint_id": "string",
  "project_id": "string",
  "milestone_id": "m2",
  "name": "恐龙可以跳起来",
  "files_snapshot": {},
  "preview_url": "string",
  "created_at": "datetime"
}
```

---

## 20. 成功指标

### 20.1 用户行为指标

- idea input 到 path generated 的完成率
- path generated 到 milestone 1 started 的转化率
- milestone 1 完成率
- live preview 运行次数
- debug 后继续制作率
- project checkpoint 数量
- 项目分享率
- 次日/七日回访率

### 20.2 学习相关指标

不要用重测试作为核心指标。可以轻量记录：

- 学生是否能完成 mini explain
- 学生是否能从 bug 现象选择可能原因
- 学生是否能修改一个参数并观察效果
- 学生是否能连接到下一个 milestone
- 学生是否逐渐减少“直接帮我做完”的请求

### 20.3 Motivation 指标

- 学生是否连续完成多个 milestone
- 学生是否主动提出新功能
- 学生是否回到项目继续做
- 学生是否愿意分享作品
- 学生是否在 bug 后仍继续尝试

---

## 21. 风险与缓解

### 21.1 风险：AI 直接代做

缓解：

- 禁止完整项目一次性生成
- 强制 milestone path
- patch 小步生成
- 每次改动显示 change summary
- 关键节点 mini explain

### 21.2 风险：学习活动太重

缓解：

- explain/reflect 轻量化
- 一次只问一个问题
- 用选择题/一句话/点击对应替代长反思
- 解释后必须连接下一步

### 21.3 风险：项目过大导致失败

缓解：

- 生成 minimum version
- 大功能自动拆小
- 告诉学生“我们先做小版本”
- 将复杂功能加入 later path

### 21.4 风险：学生失去作品控制权

缓解：

- AI 不主动添加未请求大功能
- 允许学生拒绝/修改 AI 建议
- 每次 patch 前说明改动范围
- 支持 rollback

### 21.5 风险：安全与隐私

缓解：

- 沙箱运行
- 限制外部网络
- 不暴露 API key
- 内容安全过滤
- 分享链接权限控制
- 对低龄用户提供家长同意机制

---

## 22. 设计语气与文案原则

### 22.1 语气

- 鼓励
- 清楚
- 不幼稚
- 不学术化
- 不像老师训话
- 像一个靠谱的制作伙伴

### 22.2 避免文案

避免：

```text
现在请选择你的年级和学习目标。
```

改为：

```text
你想做什么？我们可以先做一个小版本。
```

避免：

```text
请反思你在本阶段学到了哪些计算思维概念。
```

改为：

```text
这一步让你的项目多了什么能力？
```

避免：

```text
这个项目太复杂，不适合你。
```

改为：

```text
这个想法很大。我们先做一个能跑起来的小版本。
```

### 22.3 推荐文案

```text
我们先做最小可玩的版本。
```

```text
这一步只改一个小地方。
```

```text
先运行看看它现在会怎样。
```

```text
我看到一个问题：按钮点了没有反应。
```

```text
这可能不是你的想法错了，而是这个功能还少了一步连接。
```

```text
现在它已经能动起来了。下一步你想让它更像什么？
```

---

## 23. 示例完整用户旅程

### Step 1：Idea

学生：

```text
我想做一个恐龙逃跑游戏
```

AI：

```text
太好了。我们可以先把它做成一个能玩的最小版本。

我理解你的想法是：
玩家控制一只恐龙，躲开障碍物，跑得越久分数越高。

你想让它更像哪一种？

A. 像 Chrome 小恐龙：按空格跳跃
B. 像跑酷游戏：左右移动躲障碍
C. 像剧情游戏：选择路线逃跑
D. 我想自己说
```

### Step 2：Path

学生选 A。

AI：

```text
Project Path：恐龙逃跑游戏

Milestone 1：画出恐龙和地面
Milestone 2：让恐龙按空格跳起来
Milestone 3：让仙人掌从右边移动过来
Milestone 4：碰到仙人掌就失败
Milestone 5：加分数和重新开始
```

### Step 3：Milestone 1

AI：

```text
我们先做 Milestone 1：画出恐龙和地面。

完成条件：
□ 屏幕上有一只恐龙
□ 恐龙站在地面上
□ 点击 Run 后能看到画面
```

Logic Sketch：

```text
这一步的逻辑很简单：
创建一个画面
→ 放上地面
→ 把恐龙放在地面上
```

AI 生成小 patch。

学生运行 preview。

### Step 4：Mini Explain

AI：

```text
这一步我们主要做了什么？

A. 让屏幕上出现角色和地面
B. 让恐龙跳起来
C. 让游戏结束
```

学生选择 A。

AI：

```text
对。现在你的游戏已经有了第一个可见画面。
下一步建议：让恐龙按空格跳起来。
```

### Step 5：Milestone 2 + Debug

学生进入 Milestone 2。

AI：

```text
完成条件：
□ 按空格时，恐龙会向上移动
□ 恐龙不会一直飞走，会落回地面
□ 恐龙落地后，可以再次跳
```

Logic Sketch：

```text
玩家按下空格
→ 恐龙获得向上的速度
→ 重力每一帧把恐龙往下拉
→ 碰到地面后停止下落
```

学生运行后发现恐龙飞走。

AI：

```text
我看到一个问题：
恐龙跳起来之后没有落回地面。

你觉得更可能是哪里少了一步？

A. 空格键没有被识别
B. 没有让重力把恐龙拉下来
C. 地面颜色不对
```

学生选 B。

AI：

```text
对。我们需要让 gravity 每一帧影响恐龙的 vertical speed。
我可以帮你加上这个小修复。

[看解释] [应用修复] [我想自己改]
```

修复后，preview 正常。

AI：

```text
现在恐龙能跳起并落下了。
下一步要让游戏更像跑酷，你想先做什么？

A. 加仙人掌
B. 加分数
C. 加背景移动
```

---

## 24. 后续版本想象

### V1.1

- 更多项目模板，但不作为强入口
- More visual logic map
- 更好的 before/after preview
- 简单作品分享页
- 学生个人 project gallery

### V1.2

- 学生自定义 AI 伙伴风格
- 轻量成就系统
- 更多语言支持
- Scratch-like block + JS 双视图
- 项目 remix 功能

### V2

- 可选教师/家长视图
- 作品社区
- 更复杂项目部署
- 多人协作
- 课程模式作为可选入口，而非核心入口

---

## 25. 当前 PRD 的核心结论

本产品的核心不是“AI 帮学生写代码”，而是：

> AI 帮学生把创作冲动转化为可走的实现路径，并在路径中的每一步，让学生看到结果、修复问题、理解一点点，然后继续往前走。

最重要的产品链路是：

```text
idea → path → milestone → done checklist → logic sketch → build → preview/test → fix → mini-explain → next milestone
```

最重要的产品界面是：

```text
Project Path + Live Preview + AI Build Companion
```

最重要的产品原则是：

```text
Protect motivation.
Build in small visible steps.
Preview is the learning surface.
Explain lightly.
Always connect to the next milestone.
```

最终要实现的体验是：

> 学生不是被 AI 带着上了一节编程课，而是在 AI 的帮助下，把自己真的想做的东西一步步做出来，并且在过程中逐渐知道它为什么能运行。

