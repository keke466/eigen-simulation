// Vector.js - 优雅的向量类（修改坐标为整数）
export class Vector {
    constructor(x = 0, y = 0, name = '', color = '#4cc9f0') {
        this.x = Math.round(x); // 修改：坐标取整
        this.y = Math.round(y); // 修改：坐标取整
        this.name = name;
        this.color = color;
        this.isDragging = false;
        this.radius = 15;
        this._handlers = new Map();
    }

    // ========== 核心属性 ==========
    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    set magnitude(value) {
        const current = this.magnitude;
        if (current > 0) {
            const scale = value / current;
            this.x = Math.round(this.x * scale); // 修改：坐标取整
            this.y = Math.round(this.y * scale); // 修改：坐标取整
            this._emit('change');
        }
    }

    get angle() {
        return Math.atan2(this.y, this.x);
    }

    // ========== 向量运算 ==========
    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    scale(scalar) {
        return new Vector(
            Math.round(this.x * scalar), // 修改：坐标取整
            Math.round(this.y * scalar)  // 修改：坐标取整
        );
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    normalize() {
        const mag = this.magnitude;
        if (mag > 0) {
            return new Vector(this.x / mag, this.y / mag);
        }
        return new Vector(0, 0);
    }

    // ========== 事件系统 ==========
    on(event, handler) {
        if (!this._handlers.has(event)) {
            this._handlers.set(event, []);
        }
        this._handlers.get(event).push(handler);
    }

    off(event, handler) {
        if (this._handlers.has(event)) {
            const handlers = this._handlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        }
    }

    _emit(event, data = null) {
        if (this._handlers.has(event)) {
            this._handlers.get(event).forEach(handler => handler(this, data));
        }
    }

    // ========== 几何检测 ==========
    isPointInHandle(pointX, pointY, centerX, centerY, tolerance = 5) {
        const handleX = centerX + this.x;
        const handleY = centerY - this.y; // 注意：画布坐标系Y向下为正
        
        const dx = pointX - handleX;
        const dy = pointY - handleY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (this.radius + tolerance);
    }

    updatePosition(newX, newY, centerX, centerY) {
        const oldX = this.x;
        const oldY = this.y;
        
        // 修改：将坐标四舍五入到最近的整数
        this.x = Math.round(newX - centerX);
        this.y = -Math.round(newY - centerY); // 反转Y轴并取整
        
        // 触发变化事件
        if (oldX !== this.x || oldY !== this.y) {
            this._emit('change', { old: { x: oldX, y: oldY }, new: { x: this.x, y: this.y } });
        }
        
        return this;
    }

    // ========== 渲染方法 ==========
    draw(ctx, centerX, centerY, options = {}) {
        const {
            showHandle = true,
            showLabel = true,
            showShadow = true,
            showArrow = true
        } = options;

        const handleX = centerX + this.x;
        const handleY = centerY - this.y;

        // 保存上下文状态
        ctx.save();

        // ===== 绘制向量线 =====
        if (showShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(handleX, handleY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.isDragging ? 4 : 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // ===== 绘制箭头 =====
        if (showArrow) {
            this._drawArrow(ctx, centerX, centerY, handleX, handleY);
        }

        // ===== 绘制手柄 =====
        if (showHandle) {
            // 手柄发光效果
            if (this.isDragging) {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // 手柄主体
            ctx.beginPath();
            ctx.arc(handleX, handleY, this.isDragging ? this.radius + 3 : this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.isDragging ? '#ffffff' : this.color;
            ctx.fill();

            // 手柄边框
            ctx.strokeStyle = this.isDragging ? '#ffeb3b' : '#ffffff';
            ctx.lineWidth = this.isDragging ? 3 : 2;
            ctx.stroke();

            // 手柄中心点
            if (this.isDragging) {
                ctx.beginPath();
                ctx.arc(handleX, handleY, 4, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        // ===== 绘制标签 =====
        if (showLabel) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const labelX = handleX + (this.x >= 0 ? 15 : -15);
            const labelY = handleY - 15;
            
            // 标签背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(labelX - 15, labelY - 10, 30, 20);
            
            // 标签文字（修改：显示整数坐标）
            const coordText = `${this.name.toUpperCase()}(${this.x}, ${this.y})`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(coordText, labelX, labelY);
        }

        // 恢复上下文状态
        ctx.restore();
    }

    _drawArrow(ctx, fromX, fromY, toX, toY) {
        const headLength = 15;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // 箭头翅膀
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // ========== 工具方法 ==========
    clone() {
        return new Vector(this.x, this.y, this.name, this.color);
    }

    toString(precision = 2) {
        return `Vector${this.name ? `(${this.name})` : ''}: (${this.x}, ${this.y})`; // 修改：显示整数
    }

    toObject() {
        return { x: this.x, y: this.y, name: this.name, color: this.color };
    }
}