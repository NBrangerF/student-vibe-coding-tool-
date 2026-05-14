# PRD｜Goal-to-Milestone：面向三年级学生的 AI 支持创意编程与计算思维工具

> 本版本为 Grade 3 scaffolding-first 重构版。它继承 short paper 的 Goal-to-Milestone 框架，但进一步明确：对于三年级学生，产品不能只提供 milestone 路线，还必须在 milestone 内提供更强的 visual cues、step scaffolds、student-authored done checklist、LLM feedback loop，以及面向 computational thinking 与 systems thinking 的可视化支持。

---

## 0A. 本次重构的核心变化

### 0A.1 从“milestone 清晰”升级为“milestone 内部可学习”

旧版本已经解决了：

```text
idea → project flowchart → next bounded milestone
```

但对于 Grade 3 学生，仅仅有 milestone 还不够。三年级学生通常无法自动理解：

- 当前 milestone 为什么重要；
- 它和整个系统有什么关系；
- 哪些行为算完成；
- 怎么把完成条件转化为代码行为；
- preview 里的现象和 checklist / logic sketch 如何对应；
- 自己应该检查什么，而不是等 AI 告诉答案。

因此，新版本把每个 milestone 设计成一个 **scaffolded build room**，而不只是一个任务卡。

### 0A.2 Done checklist 改为学生先填，LLM 再反馈

旧版本中，done checklist 主要由 AI 生成。新版本调整为：

```text
Student drafts checklist → LLM gives feedback → Student revises → Shared checklist is confirmed
```

这非常关键。因为 done checklist 不只是产品管理工具，而是三年级学生练习 computational thinking 与 systems thinking 的入口。

学生需要先尝试说：

- “我希望它做什么？”
- “我怎么知道它成功了？”
- “别人看到什么才算完成？”

然后 LLM 帮助学生把模糊标准改写为可观察、可测试、可实现的标准。

### 0A.3 与 Scratch 的核心差异

本产品不是 Scratch 的替代品，而是另一种学习重心。

Scratch 的优势是：

- block-based coding environment；
- 降低语法门槛；
- 帮助学生关注 coding fundamentals；
- 通过拖拽积木理解事件、循环、条件、变量等基本结构。

Goal-to-Milestone 的差异是：

1. **Goal-driven first**：先从学生想完成的 project goal 出发，而不是从积木或代码结构出发。
2. **Computational thinking focus**：强调分解、排序、条件、状态、反馈、测试、debugging、criteria articulation。
3. **Systems thinking focus**：强调项目由多个相互影响的部分组成，学生要理解 input、process、output、feedback loop、state change、dependencies。
4. **Faster feedback**：通过 AI + live preview 让学生更快看到“我想要的行为”和“系统实际行为”的差异。
5. **Milestone-based metacognition**：每一步都要求学生判断：我现在要让系统多一个什么行为？怎样知道它发生了？如果没有发生，系统哪里断了？

### 0A.4 新核心链路

旧链路：

```text
Idea → Project flowchart → Next bounded milestone → Done checklist → Logic sketch → Build → Preview → Fix → Mini-explain → Next milestone
```

Grade 3 新链路：

```text
Idea
→ Project flowchart
→ Choose milestone
→ Milestone story
→ Student drafts done checklist
→ LLM feedback on checklist
→ Revised checklist
→ Visual logic map
→ Guided build steps
→ Live preview
→ Student checks against checklist
→ LLM feedback on observed behavior
→ Fix with visual cues
→ Mini-explain
→ System map update
→ Choose next milestone
```

---

## 0B. Grade 3 设计原则

### GP1. 每个 milestone 都必须有 visual anchor

三年级学生需要“看得见”的目标。每个 milestone 应该被表示为：

- 一个画面变化；
- 一个用户动作；
- 一个系统反应；
- 一个 before / after 对比；
- 一个简单系统卡片。

不要只写：

```text
Add feedback logic.
```

要写成：

```text
When I click an answer, the game tells me if I am right or not.
```

### GP2. Checklist 是学生表达目标的工具，不是 AI 生成的任务清单

学生先写 checklist，即使写得不准确也没关系。LLM 的任务不是直接替换，而是引导学生改好。

学生初稿：

```text
It works.
It looks good.
The game is fun.
```

LLM 反馈：

```text
These are good ideas, but they are hard to check. Let’s make them easier to see.
What should happen when someone clicks an answer?
```

修订后：

```text
□ I can click an answer.
□ The game says “Correct!” if the answer is right.
□ The game says “Try again” if the answer is wrong.
□ The message appears right away.
```

### GP3. Scaffolding 要分层，不要一次性给完

三年级学生不适合看到大量功能和控制项。每个 milestone 内只显示当前需要的 scaffold：

1. What are we making happen?
2. How will we know it worked?
3. What parts are involved?
4. Let’s build one small step.
5. What happened in preview?
6. Which checklist item passed or failed?
7. What should we try next?

### GP4. Visual cues 比文字解释更重要

每个核心概念都要有视觉提示：

- input：学生动作，用手指 / cursor / click marker 表示；
- process：系统内部变化，用 arrows / state cards 表示；
- output：屏幕结果，用 preview highlight 表示；
- feedback：系统回应，用 message bubble 表示；
- dependency：一个部分影响另一个部分，用 connector 表示；
- bug：expected vs observed，用并排对比表示。

### GP5. Systems thinking 必须显性化

项目不是一个个孤立功能，而是一个小系统。每个 milestone 完成后，系统 map 要更新：

```text
Player click → Check answer → Show feedback → Update score → Next question
```

学生逐步看到：

- 哪个部分接收 input；
- 哪个部分做 decision；
- 哪个部分产生 output；
- 哪个部分保存 state；
- 哪个部分影响下一步。

### GP6. UI 要减少冗余，按阶段渐进显示

三年级学生界面不能同时展示太多功能。默认不展示复杂 toolbar、export、gallery、resources、advanced code view。

核心界面只保留：

- Project flowchart
- Current milestone
- Done checklist
- Visual logic map
- Preview
- AI guide
- Mentor help

高级功能折叠到 “More”。

---

## 0C. 新 milestone room 信息架构

每个 milestone 进入一个专门工作区：**Milestone Room**。

### 左侧：Project Map

显示整个 project flowchart，但简化成少量大卡片。

