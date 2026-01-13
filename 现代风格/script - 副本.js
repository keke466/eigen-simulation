// ==================== 矩阵魔法锁实验室 - 完整版 ====================
// 设计理念：左实界（现实操作） | 中法则（矩阵锁） | 右虚界（理想映射）

// ==================== 全局变量 ====================
let currentSelectedLock = null;
let currentVector = [1, 0]; // 初始向量 [x, y]
let isDraggingVector = false;

// ==================== 矩阵锁类 ====================
class MatrixLock {
    constructor(name, initialMatrix) {
        this.name = name;
        this.matrix = initialMatrix.map(row => [...row]); // 深拷贝
        this.isLocked = true;
        this.rotationAngle = 0;
        this.isSelected = false;
        
        // 创建锁的DOM元素
        this.element = this.createLockElement();
        this.initInteractions();
        
        // 初始显示
        this.updateDisplay();
    }
    
    createLockElement() {
        const lockDiv = document.createElement('div');
        lockDiv.className = 'matrix-lock';
        lockDiv.setAttribute('data-name', this.name);
        
        lockDiv.innerHTML = `
            <div class="lock-frame">
                <!-- 外圈齿轮装饰 -->
                <div class="outer-gear gear-large">
                    <div class="gear-teeth"></div>
                    <div class="gear-teeth"></div>
                    <div class="gear-teeth"></div>
                    <div class="gear-teeth"></div>
                    <div class="gear-teeth"></div>
                </div>
                
                <div class="outer-gear gear-small">
                    <div class="gear-teeth"></div>
                    <div class="gear-teeth"></div>
                </div>
                
                <!-- 锁的主体 -->
                <div class="lock-body">
                    <!-- 矩阵显示区域（锁芯） -->
                    <div class="matrix-core">
                        <div class="matrix-grid lock-grid">
                            <!-- 矩阵单元格 -->
                            <div class="matrix-cell lock-cell" data-row="0" data-col="0">
                                <div class="cell-rim">
                                    <div class="cell-value" id="${this.name}-cell-00">0.0</div>
                                </div>
                            </div>
                            <div class="matrix-cell lock-cell" data-row="0" data-col="1">
                                <div class="cell-rim">
                                    <div class="cell-value" id="${this.name}-cell-01">0.0</div>
                                </div>
                            </div>
                            <div class="matrix-cell lock-cell" data-row="1" data-col="0">
                                <div class="cell-rim">
                                    <div class="cell-value" id="${this.name}-cell-10">0.0</div>
                                </div>
                            </div>
                            <div class="matrix-cell lock-cell" data-row="1" data-col="1">
                                <div class="cell-rim">
                                    <div class="cell-value" id="${this.name}-cell-11">0.0</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 锁芯中心 -->
                        <div class="lock-center">
                            <div class="lock-symbol">${this.name.charAt(this.name.length-1)}</div>
                            <div class="lock-keyhole"></div>
                        </div>
                    </div>
                    
                    <!-- 锁的状态指示 -->
                    <div class="lock-status">
                        <div class="status-light"></div>
                        <span class="status-text">锁定</span>
                    </div>
                </div>
                
                <!-- 锁的把手 -->
                <div class="lock-handle">↻</div>
            </div>
            
            <!-- 锁的控制面板 -->
            <div class="lock-controls">
                <h4>${this.name}</h4>
                <div class="matrix-inputs">
                    <input type="number" class="matrix-input" data-row="0" data-col="0" step="0.1">
                    <input type="number" class="matrix-input" data-row="0" data-col="1" step="0.1">
                    <br>
                    <input type="number" class="matrix-input" data-row="1" data-col="0" step="0.1">
                    <input type="number" class="matrix-input" data-row="1" data-col="1" step="0.1">
                </div>
                <button class="apply-matrix">应用矩阵</button>
            </div>
        `;
        
        return lockDiv;
    }
    
