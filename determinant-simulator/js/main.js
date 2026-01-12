// main.js - 优雅的主应用程序（修改坐标显示为整数）
import { GeometryCanvas } from './GeometryCanvas.js';
import { FormulaParser } from './formula-parser.js';
import { DOMUtils } from './utils.js';

class DeterminantSimulator {
    constructor() {
        // 配置
        this.config = {
            maxRecords: 10,
            animationDuration: 300,
            challengeThreshold: 0.1
        };
        
        // 状态
        this.recordedStates = [];
        this.challenges = {
            doubleArea: false,
            zeroArea: false,
            negativeArea: false
        };
        
        // 组件
        this.canvas = null;
        this.formulaParser = null;
        
        // 初始化
        this.init();
    }
    
    async init() {
        try {
            // 初始化组件
            await this.initComponents();
            
            // 初始化UI
            this.initUI();
            
            // 绑定事件
            this.bindEvents();
            
            // 初始状态
            this.recordCurrentState();
            
            // 调试信息
            console.log('✅ 行列式计算器已启动');
            
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            DOMUtils.showMessage('应用程序初始化失败，请刷新页面重试', 'error');
        }
    }
    
    async initComponents() {
        // 初始化画布
        this.canvas = new GeometryCanvas('geometry-canvas', {
            width: 600,
            height: 500,
            backgroundColor: '#0a0f1e'
        });
        
        // 初始化公式解析器
        this.formulaParser = new FormulaParser();
        
        // 监听向量更新
        window.addEventListener('vectorsUpdated', () => {
            this.updateCoordinateDisplay();
            this.checkChallenges();
            this.animateCoordinateUpdate();
        });
        
        // 监听拖动开始/结束
        window.addEventListener('dragStart', (event) => {
            document.getElementById('geometry-canvas').style.cursor = 'grabbing';
        });
        
        window.addEventListener('dragEnd', (event) => {
            document.getElementById('geometry-canvas').style.cursor = 'default';
        });
    }
    
    initUI() {
        // 更新初始坐标显示
        this.updateCoordinateDisplay();
        
        // 初始化记录表
        this.updateRecordTable();
        
        // 添加动画样式
        this.addAnimationStyles();
    }
    
