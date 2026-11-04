# 产品页 → 上游模型对照（内部）

最后更新：2026-11-03

对客文案不要暴露第三方引擎名（见 `AGENTS.md`）。本文仅供运维 / 开发对照。

## 路由规则

| 入口                           | 如何选 provider / model                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 首页 Generator（无 `product`） | `GENJUTSU_MOTION_PROVIDER` / `GENJUTSU_OBJECT_SWAP_PROVIDER` → `resolveGenjutsuProviderTarget(mode)`          |
| Allowlisted 趋势内页           | `resolveProductProviderTarget(product, mode)`：若设了 `GENJUTSU_PRODUCT_PROVIDER` 则用它，否则跟首页 mode env |
| 独立产品                       | 模块 constants 硬编码，不跟 Genjutsu env                                                                      |

配置来源：

- **生产**：`wrangler.jsonc` `vars`（经 `pnpm cf:deploy`）
- **本地**：`.env.development`

## 当前生产快照（2026-11-03）

```text
GENJUTSU_MOTION_PROVIDER=higgsfield
GENJUTSU_OBJECT_SWAP_PROVIDER=higgsfield
HIGGSFIELD_GENJUTSU_MOTION_MODEL=higgsfield/genjutsu-light/motion-transfer/v1.0
HIGGSFIELD_GENJUTSU_OBJECT_SWAP_MODEL=higgsfield/genjutsu-light/object-swap/v1.0
GENJUTSU_PRODUCT_PROVIDER=seedance-wavespeed
```

WaveSpeed 默认 model（`GENJUTSU_PRODUCT_PROVIDER=seedance-wavespeed` 时）：

- motion-transfer → `bytedance/seedance-2.5/motion-control`
- objects-swap → `bytedance/seedance-2.5/video-edit`

多数带 Seedance assert 的产品页在 generate 时要求 Seedance family；因此那些内页必须留在 `seedance-*`，不能只靠首页切 Light。例外：`glow-stick` / `tiny-desk-ai` / `chipmunks-dance` 已锁定 homepage Genjutsu Light（忽略 `GENJUTSU_PRODUCT_PROVIDER`）。

## A. Genjutsu 链（`/api/genjutsu/*`）

| 路径                                  | product id             | mode            | 解析                              | 生产 provider        | 生产 model                                       |
| ------------------------------------- | ---------------------- | --------------- | --------------------------------- | -------------------- | ------------------------------------------------ |
| `/`（首页）                           | —                      | motion-transfer | mode env                          | `higgsfield`         | `higgsfield/genjutsu-light/motion-transfer/v1.0` |
| `/`（首页）                           | —                      | objects-swap    | mode env                          | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/crazy-frog-ai`                      | `crazy-frog`           | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/smalltown-boy-dance`                | `smalltown-boy-dance`  | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/a2o-lite-ai`                        | `a2o-lite-ai`          | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/enzo-fernandez-ai`                  | `enzo-fernandez-ai`    | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/flying-car-ai`                      | `flying-car-ai`        | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/coldplay-kiss-cam`                  | `coldplay-kiss-cam`    | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/gangnam-style-ai`                   | `gangnam-style-ai`     | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/gas-station-dance-ai`               | `gas-station-dance-ai` | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/glow-stick-ai`                      | `glow-stick`           | objects-swap    | mode env（忽略 PRODUCT_PROVIDER） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/chipmunks-dance`                    | `chipmunks-dance`      | objects-swap    | mode env（忽略 PRODUCT_PROVIDER） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/burning-bridges-ai`                 | `burning-bridges-ai`   | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/say-it-right-ai`                    | `say-it-right-ai`      | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/ai-zombie-hug`                      | `zombie-hug`           | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/tiny-desk-ai`                       | `tiny-desk-ai`         | objects-swap    | mode env（忽略 PRODUCT_PROVIDER） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/shan-shen-bu`（`/shanshenbu` 别名） | `shan-shen-bu`         | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |

计费：首页走 Genjutsu（`higgsfield`）estimate / list；内页走 Seedance / WaveSpeed 报价。不为 Light 单独拆价。

## B. 独立产品（不跟 Genjutsu env）

| 路径                        | provider                | model                                                                                       |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `/hotel-lobby-ai`           | fal                     | `fal-ai/kling-video/o3/standard/video-to-video/edit`                                        |
| `/58th-floor-ai-video`      | fal（Hotel Lobby 面板） | 同上                                                                                        |
| `/bulin-47-ai`              | fal（Hotel Lobby 面板） | 同上                                                                                        |
| `/ai-rumpelstiltskin`       | fal（Hotel Lobby 面板） | 同上                                                                                        |
| `/h3-lab`                   | fal                     | `minimax/h3/reference-to-video`                                                             |
| `/kairo-bad-times`          | fal                     | 人：`fal-ai/kling-video/v3/standard/motion-control`；宠物：`fal-ai/bytedance/dreamactor/v2` |
| `/video-face-swap`          | wavespeed               | `wavespeed-ai/video-head-swap`                                                              |
| `/live-face-swap`           | fal                     | `decart/lucy-2-5/realtime`                                                                  |
| `/day-of-the-dead-ai-video` | wavespeed               | `bytedance/seedance-2.0/image-to-video-turbo`                                               |

## 维护

1. 改 `wrangler.jsonc` / `wrangler.example.jsonc` 的 Genjutsu vars 后，同步更新本文「生产快照」与表格 A。
2. 新增 Genjutsu 趋势页时：加入 `isGenjutsuProductId` allowlist，并在表格 A 补一行。
3. 历史任务按落库的 `provider` / `model` 轮询，不受当前 env 影响。