    initInteractions() {
        // 矩阵输入框事件
        const inputs = this.element.querySelectorAll('.matrix-input');
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            input.value = this.matrix[row][col].toFixed(1);
            
            input.addEventListener('change', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    this.matrix[row][col] = value;
                    this.updateDisplay();
                    this.onMatrixChanged();
                }
            });
        });
        
        // 应用按钮事件
        this.element.querySelector('.apply-matrix').addEventListener('click', () => {
            this.updateFromInputs();
        });
        
        // 锁把手拖拽事件
        this.setupHandleDrag();
        
        // 点击选择锁事件
        this.element.addEventListener('click', (e) => {
            // 避免点击控制面板时也触发选择
            if (!e.target.closest('.lock-controls')) {
                this.select();
            }
        });
    }
    
    setupHandleDrag() {
        const handle = this.element.querySelector('.lock-handle');
        let isDragging = false;
        let startAngle = 0;
        let startRotation = 0;
        
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            
            const rect = handle.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            startRotation = this.rotationAngle;
            
            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                
                const rect = handle.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                
                this.rotationAngle = startRotation + (angle - startAngle) * 180 / Math.PI;
                this.rotateLock();
            };
            
            const onMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.springBack();
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    rotateLock() {
        const lockFrame = this.element.querySelector('.lock-frame');
        lockFrame.style.transform = `rotate(${this.rotationAngle}deg)`;
    }
    
    springBack() {
        const lockFrame = this.element.querySelector('.lock-frame');
        const targetAngle = Math.round(this.rotationAngle / 45) * 45;
        
        lockFrame.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        lockFrame.style.transform = `rotate(${targetAngle}deg)`;
        
        setTimeout(() => {
            lockFrame.style.transition = '';
            this.rotationAngle = targetAngle;
        }, 300);
    }
    
    updateDisplay() {
        // 更新矩阵单元格显示
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const cellId = `${this.name}-cell-${i}${j}`;
                const cellElement = document.getElementById(cellId);
                if (cellElement) {
                    cellElement.textContent = this.matrix[i][j].toFixed(1);
                }
            }
        }
        
        // 更新输入框
        const inputs = this.element.querySelectorAll('.matrix-input');
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            input.value = this.matrix[row][col].toFixed(1);
        });
    }
    
    updateFromInputs() {
        const inputs = this.element.querySelectorAll('.matrix-input');
        let matrixChanged = false;
        
        inputs.forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            const value = parseFloat(input.value);
            
            if (!isNaN(value) && value !== this.matrix[row][col]) {
                this.matrix[row][col] = value;
                matrixChanged = true;
            }
        });
        
        if (matrixChanged) {
            this.updateDisplay();
            this.onMatrixChanged();
        }
    }
    
    onMatrixChanged() {
        // 齿轮动画
        this.rotateGears();
        
        // 播放声音
        this.playGearSound();
        
        // 重新锁定（如果之前解锁了）
        if (!this.isLocked) {
            this.lock();
        }
        
        // 触发全局矩阵变化事件
        if (typeof window.onMatrixChanged === 'function') {
            window.onMatrixChanged(this);
        }
        
        // 更新向量显示
        updateVectorDisplay(currentVector);
    }
    
    rotateGears() {
        const gears = this.element.querySelectorAll('.outer-gear');
        gears.forEach(gear => {
            const currentDuration = getComputedStyle(gear).animationDuration;
            const originalDuration = currentDuration || '20s';
            
            // 加速齿轮
            gear.style.animationDuration = '0.5s';
            
            setTimeout(() => {
                gear.style.animationDuration = originalDuration;
            }, 500);
        });
    }
    
    playGearSound() {
        // 简单的声音反馈
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log("音频上下文不支持:", e);
        }
    }
    
    unlock() {
        if (this.isLocked) {
            this.isLocked = false;
            
            const statusLight = this.element.querySelector('.status-light');
            const statusText = this.element.querySelector('.status-text');
            
            statusLight.classList.add('unlocked');
            statusText.textContent = '已解锁';
            
            this.playUnlockAnimation();
            this.playUnlockSound();
            
            console.log(`${this.name} 已解锁！发现特征向量！`);
        }
    }
    
    lock() {
        if (!this.isLocked) {
            this.isLocked = true;
            
            const statusLight = this.element.querySelector('.status-light');
            const statusText = this.element.querySelector('.status-text');
            
            statusLight.classList.remove('unlocked');
            statusText.textContent = '锁定';
        }
    }
    
    playUnlockAnimation() {
        const lockCenter = this.element.querySelector('.lock-center');
        lockCenter.style.animation = 'unlockAnimation 1s ease';
        
        setTimeout(() => {
            lockCenter.style.animation = '';
        }, 1000);
    }
    
    playUnlockSound() {
        // 播放解锁音效
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 播放一个和弦
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1 + index * 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1 + index * 0.1);
                
                oscillator.start(audioContext.currentTime + index * 0.05);
                oscillator.stop(audioContext.currentTime + 1 + index * 0.1);
            });
        } catch (e) {
            console.log("解锁音频播放失败:", e);
        }
    }
    
    select() {
        // 取消之前选中的锁
        if (currentSelectedLock && currentSelectedLock !== this) {
            currentSelectedLock.deselect();
        }
        
        // 选中当前锁
        this.isSelected = true;
        this.element.classList.add('selected');
        currentSelectedLock = this;
        
        console.log(`已选择: ${this.name}`);
        
        // 触发全局锁选择事件
        if (typeof window.onLockSelected === 'function') {
            window.onLockSelected(this);
        }
        
        // 更新向量显示
        updateVectorDisplay(currentVector);
    }
    
    deselect() {
        this.isSelected = false;
        this.element.classList.remove('selected');
    }
    
    // 重置矩阵
    reset() {
        this.matrix = [
            [1, 0],
            [0, 1]
        ];
        this.updateDisplay();
        this.onMatrixChanged();
        this.lock();
    }
}

