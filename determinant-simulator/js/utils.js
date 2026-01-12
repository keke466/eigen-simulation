// utils.js - 工具函数集合
export class AnimationUtils {
    // 缓动函数
    static easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}

export class ColorUtils {
    // 生成随机颜色
    static randomColor(alpha = 1) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // 颜色渐变
    static gradient(startColor, endColor, percent) {
        const start = this.hexToRgb(startColor);
        const end = this.hexToRgb(endColor);
        
        const r = Math.round(start.r + (end.r - start.r) * percent);
        const g = Math.round(start.g + (end.g - start.g) * percent);
        const b = Math.round(start.b + (end.b - start.b) * percent);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

export class MathUtils {
    // 浮点数比较
    static approximately(a, b, epsilon = 0.001) {
        return Math.abs(a - b) < epsilon;
    }
    
    // 角度转弧度
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // 弧度转角度
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
}

export class DOMUtils {
    // 创建元素
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // 设置属性
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on')) {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // 添加子元素
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }
    
    // 显示消息
    static showMessage(message, type = 'info', duration = 3000) {
        const messageEl = this.createElement('div', {
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '15px 25px',
                borderRadius: '10px',
                backgroundColor: type === 'success' ? '#2ecc71' : 
                               type === 'error' ? '#e74c3c' : 
                               type === 'warning' ? '#f39c12' : '#3498db',
                color: 'white',
                zIndex: '10000',
                animation: 'slideIn 0.3s ease-out',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
            }
        }, [message]);
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, duration);
    }
}