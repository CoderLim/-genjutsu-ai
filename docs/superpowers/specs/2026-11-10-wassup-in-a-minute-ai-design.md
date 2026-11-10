# Wassup in a Minute AI — design

`/wassup-in-a-minute-ai/`：固定模版 + 用户上传 1–3 张参考图，按左/中/右槽位替换模版里对应人物。生成区对齐 tiny-desk-ai；API 走 homepage Genjutsu Light objects-swap（`/api/genjutsu/*`）。不新增独立产品 API。

源模版：`Wassup-in-a-Minute.mp4`（~1904×1088，~15s）——三人在湖边草坡同步摇摆，**不是** SEO 初稿里的白底二次元扇钞片。页正文按真实模版改写。

---

## 1. Decisions (locked)

| Topic              | Choice                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approach           | Clone **tiny-desk-ai** product-page pattern (module + panel + SEO sections + thin route)                                                                                      |
| Route / product id | `/wassup-in-a-minute-ai` · `wassup-in-a-minute-ai`（站内 URL 统一尾斜杠）                                                                                                     |
| Mode               | `objects-swap`                                                                                                                                                                |
| Provider           | Homepage objects-swap target via `resolveGenjutsuProviderTarget('objects-swap')`（同 tiny-desk / glow-stick：Higgs Light / genjutsu-light；忽略 `GENJUTSU_PRODUCT_PROVIDER`） |
| Aspect ratio       | Fixed **`16:9`**（跟模版；不对外写 9:16）                                                                                                                                     |
| Resolution         | `480p` \| `720p`，默认 `480p`；不上 1080p                                                                                                                                     |
| Photos             | **1–3**，槽位可跳填（只填中间只换中间）                                                                                                                                       |
| Template           | Server-owned `useDefaultTemplate` for full runs                                                                                                                               |
| Preview            | Yes — 可选预裁 4s clip；preview 强制 `480p`；客户端上传 trim 片 + 已填照片                                                                                                    |
| User prompt        | 不可编辑；服务端只接受 `buildWassupInAMinutePrompt(filledSlots)`（+ legacy 白名单）                                                                                           |
| SEO                | 本轮交付完整英文 SEO（改写后）；Title/H1 可保留趋势名                                                                                                                         |
| Shared framework   | Do **not** extract a FixedTemplate panel                                                                                                                                      |

### Photo slots (UI ↔ template first-screen positions)

UI 三格按首屏构图排成 **左 | 中 | 右**，与模版三人位置一一对应。

| Slot id  | UI     | Original-cast cues (identify only)                                                      |
| -------- | ------ | --------------------------------------------------------------------------------------- |
| `left`   | Left   | Dark curly hair, black t-shirt, red sneakers when visible — person on the left of frame |
| `center` | Center | Wavy brown hair / light beard, sage green crewneck sweatshirt — middle person           |
| `right`  | Right  | Short blonde hair, beige/tan fuzzy sweater, plaid trousers — person on the right        |

**Sparse fill (locked):** 任意非空子集，至少 1 张。例：只上传 center → 只替换中间人物；left+right 空则保留原片。不是 tiny-desk 式「从第 1 槽连续填」。

**`@Image` numbering:** 按 **左 → 中 → 右** 已填槽位顺序编号，并与上传 `images[]` 顺序一致。未填槽在 prompt 中写 keep original。

---

## 2. Scope

### In

- Module `src/modules/wassup-in-a-minute-ai/`（`constants`, `assert`, `provider`, `seo-pricing` + tests）
- `WassupInAMinuteGeneratorPanel`（tiny-desk 风格：模版预览 + 可跳填三槽 + Preview/Full）
- `WassupInAMinuteSeoSections` + route `src/routes/wassup-in-a-minute-ai.tsx`
- 接入 genjutsu：`workflow` / `types` / `storage` / `attempt` / `upload-url` / `seal-inputs` / `generate`
- 资产：`public/videos/wassup-in-a-minute-ai-tpl.mp4` + poster（+ 可选 `…-preview-4s.mp4`）
- R2 logical key：`genjutsu/templates/wassup-in-a-minute-ai.mp4`（`pnpm r2:put` → `pnpm r2:verify-templates`）
- Homepage Motion templates `href` 卡；sitemap / llms
- 内链 + 反向链：crazy-frog / tiny-desk / gas-station / gangnam / kairo / smalltown 页尾；`/genjutsu-prompts/`、`/video-face-swap`、`/live-face-swap`、`/a2o-lite-ai/`、`/pricing/`
- `site.wassup.*` / `site.templates.wassup_in_a_minute_ai` i18n（en 完整；其他 locale 至少标题/CTA 键，与项目惯例一致）

### Out

- 并行 `/api/wassup-*` 上传/seal/generate
- 用户自备 clip / Motion Transfer 产品形态
- 白底二次元扇钞 SEO 正文
- 1080p
- 抽取共享 FixedTemplate 框架
- 官方成片 demo 库（无素材时 Example 用模版 poster + 文案占位）

---

## 3. Product lock

`assertWassupInAMinuteAiInputs` 在 generate（及 preview）校验。attempt / upload-url 提前拒绝非法 mode / resolution / prompt。Generate 信任 **task options**，不只信 request body。

| Field       | Value                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| product     | `wassup-in-a-minute-ai`                                                  |
| mode        | `objects-swap`                                                           |
| aspectRatio | `16:9`                                                                   |
| resolution  | `480p` \| `720p`（full）；preview **必须** `480p`                        |
| images      | 1–3；每张对应一个已填槽；槽位集合决定 prompt                             |
| full run    | `useDefaultTemplate: true`，客户端不传视频                               |
| preview     | `preview: true`，trim 片 + 已填图；`useDefaultTemplate` 不为 true        |
| prompt      | `buildWassupInAMinutePrompt(filledSlots)` 精确匹配，或 `LEGACY_…` 白名单 |

