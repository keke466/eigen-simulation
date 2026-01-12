// Evaluator.js - 智能评价系统
export class ExperimentEvaluator {
    constructor() {
        this.challenges = {
            doubleArea: { completed: false, score: 10, attempts: 0 },
            zeroArea: { completed: false, score: 10, attempts: 0 },
            negativeArea: { completed: false, score: 10, attempts: 0 },
            specificArea: { completed: false, score: 10, attempts: 0 }
        };
        
        this.formulaAttempts = 0;
        this.maxFormulaAttempts = 4;
        this.formulaCorrect = 0;
        this.recordsCount = 0;
        this.explorationScore = 0;
        this.explorationStates = new Set();
        
        this.gradeThresholds = {
            excellent: 90,
            good: 75,
            average: 60,
            poor: 40
        };
        
        this.gradeMessages = {
            excellent: {
                title: "🏆 优秀",
                message: "非常出色！您完全掌握了行列式的概念和计算方法。",
                details: [
                    "✓ 完美完成所有挑战任务",
                    "✓ 公式验证准确无误",
                    "✓ 实验记录完整详细",
                    "✓ 探索深入且有创意"
                ]
            },
            good: {
                title: "🎯 良好",
                message: "做得很好！您对行列式有较好的理解。",
                details: [
                    "✓ 完成大部分挑战任务",
                    "✓ 公式验证基本正确",
                    "✓ 实验记录较为完整",
                    "✓ 有一定程度的探索"
                ]
            },
            average: {
                title: "📊 中等",
                message: "基本掌握了行列式的概念，但还有提升空间。",
                details: [
                    "✓ 完成部分挑战任务",
                    "✓ 公式验证有改进空间",
                    "✓ 实验记录需要补充",
                    "✓ 建议更多探索尝试"
                ]
            },
            poor: {
                title: "💪 需要努力",
                message: "需要继续努力，建议重新学习行列式基础知识。",
                details: [
                    "✗ 挑战任务完成较少",
                    "✗ 公式验证需要加强",
                    "✗ 实验记录不足",
                    "✗ 探索深度有待提高"
                ]
            }
        };
    }
    
    // ========== 挑战系统 ==========
    completeChallenge(challengeName) {
        if (this.challenges[challengeName] && !this.challenges[challengeName].completed) {
            this.challenges[challengeName].completed = true;
            this.challenges[challengeName].attempts++;
            return true;
        }
        return false;
    }
    
    getChallengeScore() {
        let score = 0;
        let completed = 0;
        
        Object.values(this.challenges).forEach(challenge => {
            if (challenge.completed) {
                score += challenge.score;
                completed++;
            }
        });
        
        return { score, completed, total: 4 };
    }
    
    // ========== 公式验证 ==========
    recordFormulaAttempt(isCorrect) {
        this.formulaAttempts++;
        if (isCorrect) {
            this.formulaCorrect++;
        }
        
        // 计算公式得分（正确率 × 30分）
        const accuracy = this.formulaCorrect / Math.max(this.formulaAttempts, 1);
        return Math.round(accuracy * 30);
    }
    
    getFormulaScore() {
        const accuracy = this.formulaAttempts > 0 ? 
            this.formulaCorrect / this.formulaAttempts : 0;
        return {
            score: Math.round(accuracy * 30),
            attempts: this.formulaAttempts,
            correct: this.formulaCorrect,
            maxAttempts: this.maxFormulaAttempts
        };
    }
    
    // ========== 实验记录 ==========
    addRecord(state) {
        this.recordsCount++;
        
        // 记录探索状态（唯一的状态）
        const stateKey = `${state.u.x},${state.u.y},${state.v.x},${state.v.y}`;
        this.explorationStates.add(stateKey);
        
        // 计算探索分数（基于不同状态的数量）
        this.explorationScore = Math.min(this.explorationStates.size * 2, 10);
        
        // 计算记录分数（最多20分，每2个记录得1分，最多40个记录）
        const recordsScore = Math.min(Math.floor(this.recordsCount / 2), 20);
        
        return recordsScore;
    }
    
