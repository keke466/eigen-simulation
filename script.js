// ============================================
// 矩阵奥秘实验室 - 交互逻辑文件
// 作者：AI助手
// 日期：2024年
// 功能：实现三界交互与特征向量检测
// 注释：详细说明每个函数的作用
// ============================================

// ==================== 全局变量与配置 ====================
// 这些变量存储应用的状态
let currentVector = [1, 0];                // 当前向量 [x, y]，初始为[1, 0]
let currentMatrix = [[2, 1], [1, 2]];      // 当前矩阵，默认对称矩阵
let isLocked = true;                       // 锁状态，true为锁定，false为解锁
let discoveryHistory = [];                 // 发现记录数组
const TOLERANCE = 0.02;                    // 特征向量检测的容差

// ==================== 初始化函数 ====================
// 页面加载完成后执行，初始化所有功能
function initializeLab() {
    console.log('🔧 初始化矩阵奥秘实验室...');
    
    // 1. 初始化矩阵显示
    updateMatrixDisplay();
    
    // 2. 初始化向量显示
    updateVectorDisplay();
    
    // 3. 初始化事件监听器
    setupEventListeners();
    
    // 4. 初始化画布
    initializeCanvases();
    
    // 5. 初始状态为锁定
    updateLockStatus(false);
    
    console.log('✅ 实验室初始化完成！');
}

// ==================== 矩阵操作函数 ====================
// 更新矩阵显示到界面
function updateMatrixDisplay() {
    // 更新矩阵输入框的值
    document.getElementById('matrixA11').value = currentMatrix[0][0];
    document.getElementById('matrixA12').value = currentMatrix[0][1];
    document.getElementById('matrixA21').value = currentMatrix[1][0];
    document.getElementById('matrixA22').value = currentMatrix[1][1];
    
    console.log('📊 矩阵已更新:', currentMatrix);
}

// 从界面读取矩阵值
function readMatrixFromInputs() {
    currentMatrix = [
        [parseFloat(document.getElementById('matrixA11').value) || 0,
         parseFloat(document.getElementById('matrixA12').value) || 0],
        [parseFloat(document.getElementById('matrixA21').value) || 0,
         parseFloat(document.getElementById('matrixA22').value) || 0]
    ];
    
    console.log('📝 从输入读取矩阵:', currentMatrix);
    return currentMatrix;
}

// 设置预设矩阵
function setPresetMatrix(type) {
    console.log('🔄 设置预设矩阵:', type);
    
    const presets = {
        identity: [[1, 0], [0, 1]],            // 单位矩阵
        rotation: [[0.87, -0.5], [0.5, 0.87]], // 旋转30度
        scaling: [[2, 0], [0, 1.5]],           // 缩放矩阵
        shear: [[1, 0.5], [0, 1]],             // 剪切矩阵
        random: [                               // 随机矩阵
            [Math.random() * 4 - 2, Math.random() * 4 - 2],
            [Math.random() * 4 - 2, Math.random() * 4 - 2]
        ]
    };
    
    if (presets[type]) {
        currentMatrix = presets[type];
        updateMatrixDisplay();
        updateLockStatus(false);  // 重置为锁定状态
        playGearSound();          // 播放齿轮声
        checkEigenvector();       // 重新检查特征向量
    }
}

// ==================== 向量操作函数 ====================
// 更新向量显示到界面
function updateVectorDisplay() {
    // 更新滑块值
    document.getElementById('vectorX').value = currentVector[0] * 100;
    document.getElementById('vectorY').value = currentVector[1] * 100;
    
    // 更新显示值
    document.getElementById('vectorXValue').textContent = (currentVector[0] * 100).toFixed(0);
    document.getElementById('vectorYValue').textContent = (currentVector[1] * 100).toFixed(0);
    
    // 计算向量信息
    const length = Math.sqrt(currentVector[0] ** 2 + currentVector[1] ** 2);
    const angle = Math.atan2(currentVector[1], currentVector[0]) * 180 / Math.PI;
    
    // 更新信息显示
    document.getElementById('vectorCoords').textContent = 
        `[${currentVector[0].toFixed(2)}, ${currentVector[1].toFixed(2)}]`;
    document.getElementById('vectorLength').textContent = length.toFixed(2);
    document.getElementById('vectorAngle').textContent = angle.toFixed(1) + '°';
    
    // 更新左侧画布
    drawForgeCanvas();
    
    // 检查是否是特征向量
    checkEigenvector();
}