// ==================== 特征向量检测函数 ====================
function checkEigenvector(vector, matrix) {
    // 计算 A·v
    const Av = [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
    ];
    
    // 计算向量长度
    const vLength = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    const AvLength = Math.sqrt(Av[0] * Av[0] + Av[1] * Av[1]);
    
    // 如果向量接近零向量，返回false
    if (vLength < 0.001 || AvLength < 0.001) {
        return { isEigenvector: false, eigenvalue: null, Av };
    }
    
    // 计算夹角余弦值
    const dotProduct = vector[0] * Av[0] + vector[1] * Av[1];
    const cosTheta = dotProduct / (vLength * AvLength);
    
    // 如果夹角很小（cosθ接近±1），认为是特征向量
    const tolerance = 0.02; // 稍微宽松一点
    const isEigenvector = Math.abs(Math.abs(cosTheta) - 1) < tolerance;
    
    // 计算特征值
    let eigenvalue = null;
    if (isEigenvector) {
        // 使用第一个非零分量计算λ
        if (Math.abs(vector[0]) > 0.001) {
            eigenvalue = Av[0] / vector[0];
        } else if (Math.abs(vector[1]) > 0.001) {
            eigenvalue = Av[1] / vector[1];
        } else {
            eigenvalue = 0;
        }
    }
    
    return { isEigenvector, eigenvalue, Av };
}

// ==================== 左侧实界函数 ====================
function initRealRealm() {
    const canvas = document.getElementById('realCanvas');
    if (!canvas) return;
    
    // 设置初始向量
    updateRealVector(currentVector);
    
    // 添加拖拽事件
    canvas.addEventListener('mousedown', startVectorDrag);
    canvas.addEventListener('touchstart', startVectorDragTouch);
    
    // 滑块事件
    const xSlider = document.getElementById('vecX');
    const ySlider = document.getElementById('vecY');
    
    if (xSlider && ySlider) {
        xSlider.addEventListener('input', () => {
            const x = parseFloat(xSlider.value) || 0;
            const y = parseFloat(ySlider.value) || 0;
            updateVectorDisplay([x, y]);
        });
        
        ySlider.addEventListener('input', () => {
            const x = parseFloat(xSlider.value) || 0;
            const y = parseFloat(ySlider.value) || 0;
            updateVectorDisplay([x, y]);
        });
        
        // 设置初始值
        xSlider.value = currentVector[0];
        ySlider.value = currentVector[1];
        
        // 更新显示值
        document.getElementById('vecXValue').textContent = currentVector[0];
        document.getElementById('vecYValue').textContent = currentVector[1];
    }
}