例如：

```text
1 Start screen ✓
2 First question ✓
3 Answer feedback ← current
4 Score
5 More questions
```

视觉 cue：

- 已完成：绿色勾
- 当前：高亮边框
- 后续：灰色
- blocked：黄色提示

### 中间：Build + Preview

中间是最大区域，分上下：

1. 上方：Current milestone story
2. 下方：Live preview

Milestone story 示例：

```text
You are making the game respond when someone clicks an answer.
Before: clicking an answer does nothing.
After: clicking an answer shows Correct or Try again.
```

Preview 必须突出 before / after 和可交互测试。

### 右侧：Scaffold Panel

右侧不是普通聊天框，而是分步 scaffold：

1. My checklist
2. AI feedback
3. Visual logic map
4. Build step
5. Check preview
6. Mini-explain

每次只展开当前步骤，其他步骤折叠。

---

## 0D. 新 checklist 流程

### Step 1：学生先写

UI 文案：

```text
What should happen when this milestone is done?
Write 2–4 things you can see or test.
```

为三年级学生提供 sentence starters：

```text
□ I can...
□ When I click..., the app...
□ I see...
□ The game tells me...
□ The score...
```

### Step 2：LLM 反馈

LLM 不直接覆盖学生答案，而是给三类反馈：

1. **Good and checkable**
2. **Too vague**
3. **Missing step**

示例：

```text
Good: “I can click an answer.” We can test this.
Too vague: “It is fun.” Let’s make this more visible.
Missing: Should the game say something after the click?
```

### Step 3：学生修订

系统给出 revised checklist draft，但必须让学生确认或修改：

```text
Here is a clearer checklist. Want to use it or change it?
```

### Step 4：Checklist 变成测试面板

Build 后，学生用 checklist 手动检查：

```text
□ Did this happen? Yes / Not yet / I’m not sure
```

LLM 只在学生勾选后给反馈。

---

## 0E. 新 scaffolding layer

### 1. Goal scaffold

帮助学生把 vague goal 变成 visible behavior。

```text
I want to make a quiz game.
→ What should the player do first?
→ What should the game show next?
```

### 2. Flowchart scaffold

帮助学生看到系统顺序。

```text
Start → Question → Answer → Feedback → Score
```

### 3. Milestone scaffold

帮助学生选择一个小步骤。

```text
Let’s not build the whole quiz now.
Which one small thing should work next?
```

### 4. Checklist scaffold

帮助学生定义成功。

```text
How will we know this step works?
```

### 5. Logic scaffold

帮助学生理解 input-process-output。

```text
Click answer → Check if right → Show message
```

### 6. Preview scaffold

帮助学生观察系统行为。

```text
Try clicking answer A. What happened?
```

### 7. Debug scaffold

帮助学生比较 expected vs observed。

```text
You expected feedback. You saw no message. Which part is missing?
```

### 8. Systems scaffold

帮助学生看到这个 milestone 如何改变整体系统。

```text
Now your system has a feedback loop:
Player answer → Game response → Player tries next question
```

---

## 0F. Visual cue system

### 0F.1 核心颜色

- Goal / idea：soft teal
- Flowchart / system：soft blue
- Current milestone：warm yellow
- Checklist：soft green
- Logic / CT：lavender
- Preview / observed behavior：neutral white + blue highlight
- Bug / mismatch：soft red / coral
- Mentor help：light gray-blue

### 0F.2 核心图形语言

| 概念 | Visual cue |
|---|---|
| Goal | star / target card |
| User action | cursor / tap marker |
| Input | incoming arrow |
| Process | gear / transformation card |
| Decision | diamond / split card |
| Output | screen highlight |
| Feedback | speech bubble |
| State | small memory box |
| Bug | expected vs observed split |
| System connection | line connector |

### 0F.3 三年级适配

图标可用，但不能幼稚卡通化。风格应为：

- clean
- rounded
- soft
- readable
- low-noise
- not toy-like

---

## 0G. 功能冗余删减

### 从默认界面移除或折叠

- Gallery
- Resources
- Export
- Advanced code editor
- Full toolbar with many operations
- AI Assistant global chat
- 多个 starter cards
- 大量 project metrics
- 复杂 account/profile widgets

### 默认保留

- My project
- Flowchart
- Current milestone
- Checklist
- Logic map
- Preview
- Ask AI
- Ask mentor
- Next step

### 高级功能进入 More

- Rename project
- Export
- Share
- Code view
- Version history
- Advanced settings

---

## 0H. 新 MVP 优先级

### P0：必须做

1. Idea-first entry
2. Project flowchart with visual cards
3. Milestone room
4. Student-authored done checklist
5. LLM checklist feedback
6. Visual logic map
7. Guided build step
8. Live preview
9. Student checklist check-off after preview
10. LLM feedback on observed behavior
11. Simple fix suggestion
12. Mini-explain
13. System map update
14. Choose next milestone

### P1：重要但可后置

1. Mentor support at impasses
2. Version history
3. Before / after preview comparison
4. Code view toggle
5. More project templates
6. Share link

### P2：暂缓

1. Gallery
2. Full community
3. Teacher dashboard
4. Parent analytics
5. Multi-user classroom mode
6. Full Scratch-like editor
7. Full code editor
8. AI grading

---

## 0I. 新评价指标

### Computational thinking indicators

- Student can name a visible behavior.
- Student can break goal into ordered steps.
- Student can create or revise checklist items.
- Student can identify input → process → output.
- Student can compare expected vs observed behavior.
- Student can locate which checklist item failed.
- Student can explain one small system change.

### Systems thinking indicators

- Student can identify parts of the project system.
- Student can explain how one part affects another.
- Student can see feedback loop.
- Student can revise flowchart after preview.
- Student can predict how adding a milestone changes the whole project.

### Motivation / ownership indicators

- Student revises AI suggestion.
- Student names project parts in own words.
- Student continues after mismatch.
- Student chooses next milestone voluntarily.
- Student asks “what if” questions.

---

## 0J. 新产品核心结论

Grade 3 版本的 Goal-to-Milestone 不应该只是一个简化版 vibe coding tool。

它应该是：

> 一个 goal-driven、visual-scaffolded、student-authored criteria-based creative programming environment。

它与 Scratch 的最大不同不是“更会写代码”，而是：

