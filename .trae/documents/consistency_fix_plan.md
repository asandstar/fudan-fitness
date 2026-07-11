# 全面一致性修复计划（软件工程视角）

## 一、现状分析

项目使用 **CSS 变量 + `[data-theme="dark"]`** 实现主题切换，但存在大量一致性问题。从产品推向市场的标准来看，以下问题会导致用户体验割裂、维护困难、暗色模式失效。

---

## 二、问题清单与修复方案

### A. 暗色模式一致性（Critical）

#### A1. gym-map/page.tsx 完全使用 Tailwind `dark:` 前缀（~59处）
- **影响**：手动切换暗色模式时，gym-map 页面不会变暗（`dark:` 依赖 `prefers-color-scheme`，与项目的 `[data-theme="dark"]` 不联动）
- **修复**：全部替换为 CSS 变量系统
- **文件**：`src/app/gym-map/page.tsx`

| 原模式 | 替换为 |
|--------|--------|
| `bg-gray-50 dark:bg-gray-900` | `bg-bg` |
| `bg-white dark:bg-gray-800` | `bg-surface` / `card` |
| `text-gray-900 dark:text-white` | `text-text-primary` |
| `text-gray-500 dark:text-gray-400` | `text-text-secondary` |
| `text-gray-600 dark:text-gray-300` | `text-text-secondary` |
| `text-gray-700 dark:text-gray-200` | `text-text-primary` |
| `border-gray-200 dark:border-gray-700` | `border-border-light` |
| `bg-blue-600` | `bg-primary` |
| `bg-blue-50 dark:bg-blue-500/20` | `bg-primary-50` |
| `text-blue-600 dark:text-blue-400` | `text-primary` |
| `bg-green-50 dark:bg-green-500/20` | `bg-success/10` |
| `text-green-600` | `text-success` |
| `bg-orange-50 dark:bg-orange-500/20` | `bg-warning/10` |
| `text-orange-600` | `text-warning` |
| 布局 `max-w-6xl mx-auto px-4` | `max-w-content mx-auto px-6` |
| 自定义 `rounded-2xl shadow-lg border` | `card` CSS class |

#### A2. 硬编码状态色在暗色模式下不可读（~55处）
- **影响**：`text-emerald-700`（深绿色文字）在暗色背景上几乎不可见，`text-amber-700`、`text-blue-700` 同理
- **修复**：在 `globals.css` 中新增语义状态色工具类，暗色模式下自动切换为浅色

```css
/* globals.css 新增 */
.text-status-success { color: #059669; }
.text-status-warning { color: #B45309; }
.text-status-info { color: #1D4ED8; }
[data-theme="dark"] .text-status-success { color: #6EE7B7; }
[data-theme="dark"] .text-status-warning { color: #FCD34D; }
[data-theme="dark"] .text-status-info { color: #93C5FD; }
```

**全局替换映射**（影响文件及行数）：

| 硬编码 | 替换为 | 出现次数 |
|--------|--------|---------|
| `text-emerald-700` / `text-emerald-600` | `text-status-success` | ~28处 |
| `text-amber-700` / `text-amber-600` / `text-amber-500` | `text-status-warning` | ~14处 |
| `text-blue-700` / `text-blue-600` | `text-status-info` | ~5处 |
| `bg-emerald-100` | `bg-success/20` | ~3处 |
| `bg-amber-100` | `bg-warning/20` | ~2处 |

**涉及文件**：
- `src/lib/constants.ts`（STATUS_COLORS）
- `src/components/ui/VenueCard.tsx`
- `src/components/ui/VenueHeatmap.tsx`
- `src/components/ui/NotificationCenter.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/TimeSlotGrid.tsx`
- `src/app/page.tsx`
- `src/app/venues/page.tsx`
- `src/app/booking/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/coach-center/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/match/page.tsx`
- `src/app/equipment/page.tsx`

#### A3. constants.ts 中 STATUS_COLORS 硬编码
- **修复**：
  - `bg-success/30 text-emerald-700` → `bg-success/20 text-status-success`
  - `bg-gray-100 text-gray-600` → `bg-bg-warm text-text-secondary`
  - `bg-gray-100 text-gray-500` → `bg-bg-warm text-text-tertiary`

#### A4. Toast 组件硬编码颜色
- **文件**：`src/components/ui/Toast.tsx`
- **修复**：
  - `bg-success/95 text-emerald-900` → `bg-success/95 text-white`
  - `bg-info/95 text-blue-900` → `bg-info/95 text-white`