function startVectorDrag(e) {
    isDraggingVector = true;
    const canvas = document.getElementById('realCanvas');
    const rect = canvas.getBoundingClientRect();
    
    const updateVectorFromMouse = (clientX, clientY) => {
        const x = clientX - rect.left - canvas.width / 2;
        const y = canvas.height / 2 - (clientY - rect.top); // Canvas Y轴向下
        
        // 限制向量范围
        const maxRadius = canvas.width / 2 - 20;
        const distance = Math.sqrt(x * x + y * y);
        
        let newX = x;
        let newY = y;
        
        if (distance > maxRadius) {
            const scale = maxRadius / distance;
            newX = x * scale;
            newY = y * scale;
        }
        
        // 更新向量
        updateVectorDisplay([newX, newY]);
    };
    
    if (e.type === 'mousedown') {
        updateVectorFromMouse(e.clientX, e.clientY);
        
        const onMouseMove = (moveEvent) => {
            if (isDraggingVector) {
                updateVectorFromMouse(moveEvent.clientX, moveEvent.clientY);
            }
        };
        
        const onMouseUp = () => {
            isDraggingVector = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}

function startVectorDragTouch(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        isDraggingVector = true;
        const canvas = document.getElementById('realCanvas');
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        
        const updateVectorFromTouch = (clientX, clientY) => {
            const x = clientX - rect.left - canvas.width / 2;
            const y = canvas.height / 2 - (clientY - rect.top);
            
            const maxRadius = canvas.width / 2 - 20;
            const distance = Math.sqrt(x * x + y * y);
            
            let newX = x;
            let newY = y;
            
            if (distance > maxRadius) {
                const scale = maxRadius / distance;
                newX = x * scale;
                newY = y * scale;
            }
            
            updateVectorDisplay([newX, newY]);
        };
        
        updateVectorFromTouch(touch.clientX, touch.clientY);
        
        const onTouchMove = (moveEvent) => {
            if (isDraggingVector && moveEvent.touches.length === 1) {
                updateVectorFromTouch(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
            }
        };
        
        const onTouchEnd = () => {
            isDraggingVector = false;
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
        
        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);
    }
}

function updateRealVector(vector) {
    const canvas = document.getElementById('realCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawGrid(ctx, canvas, '#f0f0f0');
    
    // 绘制坐标轴
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // 绘制向量
    const scale = 1;
    const vectorX = vector[0] * scale;
    const vectorY = vector[1] * scale;
    
    // 绘制向量线
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + vectorX, centerY - vectorY);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 绘制向量终点
    ctx.beginPath();
    ctx.arc(centerX + vectorX, centerY - vectorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    
    // 显示坐标
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px Arial';
    ctx.fillText(`(${vector[0].toFixed(1)}, ${vector[1].toFixed(1)})`, 
                 centerX + vectorX + 10, centerY - vectorY - 10);
    
    // 更新滑块和显示值
    const xSlider = document.getElementById('vecX');
    const ySlider = document.getElementById('vecY');
    
    if (xSlider && ySlider) {
        xSlider.value = vector[0];
        ySlider.value = vector[1];
        
        document.getElementById('vecXValue').textContent = vector[0].toFixed(1);
        document.getElementById('vecYValue').textContent = vector[1].toFixed(1);
    }
    
    // 更新向量信息
    const length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    const angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
    
    document.getElementById('vectorLength').textContent = length.toFixed(2);
    document.getElementById('vectorAngle').textContent = angle.toFixed(1) + '°';
    document.getElementById('currentVectorDisplay').textContent = 
        `[${vector[0].toFixed(2)}, ${vector[1].toFixed(2)}]`;
}

// ==================== 右侧虚界函数 ====================
function updateIdealRealm(vector, result) {
    const canvas = document.getElementById('idealCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawGrid(ctx, canvas, '#f5f5f5');
    
    // 绘制坐标轴
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    const scale = 50; // 缩放因子
    
    // 绘制原始向量 v（蓝色）
    const vX = vector[0] * scale;
    const vY = vector[1] * scale;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + vX, centerY - vY);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX + vX, centerY - vY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    
    // 绘制 A·v（绿色/红色）
    if (result && result.Av) {
        const avX = result.Av[0] * scale;
        const avY = result.Av[1] * scale;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + avX, centerY - avY);
        ctx.strokeStyle = result.isEigenvector ? '#2ecc71' : '#e74c3c';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX + avX, centerY - avY, 6, 0, Math.PI * 2);
        ctx.fillStyle = result.isEigenvector ? '#2ecc71' : '#e74c3c';
        ctx.fill();
        
        // 如果接近特征向量，绘制虚线连接
        if (result.isEigenvector) {
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX + vX, centerY - vY);
            ctx.lineTo(centerX + avX, centerY - avY);
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 更新方程式显示
        updateEquationDisplay(vector, result);
        
        // 如果是特征向量，显示特征值和动画
        if (result.isEigenvector && result.eigenvalue !== null) {
            // 显示特征值λ
            document.getElementById('lambdaValue').textContent = result.eigenvalue.toFixed(2);
            
            // 显示λv
            const lambdaV = [result.eigenvalue * vector[0], result.eigenvalue * vector[1]];
            document.getElementById('lambdaV').textContent = 
                `[${lambdaV[0].toFixed(2)}, ${lambdaV[1].toFixed(2)}]`;
            
            // 显示成功状态
            document.getElementById('successState').style.display = 'block';
            document.getElementById('discoveredLambda').textContent = result.eigenvalue.toFixed(2);
            
            // 播放成功音乐
            playSuccessMusic();
            
            // 显示特征向量动画
            showEigenvalueAnimation(result.eigenvalue, vector, result.Av);
        } else {
            // 隐藏特征方程和成功状态
            document.getElementById('lambdaValue').textContent = '-';
            document.getElementById('lambdaV').textContent = '[ , ]';
            document.getElementById('successState').style.display = 'none';
        }
    }
    
    // 更新A·v结果
    if (result && result.Av) {
        document.getElementById('avResult').textContent = 
            `[${result.Av[0].toFixed(2)}, ${result.Av[1].toFixed(2)}]`;
    }
}

function updateEquationDisplay(vector, result) {
    const avResult = document.getElementById('avResult');
    const lambdaV = document.getElementById('lambdaV');
    const lambdaValue = document.getElementById('lambdaValue');
    const eigenEquation = document.getElementById('eigenEquation');
    
    if (result && result.Av) {
        avResult.textContent = `[${result.Av[0].toFixed(2)}, ${result.Av[1].toFixed(2)}]`;
        
        if (result.isEigenvector && result.eigenvalue !== null) {
            eigenEquation.style.display = 'block';
            lambdaValue.textContent = result.eigenvalue.toFixed(2);
            
            const lambdaVResult = [
                result.eigenvalue * vector[0],
                result.eigenvalue * vector[1]
            ];
            lambdaV.textContent = `[${lambdaVResult[0].toFixed(2)}, ${lambdaVResult[1].toFixed(2)}]`;
        } else {
            eigenEquation.style.display = 'none';
        }
    }
}

// ==================== 特征值动画 ====================
function showEigenvalueAnimation(lambda, vector, Av) {
    const canvas = document.getElementById('idealCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50;
    
    let animationFrame;
    let animationTime = 0;
    const totalAnimationTime = 2000; // 2秒
    
    function animate(timestamp) {
        if (!animationTime) animationTime = timestamp;
        const elapsed = timestamp - animationTime;
        const progress = Math.min(elapsed / totalAnimationTime, 1);
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 重新绘制背景
        drawGrid(ctx, canvas, '#f5f5f5');
        
        // 绘制坐标轴
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.stroke();
        
        // 绘制向量
        const vX = vector[0] * scale;
        const vY = vector[1] * scale;
        const avX = Av[0] * scale;
        const avY = Av[1] * scale;
        
        // 绘制原始向量
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + vX, centerY - vY);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX + vX, centerY - vY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
        
        // 绘制A·v（与v重合）
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + avX, centerY - avY);
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX + avX, centerY - avY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#2ecc71';
        ctx.fill();
        
        // 绘制λ符号动画
        const lambdaX = centerX + vX * 0.5;
        const lambdaY = centerY - vY * 0.5;
        
        const pulseScale = 1 + 0.3 * Math.sin(progress * Math.PI * 4);
        const opacity = progress < 0.5 ? progress * 2 : 1 - (progress - 0.5) * 2;
        
        ctx.save();
        ctx.translate(lambdaX, lambdaY);
        ctx.scale(pulseScale, pulseScale);
        ctx.globalAlpha = opacity;
        
        // 绘制λ符号
        ctx.font = 'bold 48px "Times New Roman", serif';
        ctx.fillStyle = '#f39c12';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('λ', 0, 0);
        
        // 绘制特征值
        ctx.font = '20px Arial';
        ctx.fillText(lambda.toFixed(2), 0, 35);
        
        ctx.restore();
        
        if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    // 启动动画
    animationFrame = requestAnimationFrame(animate);
    
    // 2秒后停止动画
    setTimeout(() => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        // 重新绘制正常状态
        if (currentSelectedLock) {
            const result = checkEigenvector(currentVector, currentSelectedLock.matrix);
            updateIdealRealm(currentVector, result);
        }
    }, totalAnimationTime);
}