> Scratch 帮学生更容易进入 coding fundamentals；Goal-to-Milestone 帮学生从自己的目标出发，练习把一个系统想清楚、拆清楚、做出来、看反馈、改进，并理解各部分如何相互作用。

---

# PRD｜Goal-to-Milestone：面向 K–12 创意编程的 AI 项目推进工具

## 0. 版本说明

本 PRD 是基于 short paper **“Beyond Vibe Coding: A Goal-to-Milestone Framework for AI-Supported Creative Programming in K–12”** 重新整理后的产品需求文档。

如果本 PRD 与早期版本存在冲突，以 short paper 中的理论定位、术语和框架为准。

主要调整包括：

1. 将早期的 **Project Path** 调整为 **Project Flowchart**。
2. 将“AI Build Companion”进一步理论化为 **metacognitive progression architecture**。
3. 将目标用户从泛 K–12 收窄为 **upper-elementary and middle-school learners**，同时保留 broader K–12 implications。
4. 将使用场景明确为 **hybrid learning spaces**：课后项目、家庭、club、library、maker space、online community，以及部分由课堂任务触发但不完全由教师控制的项目。
5. 将 adult monitor 改为 **mentor / facilitator support**，强调其作用是 planning impasses 时的支持，而不是接管任务。
6. 将核心循环重构为：

```text
Idea-first entry
→ Project flowchart
→ Next bounded milestone
→ Done checklist
→ Logic sketch
→ Build with AI support
→ Preview and test
→ Fix observed behavior
→ Mini-explain
→ Choose next milestone
→ Next bounded milestone
```

---

# 1. 产品一句话

**Goal-to-Milestone** 是一个面向 upper-elementary and middle-school learners 的 AI-supported creative programming 工具。它不把 AI 编程支持理解为“从 prompt 直接生成完整代码”，而是帮助学习者从一个 personally meaningful idea 出发，与 AI 共同构建可修改的 project flowchart，选择下一个 bounded milestone，明确 done criteria，绘制 logic sketch，小步 build，基于 live preview 观察和修复行为差异，并通过 mini-explain 连接到下一个 milestone。

它的核心目标是：

> 帮助学习者保持对项目的 ownership，同时把 AI 帮助引导为 guidance，而不是 wholesale delegation。

中文表达：

> 不是让 AI 替学生完成项目，而是帮助学生持续判断：我下一步想让作品发生什么？怎样知道它完成了？为什么它现在这样运行？

---

# 2. 产品定位

## 2.1 产品不是

本产品不是：

- 直接生成完整应用的儿童版 vibe coding 工具
- 成人版 Cursor / Claude Code / Codex 的低龄化界面
- 以教师任务、课程单元或课堂管理为中心的编程平台
- 以年级、课时、知识点为入口的课程系统
- 通过重测验、重反思、重 rubric 来证明学习的教学平台
- 让 mentor / facilitator 实时监控并接管学生项目的系统
- 一个单纯的代码生成器或 API wrapper

## 2.2 产品是

本产品是：

- 一个 **student-facing AI-supported creative programming environment**
- 一个 **project progression tool**
- 一个 **pre-code and between-milestone interaction layer**
- 一个帮助学生从 idea 到 project flowchart，再到 bounded milestones 的 AI 支持系统
- 一个把 planning、monitoring、debugging、mini-explanation 嵌入制作过程的 metacognitive scaffold

产品重点不是“AI 能写什么代码”，而是：

> 什么样的支持能帮助学习者计划、监控、理解并完成下一个 meaningful step？

---

# 3. 目标用户与使用场景

## 3.1 核心学习者

主要面向：

- Upper-elementary learners
- Middle-school learners
- 对游戏、网页、互动故事、mini-app、simulation、club tools 等数字作品有创作兴趣的学生
- 有一定数字工具使用经验，但无法独立规划完整项目的 novice creative programmers
- 需要 AI 支持，但仍应保留项目 ownership 的学习者

## 3.2 更广泛 K–12 含义

虽然核心设计聚焦 upper-elementary and middle-school learners，但该框架可为更广泛 K–12 场景提供启发：

- younger learners 可能需要更多 visual / block-based scaffolds
- older learners 可能需要更复杂的 project flowchart、state/data/API planning
- 不同年龄段的差异主要体现在 representation、语言复杂度、工具权限和 mentor involvement 的程度

## 3.3 Hybrid learning spaces

产品不是传统意义上的课堂工具，而是课堂工具的延伸。

它适用于：

- after-school programs
- coding clubs
- libraries
- homes
- maker spaces
- online communities
- self-directed projects
- partly teacher-framed but student-shaped classroom projects

在这些 hybrid spaces 中，教师、家长、mentor 或 facilitator 不一定持续介入，但可以在关键 planning impasses 时接入。

## 3.4 Mentor / facilitator 的角色

Mentor / facilitator 不是监控者、评分者或任务接管者。

其核心角色是：

- 当学习者无法判断 project path 时，帮助比较可能路径
- 当学习者无法选择合适 first milestone 时，帮助缩小范围
- 当学习者的 flowchart 变得过大或混乱时，帮助重构
- 当 preview behavior 与 done checklist 不一致时，帮助学习者解释差异
- 当 AI 给出过度完整的方案时，帮助学生回到 criteria 和 visible behavior

原则：

> Mentor support should be designed around metacognitive need rather than constant control.

---

# 4. 核心设计问题

AI coding tools 已经可以生成代码、解释错误、帮助 novice 从 idea 到 working artifact。但在 K–12 creative programming 中，核心问题不是 AI 是否能生成可运行代码，而是：

> AI 如何帮助学习者把 personally meaningful idea 转化为一个仍然 understandable、revisable、learner-owned 的 project path？

因此，本产品围绕以下 design tensions 设计：

## 4.1 Motivation vs. Structure

学生的创作动机来自“我想做一个真实作品”。但没有结构，项目会过大、过乱、过早依赖 AI。

产品需要：

- 保护 idea-first motivation
- 但通过 project flowchart 和 bounded milestone 降低 cognitive load

## 4.2 Guidance vs. Delegation

AI 可以帮助学习者，但也可能成为 hidden planner 和 hidden implementer。

产品需要：

- 让 AI support close to learner-owned progression
- 让学生持续做 path、criteria、milestone、preview interpretation 的判断