// 从滑块读取向量值
function readVectorFromSliders() {
    const x = parseFloat(document.getElementById('vectorX').value) / 100;
    const y = parseFloat(document.getElementById('vectorY').value) / 100;
    currentVector = [x, y];
    
    console.log('📐 向量已更新:', currentVector);
    return currentVector;
}

// 重置向量为单位向量[1, 0]
function resetVector() {
    currentVector = [1, 0];
    updateVectorDisplay();
    console.log('🔄 向量已重置');
}

// 单位化向量（长度为1）
function normalizeVector() {
    const length = Math.sqrt(currentVector[0] ** 2 + currentVector[1] ** 2);
    if (length > 0) {
        currentVector = [currentVector[0] / length, currentVector[1] / length];
        updateVectorDisplay();
        console.log('📏 向量已单位化');
    }
}

// ==================== 特征向量检测 ====================
// 检查当前向量是否是特征向量
function checkEigenvector() {
    // 计算 A·v
    const Av = multiplyMatrixVector(currentMatrix, currentVector);
    
    // 检查是否为特征向量
    const result = isEigenvector(currentVector, Av, TOLERANCE);
    
    // 更新右侧画布
    drawTruthCanvas(currentVector, Av, result.isEigenvector);
    
    // 更新方程显示
    updateEquationDisplay(Av, result);
    
    // 如果是特征向量，解锁
    if (result.isEigenvector && result.eigenvalue !== null) {
        unlockMatrixLock(result.eigenvalue);
    } else {
        lockMatrixLock();
    }
    
    return result;
}

// 矩阵与向量乘法
function multiplyMatrixVector(matrix, vector) {
    return [
        matrix[0][0] * vector[0] + matrix[0][1] * vector[1],
        matrix[1][0] * vector[0] + matrix[1][1] * vector[1]
    ];
}

// 判断向量是否为特征向量
function isEigenvector(v, Av, tolerance = TOLERANCE) {
    // 计算向量长度
    const vLength = Math.sqrt(v[0] ** 2 + v[1] ** 2);
    const AvLength = Math.sqrt(Av[0] ** 2 + Av[1] ** 2);
    
    // 如果向量接近零向量，返回false
    if (vLength < 0.001 || AvLength < 0.001) {
        return { isEigenvector: false, eigenvalue: null };
    }
    
    // 计算夹角余弦值
    const dotProduct = v[0] * Av[0] + v[1] * Av[1];
    const cosTheta = dotProduct / (vLength * AvLength);
    
    // 检查是否共线（cosθ接近±1）
    const isCollinear = Math.abs(Math.abs(cosTheta) - 1) < tolerance;
    
    // 计算特征值
    let eigenvalue = null;
    if (isCollinear) {
        // 使用第一个非零分量计算λ
        if (Math.abs(v[0]) > 0.001) {
            eigenvalue = Av[0] / v[0];
        } else if (Math.abs(v[1]) > 0.001) {
            eigenvalue = Av[1] / v[1];
        }
    }
    
    return { isEigenvector: isCollinear, eigenvalue };
}

// ==================== 锁状态管理 ====================
// 更新锁的状态显示
function updateLockStatus(isUnlocked) {
    const lampFlame = document.getElementById('lampFlame');
    const statusText = document.getElementById('statusText');
    
    if (isUnlocked) {
        // 解锁状态
        lampFlame.classList.add('unlocked');
        statusText.textContent = '已匹配！';
        statusText.style.color = '#2ecc71';
        isLocked = false;
    } else {
        // 锁定状态
        lampFlame.classList.remove('unlocked');
        statusText.textContent = '等待特征向量...';
        statusText.style.color = '#e74c3c';
        isLocked = true;
    }
}

