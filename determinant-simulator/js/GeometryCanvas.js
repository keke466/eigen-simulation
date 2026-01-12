// GeometryCanvas.js - 优雅的画布管理器（修改向量初始坐标为整数）
import { Vector } from './Vector.js';
import { Parallelogram } from './Parallelogram.js';

export class GeometryCanvas {
    constructor(canvasId, options = {}) {
        // 配置参数
        this.config = {
            width: 600,
            height: 500,
            gridSize: 50,
            backgroundColor: '#0a0f1e',
            axisColor: 'rgba(255, 255, 255, 0.6)',
            gridColor: 'rgba(255, 255, 255, 0.08)',
            tickColor: 'rgba(255, 255, 255, 0.4)',
            ...options
        };

        // 初始化画布
        this.canvas = document.getElementById(canvasId);
        this._setupCanvas();
        
        // 获取上下文
        this.ctx = this.canvas.getContext('2d');
        
        // 计算中心点
        this.center = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        
        // 初始化几何对象
        this._initGeometry();
        
        // 初始化状态
        this.draggingVector = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // 事件处理
        this._bindEvents();
        
        // 动画帧
        this.animationId = null;
        this.needsRedraw = true;
        
        // 开始动画循环
        this._animationLoop();
    }

    // ========== 初始化方法 ==========
    _setupCanvas() {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.canvas.style.cursor = 'default';
    }

    _initGeometry() {
        // 创建初始向量（修改：使用整数坐标）
        this.u = new Vector(100, 0, 'u', '#4cc9f0');
        this.v = new Vector(0, 100, 'v', '#f72585');
        
        // 创建平行四边形
        this.parallelogram = new Parallelogram(this.u, this.v);
        
        // 监听向量变化
        this.u.on('change', () => {
            this.needsRedraw = true;
            this._emit('vectorsUpdated');
        });
        
        this.v.on('change', () => {
            this.needsRedraw = true;
            this._emit('vectorsUpdated');
        });
    }

    // ========== 事件系统 ==========
    _bindEvents() {
        this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this._onMouseLeave.bind(this));
        
