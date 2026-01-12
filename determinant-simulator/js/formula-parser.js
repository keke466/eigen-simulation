// 公式解析和验证器
class FormulaParser {
    constructor() {
        // 预设的测试用例
        this.testCases = [
            { u: { x: 1, y: 0 }, v: { x: 0, y: 1 }, expected: 1 },
            { u: { x: 2, y: 0 }, v: { x: 0, y: 3 }, expected: 6 },
            { u: { x: 1, y: 2 }, v: { x: 3, y: 1 }, expected: -5 },
            { u: { x: 3, y: 1 }, v: { x: 1, y: 2 }, expected: 5 },
            { u: { x: 2, y: 4 }, v: { x: 4, y: 8 }, expected: 0 }
        ];
        
        // 符号映射
        this.symbols = {
            'a': 'u.x',
            'c': 'u.y',
            'b': 'v.x',
            'd': 'v.y'
        };
    }

    // 清理和规范化公式字符串
    normalizeFormula(formula) {
        // 移除所有空格
        let normalized = formula.replace(/\s+/g, '');
        
        // 将ab, cd等隐式乘法转为显式乘法
        normalized = normalized.replace(/([a-d])([a-d])/g, '$1*$2');
        
        // 确保乘法符号明确
        normalized = normalized.replace(/(\d)([a-d])/g, '$1*$2');
        normalized = normalized.replace(/([a-d])(\d)/g, '$1*$2');
        
        return normalized;
    }

    // 将公式字符串转换为JavaScript函数
    compileFormula(formula) {
        try {
            const normalized = this.normalizeFormula(formula);
            
            // 替换符号
            let jsCode = normalized;
            for (const [symbol, replacement] of Object.entries(this.symbols)) {
                const regex = new RegExp(`\\b${symbol}\\b`, 'g');
                jsCode = jsCode.replace(regex, replacement);
            }
            
            // 创建函数
            return new Function('u', 'v', `return ${jsCode};`);
        } catch (error) {
            console.error('公式编译错误:', error);
            return null;
        }
    }

    // 验证公式与所有测试用例是否匹配
    validateFormula(formula) {
        const func = this.compileFormula(formula);
        if (!func) {
            return {
                valid: false,
                message: '❌ 公式格式错误，请检查语法',
                matches: 0,
                total: this.testCases.length
            };
        }
        
        let matches = 0;
        const errors = [];
        
        for (let i = 0; i < this.testCases.length; i++) {
            const testCase = this.testCases[i];
            try {
                const result = func(testCase.u, testCase.v);
                const expected = testCase.expected;
                
                // 允许一定的浮点数误差
                if (Math.abs(result - expected) < 0.001) {
                    matches++;
                } else {
                    errors.push(`第${i+1}组: 计算得 ${result.toFixed(2)}，应为 ${expected}`);
                }
            } catch (error) {
                errors.push(`第${i+1}组: 计算错误 - ${error.message}`);
            }
        }
        
        const isValid = matches === this.testCases.length;
        
        return {
            valid: isValid,
            message: isValid ? 
                `✅ 完美匹配！公式与所有${this.testCases.length}组数据一致` :
                `❌ 匹配${matches}/${this.testCases.length}组数据`,
            details: errors,
            matches,
            total: this.testCases.length,
            formula: formula
        };
    }

    // 验证公式与当前向量状态
    validateCurrent(formula, u, v) {
        const func = this.compileFormula(formula);
        if (!func) {
            return {
                valid: false,
                result: null,
                message: '公式格式错误'
            };
        }
        
        try {
            const result = func(u, v);
            return {
                valid: true,
                result,
                message: `当前计算值: ${result.toFixed(2)}`
            };
        } catch (error) {
            return {
                valid: false,
                result: null,
                message: `计算错误: ${error.message}`
            };
        }
    }

    // 获取推荐公式（当用户接近正确答案时提示）
    getHint(formula) {
        const normalized = this.normalizeFormula(formula);
        
        // 检查是否包含必要元素
        const containsA = normalized.includes('a');
        const containsB = normalized.includes('b');
        const containsC = normalized.includes('c');
        const containsD = normalized.includes('d');
        
        if (!containsA || !containsB || !containsC || !containsD) {
            return "提示：试试包含所有四个变量 a, b, c, d 的表达式";
        }
        
        // 检查是否包含减号
        if (!normalized.includes('-')) {
            return "提示：试试包含减法运算的表达式";
        }
        
        // 检查是否接近正确答案
        if (normalized.includes('a*d') && normalized.includes('b*c')) {
            return "很接近了！检查一下减法的顺序";
        }
        
        return "继续尝试！注意观察对角线元素的关系";
    }
}

// 🔧 关键修改：导出类（之前缺少这个导出）
export { FormulaParser };