// 解锁矩阵锁
function unlockMatrixLock(lambda) {
    if (isLocked) {
        console.log('🔓 解锁矩阵锁，特征值 λ =', lambda.toFixed(2));
        
        // 更新锁状态
        updateLockStatus(true);
        
        // 显示λ符号
        showLambdaRevelation(lambda);
        
        // 显示成功状态
        showSuccessRevelation(lambda);
        
        // 记录发现
        recordDiscovery(lambda);
        
        // 播放音效
        playUnlockSound();
        
        // 更新特征值显示
        updateEigenvalueDisplay(lambda);
    }
}

// 锁定矩阵锁
function lockMatrixLock() {
    if (!isLocked) {
        console.log('🔒 锁定矩阵锁');
        updateLockStatus(false);
        hideLambdaRevelation();
        hideSuccessRevelation();
    }
}

// ==================== 显示更新函数 ====================
// 显示λ符号
function showLambdaRevelation(lambda) {
    const lambdaReveal = document.getElementById('lambdaReveal');
    const lambdaValueDisplay = document.getElementById('lambdaValueDisplay');
    
    lambdaValueDisplay.textContent = lambda.toFixed(2);
    lambdaReveal.classList.add('visible');
}

// 隐藏λ符号
function hideLambdaRevelation() {
    const lambdaReveal = document.getElementById('lambdaReveal');
    lambdaReveal.classList.remove('visible');
}

// 显示成功状态
function showSuccessRevelation(lambda) {
    const successRevelation = document.getElementById('successRevelation');
    const discoveredLambda = document.getElementById('discoveredLambda');
    
    discoveredLambda.textContent = lambda.toFixed(2);
    successRevelation.style.display = 'block';
}

// 隐藏成功状态
function hideSuccessRevelation() {
    const successRevelation = document.getElementById('successRevelation');
    successRevelation.style.display = 'none';
}

// 更新方程显示
function updateEquationDisplay(Av, result) {
    const avResult = document.getElementById('avResult');
    const lambdaVResult = document.getElementById('lambdaVResult');
    const eigenEquation = document.getElementById('eigenEquation');
    
    // 更新A·v结果
    avResult.textContent = `[${Av[0].toFixed(2)}, ${Av[1].toFixed(2)}]`;
    
    // 如果是特征向量，显示特征方程
    if (result.isEigenvector && result.eigenvalue !== null) {
        eigenEquation.style.display = 'flex';
        
        // 计算λ·v
        const lambdaV = [
            result.eigenvalue * currentVector[0],
            result.eigenvalue * currentVector[1]
        ];
        lambdaVResult.textContent = `[${lambdaV[0].toFixed(2)}, ${lambdaV[1].toFixed(2)}]`;
    } else {
        eigenEquation.style.display = 'none';
    }
}

// 更新特征值显示
function updateEigenvalueDisplay(lambda) {
    // 简单实现：只显示发现的λ
    document.getElementById('lambda1').textContent = lambda.toFixed(2);
    document.getElementById('lambda2').textContent = '-';
}

// ==================== 画布绘制函数 ====================
// 初始化画布
function initializeCanvases() {
    drawForgeCanvas();
    const Av = multiplyMatrixVector(currentMatrix, currentVector);
    drawTruthCanvas(currentVector, Av, false);
}

// 绘制左界画布（锻造密钥）
function drawForgeCanvas() {
    const canvas = document.getElementById('forgeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制古典背景
    ctx.fillStyle = '#f8f4e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawClassicGrid(ctx, canvas, '#e0d0b8', 40);
    
    // 绘制坐标轴
    ctx.strokeStyle = '#8b7d6b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // 绘制向量
    const scale = 150; // 缩放因子
    const vectorX = currentVector[0] * scale;
    const vectorY = currentVector[1] * scale;
    
    // 向量线
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + vectorX, centerY - vectorY);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // 向量箭头
    ctx.beginPath();
    ctx.arc(centerX + vectorX, centerY - vectorY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#2980b9';
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 标签
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px "Cormorant Garamond", serif';
    ctx.fillText(`v(${currentVector[0].toFixed(1)}, ${currentVector[1].toFixed(1)})`, 
                 centerX + vectorX + 15, centerY - vectorY - 15);
}

// 绘制右界画布（真理映射）
function drawTruthCanvas(v, Av, isEigenvector