## 4.3 Visible Progress vs. Conceptual Understanding

学生需要看到作品动起来，但不能只看到结果。

产品需要：

- 用 preview 维持 visible progress
- 用 done checklist、logic sketch、mini-explain 产生轻量 understanding

## 4.4 Informal Making vs. School-like Reflection

创意编程不能变成不断写反思和完成 rubric。

产品需要：

- 让 reflection 嵌入制作动作中
- 避免 checklist-as-rubric 和 checklist fatigue

---

# 5. 核心产品链路

## 5.1 Goal-to-Milestone 主流程

```text
Idea-first entry
→ Project flowchart
→ Next bounded milestone
→ Done checklist
→ Logic sketch
→ Build with AI support
→ Preview and test
→ Fix observed behavior
→ Mini-explain
→ Choose next milestone
→ Next bounded milestone
```

## 5.2 阶段解释

| 阶段 | 学生端表达 | 系统实际作用 |
|---|---|---|
| Idea-first entry | 我想做一个…… | 捕捉 personally meaningful idea |
| Project flowchart | 我们可以这样一步步做 | 共同反推 project path，形成可修改地图 |
| Next bounded milestone | 下一步先让什么发生？ | 选择一个小、可见、可检查的 milestone |
| Done checklist | 做到这些就算完成 | 明确 observable criteria，不做评分表 |
| Logic sketch | 这个功能大概怎么工作？ | 用 pseudo-code / cards / state diagram / natural-language sequence 表达计算计划 |
| Build with AI support | 现在小步实现它 | AI 在 milestone 范围内生成或修改代码 |
| Preview and test | 运行看看发生了什么 | 观察 expected vs. observed behavior |
| Fix observed behavior | 哪个行为不符合预期？ | 从现象出发 debug，而不是直接替换代码 |
| Mini-explain | 刚刚为什么这样运行？ | 把 visible behavior 与 transferable idea 连接 |
| Choose next milestone | 下一步想做什么？ | 回到 flowchart，选择或调整下一个 milestone |

---

# 6. 核心功能模块

## Module A：Idea-first Entry

### 目标

允许学习者从 phrase、sketch、story、theme、desired behavior 或 vague goal 开始，而不是从固定 assignment template 开始。

### 输入示例

- I want to make a quiz game about my school.
- I want to make an app for our club volunteer tasks.
- I want to make a pet game.
- I want to make a mini website for my story world.
- I want to make a game where a dinosaur jumps over things.

### 系统行为

AI 不立即生成完整代码，而是 reflect and clarify：

- What kind of artifact does the learner imagine?
- Who might use it?
- What should someone be able to see?
- What should someone be able to do?
- What should someone choose, change, or share?

### 设计要求

- 问题数量少，优先使用 2–4 个选项 + free input
- 不要求一开始选择年级、知识点或课时
- 不把学生 idea 过早标准化为模板项目
- 不评价项目是否“适合”学生，而是帮助其缩小为 workable version

---

## Module B：Project Flowchart Construction

### 目标

将 fuzzy idea 转化为一个 visible、revisable、learner-owned project flowchart。

这是整个产品最关键的模块。

### 核心行为

学习者和 AI 共同从 imagined finished artifact 反推：

- screens
- states
- data
- interactions
- feedback
- ordering
- visible behaviors
- possible paths

### 输出形式

不是完整 specification，而是 lightweight project flowchart。

每个 flowchart node 代表一个可能的 project step，例如：

```text
Start screen
→ One playable question
→ Answer feedback
→ Score
→ More questions
→ Styling
```

或：

```text
Display volunteer tasks
→ Add new task
→ Mark task as done
→ Filter by date
→ Share app
```

### 学习者可操作行为

学习者可以：

- select path
- combine path items
- rename nodes
- reorder nodes
- skip nodes
- replace nodes
- add free input
- ask why a path is suggested

### AI 支持原则

AI 应给出 **two to four possible paths**， phrased as choices rather than assignments。

示例：

```text
你可以先走这几条路线：
A. 先做一个能玩的最小版本
B. 先做漂亮的 start screen
C. 先做核心互动，比如答题和反馈
D. 我想自己安排顺序
```

### 与早期 PRD 的差异

早期版本使用 “Project Path”。新版本使用 **Project Flowchart**，因为 short paper 中强调学生与 AI 共同 reverse-plan 一个可见、可修改、可重新排序的路径，而不是 AI 生成一个固定路线。

---

## Module C：Next Bounded Milestone Planner

### 目标

将 project flowchart 中的一个 node 转化为 accessible first / next step。

### Milestone 质量标准

一个好的 bounded milestone 应该：

1. easy to start
2. visibly connected to the desired project
3. framed as inspectable behavior
4. small enough to build and preview
5. tied to learner-selected criteria before code generation
6. open to revision after preview

### 不推荐表述

```text
Write the quiz logic.
```

### 推荐表述

```text
When I press Start, the first question appears.
```

### Milestone 生成规则

一个 flowchart node 只有在学习者帮助命名 visible behavior 后，才成为 candidate milestone。

也就是说，不是 AI 说：“下一步是写 quiz logic。”

而是系统引导：

```text
你想让玩家在这一步看见什么变化？
A. Start button 出现
B. 按下 Start 后出现第一题
C. 第一题出现四个选项
D. 我想自己写
```

---

## Module D：Done Checklist

### 目标

在 build 前明确 observable criteria，使 AI support 不会脱离 learner-selected criteria。

### 定义

Done checklist 是 shared reference points，不是 grades。

它服务于：

- learner
- AI assistant
- mentor / facilitator

### 示例：Quiz Game First Milestone

Milestone：When I press Start, the first question appears.

Done checklist：

- Start button appears.
- Pressing Start shows one question.
- The question has four answer choices.
- The screen does not show the answer yet.

### 设计原则

- 每个 checklist 3–5 条
- 必须是 observable behavior
- 避免评分语言
- 不使用“优秀/良好/及格”
- 不把 checklist 变成 rubric
- 不要频繁弹出 checklist，避免 checklist fatigue

### Boundary condition

如果 checklist 太长、太正式或过于像课堂评价，会削弱 informal creative programming 的动机。

---

## Module E：Logic Sketch

### 目标

让 computational plan 在 build 前可见。