Provider：`resolveWassupInAMinuteAiProviderTarget()` → `resolveGenjutsuProviderTarget(WASSUP_IN_A_MINUTE_AI_MODE)`。attempt 持久化 provider/model；后续步骤不得按 env 重绑。`assertWassupInAMinuteAiProviderBinding` 要求与 homepage objects-swap 目标一致。

---

## 4. Pipeline & template

Canonical chain（homepage parity）:

1. `POST /api/genjutsu/attempt`
2. `POST /api/genjutsu/upload-url`
3. Upload media（full：仅图片；preview：trim 视频 + 图片）
4. `POST /api/genjutsu/seal-inputs`（full：服务端封固定 R2 模版）
5. `POST /api/genjutsu/generate`
6. Poll `GET /api/genjutsu/status`

Template:

- Local display：`/videos/wassup-in-a-minute-ai-tpl.mp4` + poster（生成区不依赖 R2 redirect）
- Seal/generate：logical key `genjutsu/templates/wassup-in-a-minute-ai.mp4` via `resolveR2ObjectKey` → physical `uploads/…`
- Seed：`pnpm r2:put --key=genjutsu/templates/wassup-in-a-minute-ai.mp4 --file=public/videos/wassup-in-a-minute-ai-tpl.mp4`
- Verify：`pnpm r2:verify-templates`（App-path HEAD）。禁止 `wrangler r2 object put` 直接写 logical key。

Duration constant：ffprobe 写入 `WASSUP_IN_A_MINUTE_AI_TEMPLATE_DURATION_SECONDS`（约 15.02）。

---

## 5. Prompt builder

`buildWassupInAMinutePrompt(filled: ReadonlyArray<'left' | 'center' | 'right'>)`：

- `filled` 非空、无重复、仅合法 id
- 开头：一对一替换已列人物；保留草坡/湖/山、同步摇摆、机位、时长、构图
- 每条已填：`{cue} → @ImageN`（N 按左→中→右已填顺序）
- 未填：明确 keep that person unchanged
- 禁止合并身份；不超过 Genjutsu Light **2000** 字符

实现时根据抽帧润色 cue 文案；客户面不出现第三方引擎名。

---

## 6. UI / generator

对齐 tiny-desk 首屏结构：左（或上）模版预览，右（或下）槽位 + 分辨率 + Generate/Preview。

- 三槽 **左 | 中 | 右** 与首屏模版人物位置对应；可单独清空/替换
- Generate 需 ≥1 已填槽；按钮展示 `estimateGenjutsuCredits…` 现算积分
- 固定 prompt（只读或隐藏）；无用户自由文本
- 付费 Preview：优先用预裁 4s；否则客户端 trim 模版前 4s

---

## 7. SEO / content (rewritten)

**Meta**

- Title（≤60）：`Wassup in a Minute AI — Swap Your Character Into the Sway`
- Description：固定模版 + 1–3 张照片换人；节奏与户外场景保留；one-time credits，无订阅（字数贴近 ~150–160）
- H1：同 Title

**正文结构（英文，按真实模版）**

- Hero：固定 sway 模版已加载；填左/中/右槽；只换对应的人；16:9 · ~15s · 积分现算
- Example results：三张横屏卡 — 只换中 / 两人 / 三人全换；图注 AI-made, results vary
- What is the trend：名称来自误听歌词；本工具用的是三人户外同步摇摆模版（不写白底动画扇钞）
- Why clip-backed motion：运动来自固定模版，不是单图脑补动作
- How to：填槽 → 选分辨率 → 看积分 → Generate → 下载 16:9 MP4
- Prompts that work：教育向示例（产品仍锁固定 prompt）
- Good reference photo：一人、正脸、光线均匀；可用自己或已获授权的人
- Also called：wassup been a minute 等拼写变体
- Variants / Posting：横屏直发或裁切竖版；用平台正版曲库
- FAQ + Explore more +「不适合？看 face-swap / a2o」段
- JSON-LD：`FAQPage` + `BreadcrumbList`（Home → Motion templates → 本页）

**计价文案：** `seo-pricing.ts` 用 Light objects-swap + 模版时长现算；不写死初稿 579 credits / 5s / 竖屏。

**反向链接：** 首页 Motion templates；crazy-frog / tiny-desk / gas-station / gangnam / kairo / smalltown 页尾各加一次本页。

免责：独立工具，与原创作者 / Drake / 相关 IP 无关联；仅用有权使用的形象。

---

## 8. Testing & acceptance

- Unit：prompt builder（单槽中 / 左+右 / 全三）；assert 拒错 mode/resolution/错 prompt；provider binding；seo-pricing 数值稳定
- product-provider / product-template-key 回归加本 product
- Manual：跳填 center-only 可跑通 attempt→…→status；full 用 R2 模版
- `pnpm r2:verify-templates`；`pnpm build`
- 客户面无 Kling/Seedance/Fal/Higgsfield 等引擎名；无并行 wassup API 链

---

## 9. Implementation order

1. Copy/probe 模版 → public videos + poster（+ 可选 4s）
2. Module constants / prompt / assert / provider / seo-pricing + tests
3. Wire genjutsu product id + storage key + API branches
4. Generator panel + route + SEO sections + i18n
5. Motion templates + 互链 + sitemap/llms
6. R2 put + verify（用户执行付费/凭证相关步骤若需）
7. Build + smoke

---

## 10. Open points (non-blocking)

- Example demo MP4s：有素材再补；首发可用 poster 占位
- 非 en locale：标题键齐全即可；长 SEO 可先英文
- Preview 4s 资产：有则加路径常量；无则客户端 trim
