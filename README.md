# XAI2 加密货币交易应用

XAI2是一个基于Next.js开发的加密货币交易应用，提供代币搜索、市场排行榜、K线图表等功能。

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI库**：Tailwind CSS + shadcn/ui
- **图表**：Lightweight Charts
- **类型系统**：TypeScript
- **API集成**：Ave.ai API
- **错误处理**：自定义ErrorBoundary
- **性能监控**：自定义性能跟踪工具

## 项目结构

```
app/
  ├── api/                 # API路由
  │   ├── tokens/          # 代币数据API
  │   ├── token-details/   # 代币详情API
  │   └── token-kline/     # K线数据API
  ├── components/          # 组件
  │   ├── token-rankings/  # 代币排行组件(模块化)
  │   └── ui/              # UI组件
  ├── hooks/               # 自定义钩子
  ├── lib/                 # 业务逻辑库
  │   └── monitoring/      # 监控工具
  ├── types/               # 类型定义
  ├── utils/               # 工具函数
  └── constants/           # 常量定义
```

## 核心功能模块

### 1. 错误边界系统

应用实现了统一的错误边界组件，用于捕获和处理React渲染过程中的JavaScript错误。

```typescript
// 使用示例
<ErrorBoundary 
  filterErrors={(error) => error.message.includes('ethereum')}
  onError={(error, info) => logToService(error, info)}
>
  <YourComponent />
</ErrorBoundary>
```

### 2. 代币排行系统

代币排行模块采用了模块化设计，分离了视图和数据逻辑：

- `useTokenData` hook处理数据获取和状态管理
- 子组件处理不同的UI部分(TopicTabs, TokenCard等)
- 性能优化技术包括图像错误处理和懒加载

### 3. K线图表系统

K线图表系统基于LightweightCharts库，支持多种时间周期和指标：

- 支持实时数据更新
- 错误自动恢复机制
- 性能监控和诊断工具

### 4. API集成与缓存

项目使用Ave.ai API获取加密货币数据：

- 实现了API请求性能跟踪
- 错误处理和重试机制
- 本地缓存减少重复请求

## 主要组件说明

### ErrorBoundary

统一的错误边界组件，支持：

- 自定义错误UI
- 错误过滤器
- 重置功能
- 错误日志记录

```typescript
// 位置: app/components/ErrorBoundary.tsx
```

### TokenRankings

代币排行模块，采用模块化设计：

```typescript
// 位置: app/components/token-rankings/index.tsx
// 子组件: TokenCard.tsx, TopicTabs.tsx等
```

### 性能监控工具

自定义性能监控工具，支持组件渲染和API请求性能跟踪：

```typescript
// 位置: app/lib/monitoring/performance.ts
// 相关hook: app/hooks/usePerformanceTracking.ts
```

## API服务

项目的后端API服务包括：

### 1. 代币排行API

```
GET /api/tokens?topic={topicId}
```

返回指定主题的代币排行数据。

### 2. 代币详情API

```
GET /api/token-details?blockchain={chain}&address={tokenAddress}
```

返回指定代币的详细信息。

### 3. K线数据API

```
GET /api/token-kline?blockchain={chain}&address={tokenAddress}&timeframe={timeframe}
```

返回指定代币的K线数据。

## 开发指南

### 1. 环境配置

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm start
```

### 2. 添加新组件

遵循以下模式添加新组件：

1. 在`app/components`目录下创建组件文件
2. 如果是复杂组件，创建子目录并拆分成多个子组件
3. 使用ErrorBoundary包裹组件以确保错误不会级联
4. 使用usePerformanceTracking监控组件性能

### 3. API扩展

添加新的API端点：

1. 在`app/api`目录下创建新的路由文件
2. 使用监控工具包装API调用
3. 实现适当的错误处理和响应格式化

## 性能优化建议

1. **代码分割**：对大型组件使用动态导入
2. **图像优化**：继续优化图像加载和错误处理
3. **缓存策略**：实现更智能的API响应缓存
4. **预取数据**：为常用路由预取数据

## 安全考虑

1. **API密钥保护**：确保API密钥不暴露在前端代码中
2. **数据验证**：在API端点实现严格的输入验证
3. **错误消息**：确保生产环境中不暴露敏感错误信息

## 未来扩展

1. **用户认证系统**：实现用户登录和个人设置
2. **交易集成**：集成实际交易功能
3. **通知系统**：添加价格提醒和市场通知
4. **移动应用**：使用React Native开发移动应用

## 常见问题排查

1. **API请求失败**：检查API密钥和日志中的错误消息
2. **图表加载问题**：使用ChartDiagnostic组件调试
3. **组件错误**：查看ErrorBoundary捕获的错误信息

## 贡献指南

1. 创建功能分支
2. 遵循TypeScript类型定义
3. 确保代码符合项目结构和命名约定
4. 提交前进行测试

## 代码规范

1. 使用TypeScript类型注解
2. 使用功能组件和React Hooks
3. 保持组件小而聚焦
4. 防止业务逻辑与UI混合