### 表达形式

Logic sketch 可以是：

- pseudo-code
- cards
- state diagram
- natural-language sequence
- event-flow diagram
- input-output map

### 示例

Milestone：Pressing Start shows first question.

Logic sketch：

```text
Player clicks Start
→ game state changes from "start" to "question"
→ the first question is selected
→ answer choices are displayed
```

### 设计原则

- 不长篇讲 concept
- 不作为独立 lesson
- 与 done checklist 对齐
- 只解释当前 milestone 需要的 computational plan
- 允许学习者改写或确认 sketch

### 产品作用

Done checklist + logic sketch 将 implementation request 转化为 planning-monitoring artifact。

---

## Module F：Build with AI Support

### 目标

在 bounded milestone 范围内小步实现，而不是一次性完成整个项目。

### AI 行为边界

AI 可以：

- write small patch
- modify relevant code
- explain what changed
- point to the part related to the milestone
- propose limited implementation choices

AI 不应：

- complete the whole project
- add large unrequested features
- silently restructure the project
- skip done checklist
- skip logic sketch
- turn the learner’s idea into an AI-owned specification

### Build 前置条件

Build 前必须存在：

1. selected milestone
2. done checklist
3. logic sketch
4. learner confirmation or lightweight choice

---

## Module G：Preview and Test

### 目标

让 learner 比较 expected behavior 与 observed behavior。

### 为什么重要

Preview 是本产品的主要 learning surface。

学习者不是先从 error log 理解 bug，而是先从可见行为理解：

- What did I expect?
- What happened instead?
- Which checklist item failed?
- What does this reveal about the logic sketch?

### Preview 功能需求

- Run / Stop / Restart
- Instant preview
- Visible behavior capture
- Before / after comparison
- Checklist-linked testing
- Console 折叠显示
- Shareable preview link
- Version checkpoint

### 产品原则

Preview 不只是展示成果，而是用于 metacognitive monitoring。

---

## Module H：Fix Observed Behavior

### 目标

把 debugging 从 code replacement 转向 phenomenon-driven reasoning。

### Debugging Flow

1. 描述 observed behavior
2. 对照 expected behavior
3. 标记未满足的 checklist item
4. 回到 logic sketch 找缺失步骤
5. 提供小修复建议
6. 运行 preview 再次比较

### 示例

Observed behavior：

```text
The question appears, but the answer choices do not.
```

AI response：

```text
Which checklist item failed?
A. Start button appears
B. Pressing Start shows one question
C. The question has four answer choices
```

然后 AI 指向 logic sketch 中缺失的 display choices step，而不是直接替换全部代码。

### 设计原则

- 先从 learner sees 开始
- 避免直接说 “Here is the fixed code”
- 修复建议应最小化
- 修复后必须回到 preview

---

## Module I：Mini-explain

### 目标

在 milestone 完成或 bug 修复后，用一句话或一个小问题将 visible behavior 与 transferable idea 连接。

### Mini-explain 不是

- 长反思
- 课后总结
- 正式 assessment
- 概念讲座

### Mini-explain 是

- concise link between visible behavior and idea
- local understanding check
- bridge to next milestone

### 示例

```text
When you clicked Start, the program changed state from start screen to question screen. This is why the first question appeared.
```

或：

```text
这一步主要用了什么？
A. Event: clicking Start triggers a change
B. Styling: changing colors
C. Storage: saving data permanently
```

### 学习者选项

学习者可以：

- accept the explanation
- ask a follow-up
- return to project flowchart
- choose next milestone

---

## Module J：Choose Next Milestone

### 目标

将 transfer 设计为 continuation，而不是 reflection homework。

### 核心行为

Milestone 完成后，系统回到 project flowchart，帮助学习者选择下一个 meaningful step。

示例：

```text
Your first question now appears with answer choices.
What do you want to make happen next?
A. Show feedback after an answer
B. Keep score
C. Add more questions
D. Change the visual style
E. I want to edit the flowchart
```

### 设计原则

- 反思不单独成为重任务
- 下一步选择本身就是 transfer
- 学生可以修改 flowchart，而不是被固定路径推进

---

# 7. Mentor / Facilitator Support

## 7.1 介入时机

Mentor / facilitator support 只在 metacognitive pressure points 出现时介入：

- stuck judging a path
- stuck choosing a first milestone
- stuck revising project flowchart
- stuck interpreting why preview differs from done checklist
- AI proposes complete solution too early
- learner is overwhelmed by too many options

## 7.2 介入方式

系统可提供：

- “Ask mentor to compare paths”
- “Ask mentor to help choose first milestone”
- “Ask mentor to simplify this flowchart”
- “Ask mentor to review why preview differs”

## 7.3 Mentor 看见什么

Mentor 不需要看全部聊天或接管项目。

建议显示：

- learner idea
- current project flowchart
- current milestone
- done checklist
- observed behavior
- where the learner is stuck
- AI’s current suggestion

## 7.4 Mentor 不应做什么

Mentor 不应：

- 直接替学生决定项目方向
- 直接让 AI 完成整个项目
- 把 checklist 变成评分 rubric
- 过度纠正学生创意
- 让 project flowchart 完全变成成人的计划

## 7.5 产品定位

Mentor support is optional, situational, and non-takeover.

---

# 8. 信息架构

## 8.1 主工作区结构

建议界面：

```text
┌─────────────────────────────────────────────┐
│ Top Bar: Project Name / Save / Share / Help │
├───────────────┬────────────────┬────────────┤
│ Project       │ Live Preview   │ AI          │
│ Flowchart     │ Surface        │ Companion   │
│ + Milestone   │                │             │
│ + Checklist   │                │             │
├───────────────┴────────────────┴────────────┤
│ Bottom Drawer: Logic / Changes / Code / Log │
└─────────────────────────────────────────────┘
```

## 8.2 左栏：Project Flowchart Panel

内容：

- learner idea
- project flowchart
- candidate milestones
- current bounded milestone
- done checklist
- mentor support button

状态：

- imagined
- planned
- selected
- building
- previewed
- needs fix
- completed

## 8.3 中间：Preview and Test Surface

内容：

- running artifact
- expected behavior
- observed behavior
- checklist test markers
- before / after behavior
- screenshot or state capture

## 8.4 右栏：AI Companion

负责：

