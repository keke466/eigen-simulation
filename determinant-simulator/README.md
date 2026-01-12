# 二阶行列式可视化仿真

## 📐 项目简介
这是一个用于学习和理解二维行列式的交互式可视化工具。通过拖拽向量，可以直观地观察平行四边形的面积变化，从而理解行列式的几何意义。

## ✨ 功能特性
- 🎨 **精美可视化**：现代化UI设计，渐变色、阴影、动画效果
- 🖱️ **交互式操作**：拖拽向量手柄，实时更新
- 📊 **实时计算**：坐标和面积实时显示
- 📝 **公式验证**：验证行列式计算公式
- 📋 **实验记录**：保存和恢复不同状态
- 🏆 **挑战任务**：完成特定几何条件

## 🚀 快速开始
1. 克隆项目：`git clone https://gitee.com/keke466/determinant-simulator.git`
2. 进入目录：`cd determinant-simulator`
3. 启动HTTP服务器：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # 或者使用Node.js的http-server
   npx http-server