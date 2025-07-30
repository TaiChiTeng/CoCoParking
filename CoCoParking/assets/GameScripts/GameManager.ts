import { _decorator, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

interface LevelConfig {
    mapW: number;
    mapH: number;
    map: number[][];
    cars: Array<{
        position: 'down' | 'left' | 'right';
        index: number;
        sort: number;
        width: number;
        height: number;
    }>;
}

@ccclass('GameManager')
export class GameManager extends Component {
    private currentLevel: number = 1;
    private levels: LevelConfig[] = [];
    private isGameStarted: boolean = false;

    start() {
        this.initLevels();
        this.loadSaveData();
        this.startGame();
    }

    private initLevels(): void {
        // 初始化所有关卡数据
        this.levels = [
            // 第1关数据
            {
                mapW: 5,
                mapH: 6,
                map: Array.from({ length: 6 }, () => Array(5).fill(0)),
                cars: [
                    { position: 'down', index: 0, sort: 0, width: 1, height: 3 },
                    { position: 'down', index: 1, sort: 0, width: 1, height: 2 },
                    { position: 'down', index: 2, sort: 0, width: 1, height: 1 }
                ]
            },
            // 第2关数据
            {
                mapW: 5,
                mapH: 6,
                map: Array.from({ length: 6 }, () => Array(5).fill(0)),
                cars: [
                    { position: 'down', index: 0, sort: 0, width: 1, height: 3 },
                    { position: 'down', index: 1, sort: 0, width: 1, height: 2 },
                    { position: 'down', index: 1, sort: 1, width: 1, height: 1 },
                    { position: 'left', index: 0, sort: 0, width: 1, height: 2 },
                    { position: 'left', index: 0, sort: 1, width: 1, height: 1 },
                    { position: 'left', index: 1, sort: 0, width: 1, height: 3 },
                    { position: 'left', index: 2, sort: 0, width: 1, height: 3 }
                ]
            }
            // 后续关卡数据将在实现时添加
        ];
    }

    private loadSaveData(): void {
        const savedLevel = sys.localStorage.getItem('currentLevel');
        if (savedLevel) {
            this.currentLevel = parseInt(savedLevel, 10);
            // 确保关卡数不超过最大关卡
            this.currentLevel = Math.min(this.currentLevel, this.levels.length);
        } else {
            this.currentLevel = 1;
            this.saveGameData();
        }
    }

    private saveGameData(): void {
        sys.localStorage.setItem('currentLevel', this.currentLevel.toString());
    }

    private startGame(): void {
        this.isGameStarted = true;
        this.loadLevel(this.currentLevel);
    }

    private loadLevel(level: number): void {
        const levelIndex = level - 1;
        if (this.levels[levelIndex]) {
            const levelConfig = this.levels[levelIndex];
            console.log(`加载关卡 ${level}`, levelConfig);
            // 后续将实现地图和汽车的实际加载逻辑
        } else {
            console.error(`关卡 ${level} 配置不存在`);
        }
    }

    update(deltaTime: number) {
        if (!this.isGameStarted) return;
        // 游戏主循环逻辑
    }
}


