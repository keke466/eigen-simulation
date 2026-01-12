// Parallelogram.js - 优雅的平行四边形类
export class Parallelogram {
    constructor(u, v) {
        this.u = u;
        this.v = v;
        this.fillGradient = null;
        this.strokeColor = 'rgba(76, 201, 240, 0.7)';
        this.gridColor = 'rgba(255, 255, 255, 0.15)';
        this.highlightColor = 'rgba(255, 255, 255, 0.05)';
    }

    // ========== 几何属性 ==========
    get area() {
        // 有向面积（行列式）
        return this.u.cross(this.v);
    }

    get geometricArea() {
        // 几何面积（绝对值）
        return Math.abs(this.area);
    }

    get vertices() {
        const points = [
            { x: 0, y: 0 },                   // 原点
            { x: this.u.x, y: this.u.y },     // u向量端点
            { 
                x: this.u.x + this.v.x, 
                y: this.u.y + this.v.y        // u+v端点
            },
            { x: this.v.x, y: this.v.y }      // v向量端点
        ];
        
        return points;
    }

    get center() {
        const sum = this.vertices.reduce((acc, point) => {
            acc.x += point.x;
            acc.y += point.y;
            return acc;
        }, { x: 0, y: 0 });
        
        return {
            x: sum.x / 4,
            y: sum.y / 4
        };
    }

    // ========== 几何运算 ==========
    containsPoint(pointX, pointY, centerX, centerY) {
        // 将点转换到平行四边形坐标系
        const localX = pointX - centerX;
        const localY = -(pointY - centerY); // 反转Y轴
        
        // 使用重心坐标判断
        const u = this.u;
        const v = this.v;
        
        const det = u.x * v.y - u.y * v.x;
        if (Math.abs(det) < 0.001) return false; // 退化情况
        
        const a = (v.y * localX - v.x * localY) / det;
        const b = (-u.y * localX + u.x * localY) / det;
        
        return a >= 0 && a <= 1 && b >= 0 && b <= 1;
    }

    // ========== 渲染方法 ==========
    draw(ctx, centerX, centerY, options = {}) {
        const {
            showFill = true,
            showBorder = true,
            showGrid = true,
            showHighlight = false
        } = options;

        const vertices = this.getCanvasVertices(centerX, centerY);

        // 保存上下文状态
        ctx.save();

        // ===== 填充区域 =====
        if (showFill) {
            this._createGradient(ctx, vertices);
            
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            
            ctx.fillStyle = this.fillGradient;
            ctx.fill();
        }

        // ===== 高亮效果 =====
        if (showHighlight) {
            ctx.shadowColor = this.highlightColor;
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // ===== 边框 =====
        if (showBorder) {
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // ===== 网格线 =====
        if (showGrid) {
            this._drawGrid(ctx, vertices);
        }

        // 恢复上下文状态
        ctx.restore();
    }

    _createGradient(ctx, vertices) {
        // 创建优美的渐变填充
        const gradient = ctx.createLinearGradient(
            vertices[0].x, vertices[0].y,
            vertices[2].x, vertices[2].y
        );
        
        gradient.addColorStop(0, 'rgba(76, 201, 240, 0.25)');
        gradient.addColorStop(0.5, 'rgba(114, 9, 183, 0.15)');
        gradient.addColorStop(1, 'rgba(247, 37, 133, 0.25)');
        
        this.fillGradient = gradient;
    }

    _drawGrid(ctx, vertices) {
        const area = this.geometricArea;
        const gridCount = Math.min(20, Math.max(5, Math.floor(Math.sqrt(area) / 10)));
        
        if (gridCount <= 0) return;
        
        ctx.save();
        
        ctx.strokeStyle = this.gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        
        // 沿u方向绘制网格线
        for (let i = 1; i <= gridCount; i++) {
            const t = i / (gridCount + 1);
            
            ctx.beginPath();
            ctx.moveTo(
                vertices[0].x + (vertices[1].x - vertices[0].x) * t,
                vertices[0].y + (vertices[1].y - vertices[0].y) * t
            );
            ctx.lineTo(
                vertices[3].x + (vertices[2].x - vertices[3].x) * t,
                vertices[3].y + (vertices[2].y - vertices[3].y) * t
            );
            ctx.stroke();
        }
        
        // 沿v方向绘制网格线
        for (let i = 1; i <= gridCount; i++) {
            const t = i / (gridCount + 1);
            
            ctx.beginPath();
            ctx.moveTo(
                vertices[0].x + (vertices[3].x - vertices[0].x) * t,
                vertices[0].y + (vertices[3].y - vertices[0].y) * t
            );
            ctx.lineTo(
                vertices[1].x + (vertices[2].x - vertices[1].x) * t,
                vertices[1].y + (vertices[2].y - vertices[1].y) * t
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // ========== 工具方法 ==========
    getCanvasVertices(centerX, centerY) {
        return this.vertices.map(vertex => ({
            x: centerX + vertex.x,
            y: centerY - vertex.y // 注意：画布Y轴向下
        }));
    }

    toString(precision = 2) {
        return `Parallelogram: Area = ${this.area.toFixed(precision)}`;
    }
}