// ==================== 成功音乐 ====================
function playSuccessMusic() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 播放胜利和弦（C大调）
        const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1 + index * 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1 + index * 0.1);
            
            oscillator.start(audioContext.currentTime + index * 0.05);
            oscillator.stop(audioContext.currentTime + 1 + index * 0.1);
        });
        
        console.log('播放成功音乐！');
    } catch (error) {
        console.log('无法播放音频:', error);
    }
}

// ==================== 通用函数 ====================
function drawGrid(ctx, canvas, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    
    const gridSize = 20;
    
    // 垂直线
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 水平线
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateVectorDisplay(vector) {
    // 更新当前向量
    currentVector = [vector[0], vector[1]];
    
    // 更新左侧实界
    updateRealVector(vector);
    
    // 如果有选中的矩阵锁，更新右侧虚界
    if (currentSelectedLock) {
        const result = checkEigenvector(vector, currentSelectedLock.matrix);
        updateIdealRealm(vector, result);
        
        // 如果是特征向量，解锁锁
        if (result.isEigenvector && result.eigenvalue !== null) {
            currentSelectedLock.unlock();
        } else {
            currentSelectedLock.lock();
        }
    } else {
        // 如果没有选中的锁，清空右侧显示
        const canvas = document.getElementById('idealCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid(ctx, canvas, '#f5f5f5');
        }
        
        // 清空方程显示
        document.getElementById('avResult').textContent = '[ , ]';
        document.getElementById('lambdaV').textContent = '[ , ]';
        document.getElementById('lambdaValue').textContent = '-';
        document.getElementById('successState').style.display = 'none';
    }
}

// ==================== 矩阵锁管理 ====================
function createMatrixLocks() {
    const lockContainer = document.getElementById('lockContainer');
    if (!lockContainer) return [];
    
    // 清空现有锁
    lockContainer.innerHTML = '';
    
    // 创建预设矩阵锁
    const locks = [
        new MatrixLock('锁 A', [[2, 0], [0, 3]]),       // 缩放矩阵
        new MatrixLock('锁 B', [[0.87, -0.5], [0.5, 0.87]]), // 旋转30度
        new MatrixLock('锁 C', [[1, 0.5], [0.5, 1]]),  // 剪切矩阵
        new MatrixLock('锁 D', [[3, 1], [1, 2]])        // 一般矩阵
    ];
    
    // 添加到容器
    locks.forEach(lock => {
        lockContainer.appendChild(lock.element);
    });
    
    // 默认选择第一个锁
    if (locks.length > 0) {
        locks[0].select();
    }
    
    return locks;
}

// ==================== 预设矩阵按钮 ====================
function initPresetButtons() {
    const presetButtons = {
        'identity': [[1, 0], [0, 1]],
        'rotation': [[0, -1], [1, 0]], // 90度旋转
        'scaling': [[2, 0], [0, 1.5]],
        'shear': [[1, 0.5], [0, 1]],
        'random': [
            [Math.random() * 4 - 2, Math.random() * 4 - 2],
            [Math.random() * 4 - 2, Math.random() * 4 - 2]
        ]
    };
    
    // 为每个预设按钮添加事件
    for (const [id, matrix] of Object.entries(presetButtons)) {
        const button = document.getElementById(`preset-${id}`);
        if (button) {
            button.addEventListener('click', () => {
                if (currentSelectedLock) {
                    currentSelectedLock.matrix = matrix.map(row => [...row]);
                    currentSelectedLock.updateDisplay();
                    currentSelectedLock.onMatrixChanged();
                }
            });
        }
    }
    
    // 庆祝按钮
    const celebrateBtn = document.getElementById('celebrateBtn');
    if (celebrateBtn) {
        celebrateBtn.addEventListener('click', playSuccessMusic);
    }
}

// ==================== 全局事件处理器 ====================
window.onMatrixChanged = function(lock) {
    // 矩阵改变时更新向量显示
    if (lock === currentSelectedLock) {
        updateVectorDisplay(currentVector);
    }
};

window.onLockSelected = function(lock) {
    // 锁被选中时更新向量显示
    updateVectorDisplay(currentVector);
};

// ==================== 初始化函数 ====================
function init() {
    console.log('初始化矩阵魔法锁实验室...');
    
    // 创建矩阵锁
    const locks = createMatrixLocks();
    console.log(`创建了 ${locks.length} 个矩阵锁`);
    
    // 初始化左侧实界
    initRealRealm();
    
    // 初始化预设按钮
    initPresetButtons();
    
    // 初始显示向量
    updateVectorDisplay(currentVector);
    
    console.log('系统初始化完成！');
}

// ==================== DOM加载完成后初始化 ====================
document.addEventListener('DOMContentLoaded', init);

// 导出全局函数（如果需要）
window.updateVectorDisplay = updateVectorDisplay;
window.checkEigenvector = checkEigenvector;
window.playSuccessMusic = playSuccessMusic;