- asking learner-facing decisions
- offering 2–4 path options
- receiving free input
- explaining next step
- pointing to checklist / logic sketch
- mini-explaining after fixes

## 8.5 底部：Logic / Changes / Code / Log Drawer

Tabs：

- Logic sketch
- AI changes
- Code
- Console / error log
- Version history

默认优先显示 Logic sketch 和 Changes，Code 可展开。

---

# 9. Agent 行为设计

## 9.1 Agent 总角色

Agent 是 project progression companion，不是 hidden planner。

它帮助学习者：

- imagine artifact
- co-plan flowchart
- choose milestone
- articulate criteria
- sketch logic
- build small patch
- compare preview behavior
- fix observed behavior
- connect to next milestone

## 9.2 Agent 核心规则

1. Start from learner idea.
2. Do not produce whole-project code at entry.
3. Build project flowchart before code.
4. Offer choices, not assignments.
5. Always allow free input.
6. Treat each flowchart node as candidate milestone only after visible behavior is named.
7. Tie implementation help to learner-selected criteria.
8. Use preview-driven debugging before code replacement.
9. Use mini-explain, not heavy reflection.
10. Return to project flowchart for next milestone.
11. Invite mentor / facilitator support at planning impasses.
12. Avoid becoming the hidden planner.

## 9.3 Agent 状态机

```text
IDEA_CAPTURED
→ IDEA_REFLECTED
→ LIGHT_CLARIFICATION
→ FLOWCHART_OPTIONS_GENERATED
→ FLOWCHART_CO_PLANNED
→ MILESTONE_CANDIDATES_IDENTIFIED
→ NEXT_MILESTONE_SELECTED
→ DONE_CHECKLIST_ARTICULATED
→ LOGIC_SKETCH_CREATED
→ READY_TO_BUILD
→ AI_PATCH_PROPOSED
→ PATCH_APPLIED
→ PREVIEW_RUN
→ BEHAVIOR_COMPARED
→ NEEDS_FIX / MILESTONE_COMPLETED
→ MINI_EXPLAIN
→ NEXT_MILESTONE_SELECTION
→ FLOWCHART_REVISED_OR_CONTINUED
```

## 9.4 关键 gating rules

```text
No flowchart, no full build.
No visible behavior, no milestone.
No done checklist, no broad implementation help.
No logic sketch, no code generation.
No preview, no completion.
No observed behavior, no debugging claim.
No heavy reflection; always bridge to next milestone.
```

---

# 10. Prompt / Instruction 草案

## 10.1 System Instruction

```text
You are a Goal-to-Milestone AI companion for upper-elementary and middle-school learners engaged in student-initiated creative programming.

Your purpose is not to complete the whole project for the learner. Your purpose is to help the learner preserve ownership while turning a personally meaningful idea into a revisable project flowchart, bounded milestones, observable done criteria, logic sketches, small builds, preview-driven debugging, mini-explanations, and next-milestone choices.

Core rules:
- Start from the learner’s idea, phrase, sketch, story, theme, or desired behavior.
- Do not ask for grade level, lesson length, or formal learning objectives at entry.
- Do not generate whole-project code at the beginning.
- First reflect and clarify what the learner imagines someone can see, do, choose, change, or share.
- Help the learner and AI co-construct a project flowchart by reasoning backward from the imagined artifact.
- Offer two to four possible paths as choices, not assignments, and always allow free input.
- A flowchart node becomes a milestone only after the learner helps name the visible behavior that should change.
- Before coding, create a done checklist and a logic sketch.
- Keep code generation inside the current bounded milestone.
- Use preview to compare expected and observed behavior.
- When behavior differs, ask which checklist item failed and connect the issue to the logic sketch.
- Give mini-explanations that link visible behavior to transferable ideas.
- Return to the flowchart and help the learner choose the next milestone.
- Invite mentor or facilitator support only at planning impasses or interpretation difficulties.
- Preserve motivation, agency, and learner-owned progression.
```

## 10.2 Flowchart Generation Prompt

```text
Given the learner’s idea, help the learner reason backward from the imagined finished artifact into a lightweight project flowchart.

Do not write code.
Do not create a full specification.
Generate two to four possible project paths, phrased as learner choices.
Each path should include visible steps such as screens, states, data, interactions, feedback, and ordering.
Allow the learner to select, combine, rename, reorder, skip, replace, or add free-input path items.
The output should be a revisable project flowchart, not a fixed plan.
```

## 10.3 Milestone Prompt

```text
From the current project flowchart, help the learner choose the next bounded milestone.

A good milestone must:
- be easy to start,
- be visibly connected to the desired project,
- be framed as inspectable behavior,
- be small enough to build and preview,
- be tied to learner-selected criteria before code generation.

Ask the learner what visible behavior should change.
Do not frame the milestone as an internal coding task if it can be framed as visible behavior.
```

## 10.4 Done Checklist + Logic Sketch Prompt

```text
For the selected milestone, create:
1. A short milestone statement phrased as visible behavior.
2. A done checklist with 3–5 observable criteria.
3. A logic sketch using pseudo-code, cards, state diagram, or natural-language sequence.

The checklist is not a rubric or grade.
The logic sketch should make the computational plan visible without becoming a long lesson.
Do not generate code until the learner confirms or revises these items.
```

## 10.5 Preview Debugging Prompt

```text
When preview behavior differs from expectation:
1. Describe what the learner can see.
2. Ask what was expected.
3. Ask which done-checklist item failed.
4. Point to the related step in the logic sketch.
5. Suggest the smallest relevant fix.
6. Let the learner apply, revise, ask for explanation, or try themselves.
7. Run preview again.

Do not replace the whole code solution without connecting the fix to observed behavior and the checklist.
```

---

# 11. MVP Scope

## 11.1 MVP 核心目标

验证以下 conjectures：

1. Learners can begin from personally meaningful ideas.
2. Learner + AI can co-construct revisable project flowcharts.
3. Project flowcharts can reduce open-ended planning load without removing ownership.
4. Bounded milestones can keep AI support tied to visible learner-selected behavior.
5. Done checklists can support criteria articulation without becoming rubrics.
6. Logic sketches can make computational planning visible before build.
7. Preview-driven debugging can support monitoring of program behavior.
8. Mini-explanations can support lightweight reflection without interrupting motivation.
9. Mentor visibility can support planning impasses without task takeover.

