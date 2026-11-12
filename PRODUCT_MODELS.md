# 产品页 → 上游模型对照（内部）

最后更新：2026-11-12（此分支的目标路由；生产配置以实际部署为准）

对客文案不要暴露第三方引擎名（见 `AGENTS.md`）。本文仅供运维 / 开发对照。

## 路由规则

| 入口 | 如何选择 provider / model |
| --- | --- |
| 首页 Generator（无 `product`） | `resolveGenjutsuProviderTarget(mode)`：使用 `GENJUTSU_MOTION_PROVIDER` / `GENJUTSU_OBJECT_SWAP_PROVIDER` 和各自模型 env |
| 内页显式模型钉选 | 先查 `PRODUCT_GENJUTSU_MODEL_PROFILES`；命中则用配置中的 Standard / Light（同为 `higgsfield` provider） |
| 其他 allowlisted 内页 | 未命中钉选时走 `GENJUTSU_PRODUCT_PROVIDER`，未设时跟随首页 mode env |
| 独立产品 | 由独立模块配置，不跟 Genjutsu env |

**优先级：内页显式模型配置 > allowlisted 产品 provider env > 全局 mode env。** 内页配置见 `src/modules/genjutsu/model-config.ts`；`resolveProductProviderTarget(product, mode)` 统一路由。五个显式钉选的内页不会随着首页 env 切换 Standard / Light，也不会被 `GENJUTSU_PRODUCT_PROVIDER` 覆盖。其中四个使用 Light，`wassup-in-a-minute-ai` 使用 Standard。

配置来源：

- **生产**：`wrangler.jsonc` `vars`（经 `pnpm cf:deploy`）
- **本地**：`.env.development`

## 历史生产快照（2026-11-03，非本次部署验证结果）

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

多数带 Seedance assert 的产品页在 generate 时要求 Seedance family；不能只通过切首页 env 就把这些页面改为 Higgsfield Genjutsu。五个通过代码单独钉选模型的内页为：Light（`glow-stick`、`tiny-desk-ai`、`chipmunks-dance`、`bicep-heart`）以及 Standard（`wassup-in-a-minute-ai`）。

## A. Genjutsu 链（`/api/genjutsu/*`）

下表模型为上述历史 env 快照结合**本分支内页 pin 配置**推导的目标行为；不是 2026-11-12 线上实测快照。

| 路径                                  | product id             | mode            | 解析                              | 示例 provider        | 示例 model                                       |
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
| `/glow-stick-ai`                      | `glow-stick`           | objects-swap    | 内页 model profile（Light） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/chipmunks-dance`                    | `chipmunks-dance`      | objects-swap    | 内页 model profile（Light） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/burning-bridges-ai`                 | `burning-bridges-ai`   | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/say-it-right-ai`                    | `say-it-right-ai`      | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/ai-zombie-hug`                      | `zombie-hug`           | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/tiny-desk-ai`                       | `tiny-desk-ai`         | objects-swap    | 内页 model profile（Light） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/bicep-heart-ai`                     | `bicep-heart`          | objects-swap    | 内页 model profile（Light） | `higgsfield`         | `higgsfield/genjutsu-light/object-swap/v1.0`     |
| `/shan-shen-bu`（`/shanshenbu` 别名） | `shan-shen-bu`         | objects-swap    | product override                  | `seedance-wavespeed` | `bytedance/seedance-2.5/video-edit`              |
| `/wassup-in-a-minute-ai`             | `wassup-in-a-minute-ai` | objects-swap    | 内页 model profile（Standard）    | `higgsfield`         | `higgsfield/genjutsu/object-swap/v1.0`           |

计费：任何 Genjutsu 任务都在 attempt 时确定并持久化 `provider + model`。后续 estimate / submit / 轮询和积分结算使用该任务记录，不能因后续修改 env 或内页配置而改用新模型。

- Standard 和 Light 虽然共享 `provider=higgsfield`，**必须按 model 分别计费**；服务端优先请求真实 `POST /estimate/<model>`。
- 兜底价：Standard 沿用原费率，源视频最多 30s；Light 为 480p $0.05/s、720p $0.10/s、1080p $0.20/s，输入 + 输出两个时长计费，源视频最多取 15s。Light 兜底假设生成时长等于截取后的源视频时长，向上取整。
- 首页 `/api/config/public` 公开 motion 和 objects-swap 各自的 `provider` **及** `model`；`GeneratorPanel` 按实际模型显示完整生成和预览预估积分。五个钉选内页及其 SEO 价格同样按 model 报价。
- 真实计费可能与预估略有差异。不要使用 Standard 的 list rate 给 Light 兜底，反之亦然。

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

1. 修改 `wrangler.jsonc` / `wrangler.example.jsonc` 的 Genjutsu env 或 `PRODUCT_GENJUTSU_MODEL_PROFILES` 后，同步更新路由表；不要将历史快照误认为现网配置。
2. 新增 Genjutsu 趋势页时：加入 `isGenjutsuProductId` allowlist，并决定是否需要内页模型钉选。默认不钉选，沿用旧 env 路由。
3. 历史任务按落库的 `provider` / `model` 处理，不受后续 env 影响；五个钉选页的校验只接受 Higgsfield Genjutsu 的已知或当前配置模型组合，不适用于 Seedance 页。
4. 合入前按 `docs/genjutsu-product-model-routing-2026-11-12.md` 验证双模型同部署、首页两种 mode 报价、历史任务、预览以及真实计费。