### B. 布局与组件一致性（High）

#### B1. gym-map 页面布局与其他页面不一致
- 其他页面统一使用 `max-w-content mx-auto px-6` + `card` 组件
- gym-map 使用 `max-w-6xl mx-auto px-4` + 自定义样式
- gym-map 有独立 header，其他页面用全局 NavBar
- **修复**：在任务 A1 中一并统一

#### B2. 步骤指示器不一致
- booking 页面步骤指示器：`bg-success text-emerald-700`（完成步骤绿色文字在绿底上）
- match 页面步骤指示器：同样的 `bg-success text-emerald-700`
- **修复**：完成步骤应使用 `bg-success text-white`，与选中步骤 `bg-primary text-white` 保持一致

#### B3. "可预约"徽章颜色不一致
- `src/app/booking/page.tsx:285` 使用 `bg-success/30 text-emerald-700`
- `src/app/venues/page.tsx:257` 使用 `bg-success/30 text-emerald-700`
- **修复**：统一为 `bg-success/20 text-status-success`

### C. 类型安全（Medium）

#### C1. matchCoaches 函数使用 `any[]` 参数类型
- **文件**：`src/lib/utils.ts:203-206`
- `matchCoaches(coaches: any[], preferences)` 应使用 `CoachProfile[]`
- 内部有 `(s: string)`, `(vId: string)` 等隐式 any
- **修复**：使用 `CoachProfile` 类型替代 `any[]`

#### C2. MatchPage results 使用 `any[]`
- **文件**：`src/app/match/page.tsx:44`
- `const [results, setResults] = useState<any[]>([])` 应使用 `CoachMatchResult[]`
- **修复**：引入 `CoachMatchResult` 类型

#### C3. gender preference 的 `as any` 类型断言
- **文件**：`src/app/match/page.tsx:186`
- `option.value as any` 不安全
- **修复**：使用正确的联合类型 `'male' | 'female' | 'any'`

### D. 业务逻辑一致性（Medium）

#### D1. 预约页面和教练中心对"教练审核时限"的理解不一致
- booking 页面显示"教练 12h 内审核"
- 应确保 AppContext 中的 sweepExpired 使用同一常量 `COACH_REVIEW_HOURS`
- **验证**：已确认一致，无需修改

#### D2. 教练中心统计数据命名不统一
- **文件**：`src/app/coach-center/page.tsx`
- 使用 `text-emerald-700`、`text-blue-700` 等硬编码颜色表示统计数字
- **修复**：替换为 `text-status-success`、`text-status-info`

### E. VenueHeatmap 一致性（Low）

#### E1. tooltip 使用硬编码 `bg-gray-800`
- **文件**：`src/components/ui/VenueHeatmap.tsx`
- **修复**：改为 `bg-text-primary text-bg`，这样在暗色模式下自动为浅色背景深色文字

#### E2. 热力图状态文字颜色仍使用硬编码
- `text-emerald-700`, `text-emerald-600`, `text-amber-600` 等在 getHeatLabel 函数中
- **修复**：替换为 `text-status-success`, `text-status-warning`

---

## 三、执行步骤

1. **步骤1**：在 `globals.css` 中添加 `.text-status-success` / `.text-status-warning` / `.text-status-info` 语义工具类
2. **步骤2**：修复 `constants.ts` 中 STATUS_COLORS
3. **步骤3**：全局替换硬编码状态色（涉及14个文件，按文件逐个修改）
4. **步骤4**：重写 `gym-map/page.tsx`，消除所有 `dark:` 前缀和硬编码颜色
5. **步骤5**：修复 Toast 组件颜色
6. **步骤6**：修复步骤指示器（booking + match 页面）
7. **步骤7**：修复类型安全问题（utils.ts + match/page.tsx）
8. **步骤8**：修复 VenueHeatmap tooltip
9. **步骤9**：构建验证 + 部署

---

## 四、验证步骤

1. 亮色模式：所有页面颜色风格统一，无突兀的灰色/蓝色
2. 暗色模式：gym-map 页面正确跟随暗色切换，所有状态色文字清晰可读
3. 状态徽章（成功/警告/信息）在两种模式下对比度足够
4. 步骤指示器完成态为白字绿底
5. TypeScript 编译无 `any` 类型警告
6. `npm run build` 零错误