    bindEvents() {
        // 公式验证
        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateFormula();
        });
        
        // 公式输入回车键
        document.getElementById('formula-input').addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.validateFormula();
            }
        });
        
        // 记录状态
        document.getElementById('btn-record').addEventListener('click', () => {
            this.recordCurrentState();
        });
        
        // 清空记录
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.clearRecords();
        });
        
        // 重置向量
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.canvas.reset();
        });
        
        // 下一幕按钮
        document.getElementById('btn-next-scene').addEventListener('click', () => {
            this.showNextScene();
        });
        
        // 挑战复选框（只读）
        document.querySelectorAll('.challenges input').forEach(checkbox => {
            checkbox.addEventListener('click', (event) => {
                event.preventDefault();
            });
        });
    }
    
    // ========== 坐标显示（修改：显示整数坐标）==========
    updateCoordinateDisplay() {
        const state = this.canvas.getVectorState();
        const elements = {
            'u-x': state.u.x.toString(), // 修改：直接显示整数，不保留小数
            'u-y': state.u.y.toString(), // 修改：直接显示整数，不保留小数
            'v-x': state.v.x.toString(), // 修改：直接显示整数，不保留小数
            'v-y': state.v.y.toString(), // 修改：直接显示整数，不保留小数
            'area-value': Math.abs(state.area).toFixed(2) // 面积仍保留2位小数
        };
        
        // 更新数值
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // 面积正负颜色
        const areaElement = document.getElementById('area-value');
        if (areaElement) {
            if (state.area > 0) {
                areaElement.style.color = '#2ecc71';
            } else if (state.area < 0) {
                areaElement.style.color = '#e74c3c';
            } else {
                areaElement.style.color = '#f1c40f';
            }
        }
    }
    
    animateCoordinateUpdate() {
        const elements = ['u-x', 'u-y', 'v-x', 'v-y', 'area-value'];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.transform = 'scale(1.1)';
                element.style.transition = 'transform 0.2s ease';
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }
    
    // ========== 记录管理（修改：记录整数坐标）==========
    recordCurrentState() {
        const state = this.canvas.getVectorState();
        
        // 限制记录数量
        if (this.recordedStates.length >= this.config.maxRecords) {
            this.recordedStates.shift();
        }
        
        // 添加新记录（修改：直接记录整数坐标）
        this.recordedStates.push({
            ...state,
            timestamp: new Date(),
            id: Date.now()
        });
        
        this.updateRecordTable();
        DOMUtils.showMessage('状态已记录到实验表中', 'success');
    }
    
    clearRecords() {
        if (this.recordedStates.length === 0) return;
        
        this.recordedStates = [];
        this.updateRecordTable();
        DOMUtils.showMessage('所有记录已清空', 'info');
    }
    
    updateRecordTable() {
        const tableBody = document.getElementById('record-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.recordedStates.forEach((state, index) => {
            const row = this.createRecordRow(state, index + 1);
            tableBody.appendChild(row);
        });
        
        // 填充空行
        const emptyRows = this.config.maxRecords - this.recordedStates.length;
        for (let i = 0; i < emptyRows; i++) {
            const row = this.createEmptyRow(this.recordedStates.length + i + 1);
            tableBody.appendChild(row);
        }
    }
    
    createRecordRow(state, number) {
        const row = document.createElement('tr');
        row.style.animation = 'fadeIn 0.5s ease';
        
        // 修改：显示整数坐标
        row.innerHTML = `
            <td class="record-number">${number}</td>
            <td class="record-vector">
                <span class="vector-u">(${state.u.x}, ${state.u.y})</span>
            </td>
            <td class="record-vector">
                <span class="vector-v">(${state.v.x}, ${state.v.y})</span>
            </td>
            <td class="record-area ${state.area >= 0 ? 'positive' : 'negative'}">
                ${state.area.toFixed(2)}
            </td>
            <td class="record-actions">
                <button class="btn-restore" title="恢复此状态">
                    <i class="fas fa-undo"></i>
                </button>
            </td>
        `;
        
        // 添加恢复功能
        const restoreBtn = row.querySelector('.btn-restore');
        restoreBtn.addEventListener('click', () => {
            this.restoreState(state);
        });
        
        return row;
    }
    
    createEmptyRow(number) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${number}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td></td>
        `;
        return row;
    }
    
    restoreState(state) {
        this.canvas.setVectorState(state);
        DOMUtils.showMessage('状态已恢复', 'success');
    }
    
    // ========== 挑战系统 ==========
    checkChallenges() {
        const state = this.canvas.getVectorState();
        
        // 挑战1: 面积变为2倍
        if (Math.abs(state.area - 2) < this.config.challengeThreshold) {
            this.completeChallenge('doubleArea', 'status-2x', '🎯 面积变成2倍挑战完成！');
        }
        
        // 挑战2: 面积变为0
        if (Math.abs(state.area) < this.config.challengeThreshold) {
            this.completeChallenge('zeroArea', 'status-zero', '🎯 面积变成0挑战完成！');
        }
        
        // 挑战3: 负面积
        if (state.area < -this.config.challengeThreshold) {
            this.completeChallenge('negativeArea', 'status-negative', '🎯 面积出现负值挑战完成！');
        }
    }
    
    completeChallenge(challengeKey, elementId, message) {
        if (this.challenges[challengeKey]) return;
        
        this.challenges[challengeKey] = true;
        
        // 更新UI
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('completed');
            element.style.animation = 'pulse 1s ease';
        }
        
        // 显示消息
        DOMUtils.showMessage(message, 'success');
        
        // 特殊效果
        if (challengeKey === 'negativeArea') {
            setTimeout(() => {
                this.showNegativeAreaExplanation();
            }, 1000);
        }
    }
    
    showNegativeAreaExplanation() {
        const explanation = DOMUtils.createElement('div', {
            id: 'negative-area-explanation',
            style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '30px',
                borderRadius: '15px',
                zIndex: '10000',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                animation: 'modalIn 0.5s ease'
            }
        }, [
            '<h3 style="color: #e74c3c; margin-bottom: 15px;">📐 负面积的几何意义</h3>',
            '<p style="margin-bottom: 15px; line-height: 1.6;">当向量<span style="color: #4cc9f0">u</span>和<span style="color: #f72585">v</span>的<span style="color: #f39c12">相对顺序</span>发生变化时，行列式的<span style="color: #e74c3c">符号</span>会反转。</p>',
            '<p style="margin-bottom: 20px; line-height: 1.6;">这反映了平行四边形在二维空间中的<span style="color: #2ecc71">定向</span>（orientation）。</p>',
            '<button id="close-explanation" style="padding: 10px 25px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">明白了</button>'
        ]);
        
        document.body.appendChild(explanation);
        document.getElementById('close-explanation').addEventListener('click', () => {
            explanation.style.animation = 'modalOut 0.3s ease';
            setTimeout(() => {
                if (explanation.parentNode) {
                    explanation.parentNode.removeChild(explanation);
                }
            }, 300);
        });
    }
    
    // ========== 公式验证 ==========
    async validateFormula() {
        const input = document.getElementById('formula-input');
        const formula = input.value.trim();
        const resultDiv = document.getElementById('validation-result');
        
        if (!formula) {
            this.showValidationResult('请输入公式', 'error');
            return;
        }
        
        // 显示加载状态
        this.showValidationResult('正在验证公式...', 'loading');
        
        try {
            // 模拟异步验证
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const validation = this.formulaParser.validateFormula(formula);
            
            if (validation.valid) {
                this.showValidationResult(validation.message, 'success');
                this.showSuccessCelebration(formula);
                this.recordCurrentState();
            } else {
                this.showValidationResult(validation.message, 'error', validation.details);
            }
            
        } catch (error) {
            console.error('验证失败:', error);
            this.showValidationResult('验证过程中发生错误', 'error');
        }
    }
    
    showValidationResult(message, type, details = []) {
        const resultDiv = document.getElementById('validation-result');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            loading: 'fa-spinner fa-spin'
        };
        
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            loading: '#3498db'
        };
        
        const icon = type === 'loading' ? 
            `<i class="fas ${icons[type]}"></i>` : 
            `<i class="fas ${icons[type]}" style="color: ${colors[type]};"></i>`;
        
        let html = `
            <div class="validation-result ${type}">
                ${icon}
                <span>${message}</span>
            </div>
        `;
        
        if (details && details.length > 0) {
            html += `
                <div class="validation-details">
                    <ul>
                        ${details.map(detail => `<li>${detail}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        if (type === 'error') {
            const hint = this.formulaParser.getHint(message);
            if (hint) {
                html += `
                    <div class="validation-hint">
                        <i class="fas fa-lightbulb"></i>
                        <span>${hint}</span>
                    </div>
                `;
            }
        }
        
        resultDiv.innerHTML = html;
    }
    
    showSuccessCelebration(formula) {
        // 创建彩色纸屑效果
        this.createConfetti();
        
        // 显示庆祝模态框
        const celebration = document.getElementById('discovery-celebration');
        if (celebration) {
            celebration.style.display = 'flex';
            setTimeout(() => {
                celebration.style.display = 'none';
            }, 3000);
        }
    }
    
    createConfetti() {
        const colors = ['#4cc9f0', '#f72585', '#4361ee', '#7209b7', '#3a0ca3', '#2ecc71'];
        const canvas = document.getElementById('geometry-canvas');
        const rect = canvas.getBoundingClientRect();
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    top: ${rect.top + canvas.height / 2}px;
                    left: ${rect.left + canvas.width / 2}px;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    z-index: 9999;
                    pointer-events: none;
                    transform: translate(0, 0) rotate(0deg);
                    animation: confetti-fall ${Math.random() * 1 + 0.5}s ease-out forwards;
                `;
                
                document.body.appendChild(confetti);
                
                // 动画结束后移除
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 2000);
            }, i * 30);
        }
    }
    
    // ========== 下一幕 ==========
    showNextScene() {
        DOMUtils.showMessage('即将进入第二幕：解密行列式！', 'info');
        // 这里可以添加跳转到下一幕的逻辑
    }
    
    // ========== 样式管理 ==========
    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.7); }
                70% { transform: scale(1.2); box-shadow: 0 0 0 15px rgba(76, 201, 240, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 201, 240, 0); }
            }
            
            @keyframes confetti-fall {
                0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                100% { transform: translate(${Math.random() * 400 - 200}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg); opacity: 0; }
            }
            
            @keyframes modalIn {
                from { opacity: 0; transform: translate(-50%, -60%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            
            @keyframes modalOut {
                from { opacity: 1; transform: translate(-50%, -50%); }
                to { opacity: 0; transform: translate(-50%, -40%); }
            }
            
            .record-number {
                font-weight: bold;
                color: #4cc9f0;
            }
            
            .record-area.positive {
                color: #2ecc71;
                font-weight: bold;
            }
            
            .record-area.negative {
                color: #e74c3c;
                font-weight: bold;
            }
            
            .btn-restore {
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .btn-restore:hover {
                background: #2980b9;
                transform: scale(1.1);
            }
            
            .validation-result {
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s;
            }
            
            .validation-result.success {
                background: rgba(46, 204, 113, 0.1);
                border: 2px solid rgba(46, 204, 113, 0.3);
            }
            
            .validation-result.error {
                background: rgba(231, 76, 60, 0.1);
                border: 2px solid rgba(231, 76, 60, 0.3);
            }
            
            .validation-result.loading {
                background: rgba(52, 152, 219, 0.1);
                border: 2px solid rgba(52, 152, 219, 0.3);
            }
            
            .validation-details {
                margin-top: 10px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 5px;
                font-size: 0.9em;
            }
            
            .validation-hint {
                margin-top: 10px;
                padding: 10px;
                background: rgba(241, 196, 15, 0.1);
                border: 1px solid rgba(241, 196, 15, 0.3);
                border-radius: 5px;
                color: #f1c40f;
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // ========== 清理 ==========
    destroy() {
        if (this.canvas) {
            this.canvas.destroy();
        }
        
        // 移除事件监听器
        const events = ['vectorsUpdated', 'dragStart', 'dragEnd'];
        events.forEach(event => {
            window.removeEventListener(event, this[`on${event}`]);
        });
    }
}

// 启动应用程序
document.addEventListener('DOMContentLoaded', () => {
    const app = new DeterminantSimulator();
    window.app = app; // 暴露到全局用于调试
    
    console.log('🎉 行列式计算器已启动');
    console.log('💡 提示：可以通过 window.app 访问应用程序实例');
});