        // 触摸事件支持
        this.canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this._onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this._onTouchEnd.bind(this));
        
        // 阻止默认的触摸行为
        this.canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    }

    _onMouseDown(event) {
        const pos = this._getMousePos(event);
        this.lastMousePos = pos;
        
        // 检测点击的向量
        if (this.u.isPointInHandle(pos.x, pos.y, this.center.x, this.center.y, 8)) {
            this._startDragging(this.u, pos);
        } else if (this.v.isPointInHandle(pos.x, pos.y, this.center.x, this.center.y, 8)) {
            this._startDragging(this.v, pos);
        }
        
        // 更新光标样式
        this.canvas.style.cursor = this.isDragging ? 'grabbing' : 'default';
    }

    _onMouseMove(event) {
        const pos = this._getMousePos(event);
        
        // 悬停效果
        if (!this.isDragging) {
            const hoverU = this.u.isPointInHandle(pos.x, pos.y, this.center.x, this.center.y, 8);
            const hoverV = this.v.isPointInHandle(pos.x, pos.y, this.center.x, this.center.y, 8);
            
            this.canvas.style.cursor = hoverU || hoverV ? 'grab' : 'default';
            if (hoverU || hoverV) this.needsRedraw = true;
        }
        
        // 拖动处理（修改：拖动时会自动对齐到整数网格）
        if (this.isDragging && this.draggingVector) {
            const dx = pos.x - this.lastMousePos.x;
            const dy = pos.y - this.lastMousePos.y;
            
            this.draggingVector.updatePosition(
                pos.x, pos.y, 
                this.center.x, this.center.y
            );
            
            this.lastMousePos = pos;
            this.needsRedraw = true;
        }
    }

    _onMouseUp() {
        this._stopDragging();
    }

    _onMouseLeave() {
        this._stopDragging();
        this.canvas.style.cursor = 'default';
    }

    _onTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this._getTouchPos(touch);
            this._onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    _onTouchMove(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            this._onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    _onTouchEnd() {
        this._stopDragging();
    }

    // ========== 拖动控制 ==========
    _startDragging(vector, position) {
        this.draggingVector = vector;
        this.isDragging = true;
        vector.isDragging = true;
        this.lastMousePos = position;
        
        this._emit('dragStart', { vector });
        this.needsRedraw = true;
    }

    _stopDragging() {
        if (this.draggingVector) {
            this.draggingVector.isDragging = false;
            this._emit('dragEnd', { vector: this.draggingVector });
        }
        
        this.draggingVector = null;
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
        this.needsRedraw = true;
    }

    // ========== 渲染方法 ==========
    _animationLoop() {
        if (this.needsRedraw) {
            this._draw();
            this.needsRedraw = false;
        }
        
        this.animationId = requestAnimationFrame(() => this._animationLoop());
    }

    _draw() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制坐标系
        this._drawCoordinateSystem();
        
        // 绘制平行四边形
        this.parallelogram.draw(this.ctx, this.center.x, this.center.y, {
            showFill: true,
            showBorder: true,
            showGrid: true,
            showHighlight: this.isDragging
        });
        
        // 绘制向量
        this.u.draw(this.ctx, this.center.x, this.center.y, {
            showHandle: true,
            showLabel: true,
            showShadow: true,
            showArrow: true
        });
        
        this.v.draw(this.ctx, this.center.x, this.center.y, {
            showHandle: true,
            showLabel: true,
            showShadow: true,
            showArrow: true
        });
    }

    _drawCoordinateSystem() {
        const { ctx, canvas, center, config } = this;
        const { width, height } = canvas;
        
        // ===== 背景 =====
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // ===== 网格 =====
        ctx.strokeStyle = config.gridColor;
        ctx.lineWidth = 1;
        
        // 垂直网格线（修改：网格对齐整数坐标）
        for (let x = config.gridSize; x < width; x += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 水平网格线（修改：网格对齐整数坐标）
        for (let y = config.gridSize; y < height; y += config.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // ===== 坐标轴 =====
        ctx.strokeStyle = config.axisColor;
        ctx.lineWidth = 2;
        
        // X轴
        ctx.beginPath();
        ctx.moveTo(0, center.y);
        ctx.lineTo(width, center.y);
        ctx.stroke();
        
        // Y轴
        ctx.beginPath();
        ctx.moveTo(center.x, 0);
        ctx.lineTo(center.x, height);
        ctx.stroke();
        
        // ===== 刻度 =====
        ctx.strokeStyle = config.tickColor;
        ctx.lineWidth = 1;
        
        // X轴刻度（修改：显示整数刻度）
        for (let x = center.x - 200; x <= center.x + 200; x += 50) {
            if (x === center.x) continue;
            ctx.beginPath();
            ctx.moveTo(x, center.y - 5);
            ctx.lineTo(x, center.y + 5);
            ctx.stroke();
        }
        
        // Y轴刻度（修改：显示整数刻度）
        for (let y = center.y - 200; y <= center.y + 200; y += 50) {
            if (y === center.y) continue;
            ctx.beginPath();
            ctx.moveTo(center.x - 5, y);
            ctx.lineTo(center.x + 5, y);
            ctx.stroke();
        }
        
        // ===== 坐标轴标签（修改：显示整数刻度值）=====
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // X轴刻度标签
        for (let x = center.x - 200; x <= center.x + 200; x += 50) {
            if (x === center.x) continue;
            const value = (x - center.x) / 50;
            ctx.fillText(value.toString(), x, center.y + 15);
        }
        
        // Y轴刻度标签
        for (let y = center.y - 200; y <= center.y + 200; y += 50) {
            if (y === center.y) continue;
            const value = (center.y - y) / 50;
            ctx.fillText(value.toString(), center.x - 15, y);
        }
        
        // X轴标签
        ctx.fillText('x', width - 20, center.y - 15);
        
        // Y轴标签
        ctx.fillText('y', center.x + 15, 20);
        
        // 原点标签
        ctx.fillText('O', center.x - 15, center.y + 15);
    }

    // ========== 公共接口 ==========
    getVectorState() {
        return {
            u: { x: this.u.x, y: this.u.y }, // 修改：直接返回整数坐标
            v: { x: this.v.x, y: this.v.y }, // 修改：直接返回整数坐标
            area: this.parallelogram.area,
            geometricArea: this.parallelogram.geometricArea
        };
    }

    setVectorState(state) {
        this.u.x = Math.round(state.u.x); // 修改：设置为整数
        this.u.y = Math.round(state.u.y); // 修改：设置为整数
        this.v.x = Math.round(state.v.x); // 修改：设置为整数
        this.v.y = Math.round(state.v.y); // 修改：设置为整数
        this.needsRedraw = true;
        this._emit('vectorsUpdated');
    }

    reset() {
        this.setVectorState({
            u: { x: 100, y: 0 }, // 修改：重置为整数坐标
            v: { x: 0, y: 100 }  // 修改：重置为整数坐标
        });
    }

    // ========== 工具方法 ==========
    _getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    _emit(event, data = null) {
        const customEvent = new CustomEvent(event, { detail: data });
        window.dispatchEvent(customEvent);
    }

    // ========== 生命周期管理 ==========
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 移除事件监听器
        const events = ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 
                       'touchstart', 'touchmove', 'touchend'];
        events.forEach(event => {
            this.canvas.removeEventListener(event, this[`_on${event}`]);
        });
        
        this.u.off('change');
        this.v.off('change');
    }
}