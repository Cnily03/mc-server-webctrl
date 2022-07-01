# Minecraft 服务器 Web 控制端

基于 Node.js 的 Minecraft 服务端前端面板。

## 启动

```bash
npm run start
```

## 配置文件

位于`settings`文件夹下

- `cards` - 存放 Markdown 文件，用于首页的扩展卡片，以`.sm.md`为后缀的将展示为小卡片
- `translate` - 翻译文件夹
- `config.json` - 该应用程序的配置文件，包含一些重要的路径、参数等
- `sidebar.info.json` - 侧边栏设置
- `server.properties.reference.json` - Minecraft 服务器目录下 `server.properties` 文件的注释，用于前端可视化显示