    getRecordsScore() {
        return {
            score: Math.min(Math.floor(this.recordsCount / 2), 20),
            count: this.recordsCount,
            explorationScore: this.explorationScore,
            uniqueStates: this.explorationStates.size
        };
    }
    
    // ========== 综合评价 ==========
    calculateTotalScore() {
        const challengeScore = this.getChallengeScore().score;
        const formulaScore = this.getFormulaScore().score;
        const recordsScore = this.getRecordsScore().score;
        const explorationScore = this.getRecordsScore().explorationScore;
        
        const totalScore = challengeScore + formulaScore + recordsScore + explorationScore;
        
        return {
            total: totalScore,
            breakdown: {
                challenge: challengeScore,
                formula: formulaScore,
                records: recordsScore,
                exploration: explorationScore
            }
        };
    }
    
    getGrade() {
        const score = this.calculateTotalScore().total;
        const breakdown = this.calculateTotalScore().breakdown;
        
        let grade;
        let message;
        
        if (score >= this.gradeThresholds.excellent) {
            grade = "优秀";
            message = this.gradeMessages.excellent;
        } else if (score >= this.gradeThresholds.good) {
            grade = "良好";
            message = this.gradeMessages.good;
        } else if (score >= this.gradeThresholds.average) {
            grade = "中等";
            message = this.gradeMessages.average;
        } else {
            grade = "需要努力";
            message = this.gradeMessages.poor;
        }
        
        // 个性化建议
        const suggestions = this._generateSuggestions(breakdown);
        
        return {
            grade,
            score,
            breakdown,
            message: {
                ...message,
                suggestions
            }
        };
    }
    
    _generateSuggestions(breakdown) {
        const suggestions = [];
        
        if (breakdown.challenge < 20) {
            suggestions.push("建议尝试完成更多挑战任务，特别是双倍面积和负面积挑战。");
        }
        
        if (breakdown.formula < 15) {
            suggestions.push("公式验证准确率有待提高，建议仔细学习行列式计算规则。");
        }
        
        if (breakdown.records < 10) {
            suggestions.push("实验记录较少，建议多尝试不同向量组合并记录结果。");
        }
        
        if (breakdown.exploration < 5) {
            suggestions.push("探索深度不足，建议尝试更广泛的向量位置组合。");
        }
        
        if (suggestions.length === 0) {
            suggestions.push("表现优秀，继续保持！可以尝试更复杂的向量组合。");
        }
        
        return suggestions;
    }
    
    // ========== 重置系统 ==========
    reset() {
        Object.keys(this.challenges).forEach(key => {
            this.challenges[key].completed = false;
            this.challenges[key].attempts = 0;
        });
        
        this.formulaAttempts = 0;
        this.formulaCorrect = 0;
        this.recordsCount = 0;
        this.explorationScore = 0;
        this.explorationStates.clear();
    }
    
    // ========== 数据导出 ==========
    exportData() {
        return {
            timestamp: new Date().toISOString(),
            challenges: this.challenges,
            formulaStats: this.getFormulaScore(),
            recordsStats: this.getRecordsScore(),
            totalScore: this.calculateTotalScore(),
            grade: this.getGrade()
        };
    }
    
    // ========== 进度计算 ==========
    calculateProgress() {
        const challengeScore = this.getChallengeScore();
        const totalPossible = 40 + 30 + 20 + 10; // 各部分满分
        
        const currentScore = this.calculateTotalScore().total;
        const progress = (currentScore / totalPossible) * 100;
        
        return {
            progress: Math.min(100, Math.round(progress)),
            challengeProgress: (challengeScore.completed / challengeScore.total) * 100,
            formulaProgress: (this.formulaCorrect / Math.max(this.formulaAttempts, 1)) * 100,
            remainingAttempts: this.maxFormulaAttempts - this.formulaAttempts
        };
    }
}