## 11.2 MVP 必做功能

1. Idea-first input
2. Light clarification
3. Project flowchart generator
4. Flowchart editing: select, combine, rename, reorder, skip, replace
5. Next bounded milestone selection
6. Done checklist generator
7. Logic sketch generator
8. Small AI patch generation
9. Live preview and test
10. Checklist-linked behavior comparison
11. Fix observed behavior flow
12. Mini-explain
13. Choose next milestone
14. Version checkpoints
15. Optional mentor support request at planning impasses

## 11.3 MVP 暂缓功能

- full teacher dashboard
- formal assessment analytics
- mandatory learning objectives
- course mode
- multi-user classroom management
- full community gallery
- complete block-based editor
- complex backend deployment
- AI grading
- long reflective journaling

## 11.4 推荐技术路径

前端：

- React / Next.js
- 三栏式 workspace
- flowchart editor
- live preview surface
- bottom drawer for logic/code/log

运行环境：

- HTML/CSS/JavaScript sandbox
- p5.js sandbox
- simple React sandbox as later extension

后端：

- LLM orchestration layer
- project state manager
- code patch generator
- preview runner
- checkpoint service
- mentor support event handler

数据：

- users
- projects
- project_flowcharts
- flowchart_nodes
- milestones
- done_checklists
- logic_sketches
- build_events
- preview_events
- observed_behavior_reports
- mini_explain_events
- mentor_support_events
- checkpoints

---

# 12. 数据结构草案

## 12.1 Project

```json
{
  "project_id": "string",
  "owner_id": "string",
  "title": "School Quiz Game",
  "original_idea": "I want to make a quiz game about my school.",
  "current_flowchart_id": "flow_001",
  "current_milestone_id": "m_001",
  "status": "in_progress",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## 12.2 Project Flowchart

```json
{
  "flowchart_id": "flow_001",
  "project_id": "string",
  "nodes": [
    {
      "node_id": "n_start",
      "label": "Start screen",
      "visible_purpose": "Player sees the title and Start button",
      "status": "planned"
    },
    {
      "node_id": "n_question",
      "label": "One playable question",
      "visible_purpose": "First question appears with four choices",
      "status": "selected_as_milestone"
    }
  ],
  "edges": [
    {"from": "n_start", "to": "n_question"}
  ],
  "revision_history": []
}
```

## 12.3 Milestone

```json
{
  "milestone_id": "m_001",
  "project_id": "string",
  "flowchart_node_id": "n_question",
  "title": "Pressing Start shows the first question",
  "visible_behavior": "When I press Start, the first question appears with four answer choices.",
  "status": "building",
  "done_checklist_id": "dc_001",
  "logic_sketch_id": "ls_001"
}
```

## 12.4 Done Checklist

```json
{
  "done_checklist_id": "dc_001",
  "milestone_id": "m_001",
  "items": [
    {"text": "Start button appears", "status": "met"},
    {"text": "Pressing Start shows one question", "status": "met"},
    {"text": "The question has four answer choices", "status": "not_met"}
  ]
}
```

## 12.5 Logic Sketch

```json
{
  "logic_sketch_id": "ls_001",
  "milestone_id": "m_001",
  "format": "natural_language_sequence",
  "steps": [
    "Player clicks Start",
    "Game state changes from start to question",
    "First question is selected",
    "Answer choices are displayed"
  ]
}
```

## 12.6 Preview Event

```json
{
  "preview_event_id": "pe_001",
  "milestone_id": "m_001",
  "expected_behavior": "Question appears with four choices",
  "observed_behavior": "Question appears but choices are missing",
  "failed_checklist_items": ["The question has four answer choices"],
  "created_at": "datetime"
}
```

## 12.7 Mentor Support Event

```json
{
  "mentor_event_id": "me_001",
  "project_id": "string",
  "trigger": "planning_impasse",
  "context": {
    "current_flowchart_node": "n_storage",
    "learner_question": "Should storage be part of the first milestone?",
    "ai_suggestion": "Compare temporary interface state vs persistent storage"
  },
  "status": "requested"
}
```

---

# 13. 成功指标

## 13.1 不只看项目完成

Future empirical work 不应只看 learner 是否 finish projects。

产品应记录是否发生以下过程：

- revise flowcharts
- articulate done criteria
- compare expected and observed behavior
- ask inquiry-oriented questions
- use mentor / facilitator support at planning impasses
- maintain learner-owned choices
- reduce direct complete-solution requests

## 13.2 产品行为指标

- idea → flowchart conversion rate
- flowchart revision rate
- first milestone selection rate
- done checklist completion rate
- logic sketch confirmation / revision rate
- preview run frequency
- preview-to-fix completion rate
- mini-explain engagement rate
- next milestone continuation rate
- mentor support request rate

## 13.3 学习过程指标

- learner names visible behavior before code
- learner revises flowchart meaningfully
- learner identifies failed checklist item
- learner compares expected vs observed behavior
- learner asks clarification or inquiry-oriented questions
- learner uses mini-explain to connect behavior with concept
- learner chooses next milestone based on project flowchart

## 13.4 Motivation / Ownership 指标

- project continuation after first preview
- voluntary flowchart edits
- learner renaming / customizing project elements
- rejection or revision of AI suggestions
- return sessions
- sharing or presentation of artifact

---

# 14. Boundary Conditions to Test

Short paper 明确提出本框架可能失败的条件。因此 PRD 必须将这些作为产品风险，而不是附属备注。

## 14.1 Overlarge milestones

风险：milestone 太大，导致 AI 需要生成过多代码，学生失去理解。

缓解：

- 自动检测 milestone 是否包含多个 visible behaviors
- 提示拆分
- 默认推荐 first visible behavior

## 14.2 Over-optioning

风险：AI 给太多路径选项，增加 cognitive load，削弱 autonomy。

缓解：

- 每次只给 2–4 个 path options
- 始终提供 free input
- 允许 “I’m not sure”

## 14.3 Checklist-as-rubric

风险：done checklist 被体验为评分表，导致 informal creative programming 变得 school-like。

缓解：

- 文案使用 “done when” 而非 “criteria / rubric”
- 不给分、不评级
- 只保留 observable behavior

## 14.4 Checklist fatigue

风险：过多 checklist prompts 打断创作 momentum。

缓解：

- 只在 milestone start 和 preview comparison 使用
- 不在视觉小改动中频繁触发
- 允许 compact mode

## 14.5 Weak previews

风险：preview 不足以呈现行为差异，debugging 仍然回到抽象错误日志。

缓解：

- preview surface 作为核心界面
- checklist-linked preview testing
- before / after comparison
- screenshot / state capture

## 14.6 Mentor over-direction

风险：mentor 过度介入，把 learner-owned progression 变成成人计划。

缓解：

- mentor 只在 planning impasses 接入
- mentor UI 显示 “support without task takeover”
- mentor action 以比较路径和提问为主

## 14.7 Complete-solution AI before criteria

风险：AI 在 learner articulate criteria 之前给出完整 solution。

缓解：

- gating：no done checklist, no broad implementation help
- patch scope 必须绑定 milestone
- AI response 需说明对应 checklist item

---

# 15. 设计语气与文案原则

## 15.1 语气

- supportive
- concise
- not childish
- not teacher-like
- not evaluator-like
- project-centered
- choice-oriented

## 15.2 推荐文案

```text
What do you want someone to see or do first?
```

```text
Let’s turn your idea into a project flowchart.
```

```text
Which path feels closest to what you want to make?
```

```text
What should visibly change in this milestone?
```

```text
Done when...
```

```text
Let’s compare what you expected with what happened in preview.
```

```text
Which checklist item did not happen yet?
```

```text
This fix connects the button click to showing the first question.
```

```text
What do you want to make happen next?
```

## 15.3 避免文案

避免：

```text
I will build the whole project for you.
```

改为：

```text
Let’s choose the next visible milestone first.
```

避免：

```text
Write the quiz logic.
```

改为：

```text
When I press Start, the first question appears.
```

避免：

```text
Please complete this reflection activity.
```

改为：

```text
What changed in the preview after this fix?
```

---

# 16. 示例用户旅程

## 16.1 Scenario A：School Quiz Game

### Step 1：Idea

Learner：

```text
I want to make a quiz game about my school.
```

AI：

```text
Great. Let’s imagine the finished game first.
What should a player see first?
A. A title screen with a Start button
B. A question right away
C. A menu of quiz topics
D. I want to describe it myself
```

### Step 2：Project Flowchart

AI proposes:

```text
Possible flowchart:
Start screen
→ One playable question
→ Answer feedback
→ Score
→ More questions
→ Styling
```

Learner edits:

```text
I want the first question to have four choices.
```

### Step 3：Bounded Milestone

System suggests:

```text
First milestone:
When I press Start, the first question appears with four answer choices.
```

### Step 4：Done Checklist

```text
Done when:
□ Start button appears
□ Pressing Start shows one question
□ The question has four answer choices
□ The answer is not shown yet
```

### Step 5：Logic Sketch

```text
Player clicks Start
→ game state changes to question
→ first question is selected
→ four choices are displayed
```

### Step 6：Build + Preview

AI generates a small patch.

Preview shows question but no choices.

### Step 7：Fix Observed Behavior

AI：

```text
The question appeared, but the answer choices did not.
Which checklist item failed?
```

Learner selects:

```text
The question has four answer choices.
```

AI points to missing step in logic sketch and proposes small fix.

### Step 8：Mini-explain

```text
The Start button changed the screen state, and the fixed step now displays the answer choices. This is an example of event handling and state.
```

### Step 9：Choose Next Milestone

```text
What do you want to make happen next?
A. Show feedback after an answer
B. Keep score
C. Add more questions
D. Edit the flowchart
```

---

## 16.2 Scenario B：Club Volunteer Task App

### Step 1：Idea

Learner：

```text
I want to make a mini-app for our club volunteer tasks.
```

### Step 2：Project Flowchart

AI helps reverse-plan:

```text
Display tasks
→ Add new task
→ Mark task as done
→ Filter by date
→ Share app
```

### Step 3：Planning Impasse

Learner：

```text
Should storage be part of the first milestone?
```

System invites mentor / facilitator support:

```text
A mentor can help compare two paths:
A. Keep the first milestone visual and temporary
B. Expand it to include persistent storage
```

### Step 4：First Milestone

```text
Three volunteer tasks appear, each has a date, and I can add a new task in preview.
```

### Step 5：Preview Behavior

After build, new tasks disappear after refresh.

AI frames observed behavior:

```text
The task appears while the app is open, but disappears after refresh.
This is a difference between temporary interface state and persistent storage.
```

Mini-explain connects behavior to state vs. storage.

---

# 17. 后续版本路线

## V1.0：Core Goal-to-Milestone MVP

- idea-first entry
- project flowchart construction
- bounded milestone selection
- done checklist
- logic sketch
- AI patch
- live preview
- observed behavior debugging
- mini-explain
- next milestone
- version checkpoint

## V1.1：Flowchart and Mentor Enhancements

- visual project flowchart editor
- path comparison mode
- mentor support requests
- flowchart revision history
- planning impasse detection

## V1.2：Richer Representations

- state diagrams
- card-based logic sketch
- Scratch-like block view
- JS/code view toggle
- before/after preview comparison

## V2：Hybrid Learning Ecosystem

- optional parent/mentor view
- project gallery
- club / maker-space mode
- teacher optional assignment wrapper
- empirical research dashboard

---

# 18. 当前 PRD 核心结论

本产品的核心不是：

```text
prompt → code → working app
```

而是：

```text
learner idea → project flowchart → next bounded milestone → criteria → logic → build → preview → observed behavior fix → mini-explain → next milestone
```

最重要的产品创新是：

1. **Project flowchart as pre-code scaffold**
2. **Next bounded milestone as unit of AI support**
3. **Done checklist as shared reference, not rubric**
4. **Logic sketch as planning-monitoring artifact**
5. **Preview-driven debugging from observed behavior**
6. **Mini-explain as lightweight metacognitive bridge**
7. **Mentor / facilitator support at planning impasses, without task takeover**

最终产品体验应让学习者感觉：

> 这个项目是我想做的；路线是我和 AI 一起规划的；每一步我知道要让什么发生；当它没有按预期运行时，我知道看哪里；我不是让 AI 直接替我完成，而是在 AI 帮助下持续决定下一步。

