import { _decorator, Component, Node, instantiate, Prefab, Vec3, Button, director, AudioSource } from 'cc';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

enum CarDirection {
    Down,
    Left,
    Right
}

@ccclass('LevelScene')
export class LevelScene extends Component {
    @property([Prefab])
    carPrefabs: Prefab[] = []; // 汽车预制体数组

    @property(Node)
    mapNode: Node = null; // 地图节点

    @property(Button)
    settingsButton: Button = null; //设置按钮

    @property(AudioSource)
    audioSource: AudioSource = null;

    private currentLevel: number = 1;
    private mapData: number[][];
    private carData: { direction: CarDirection, order: number, type: string }[];
    private cars: Node[] = [];
    private mapW: number;
    private mapH: number;

    start() {
        this.currentLevel = SaveManager.getLevel();
        this.loadLevelData(this.currentLevel);
        this.createMap();
        this.createCars();
        this.settingsButton.node.on('click', this.onSettingsButtonClicked, this);
        this.updateAudioState();
    }

    loadLevelData(level: number) {
        switch (level) {
            case 1:
                this.mapW = 5;
                this.mapH = 6;
                this.mapData = [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ];
                this.carData = [
                    { direction: CarDirection.Down, order: 0, type: "1x3" },
                    { direction: CarDirection.Down, order: 1, type: "1x2" },
                    { direction: CarDirection.Down, order: 2, type: "1x1" }
                ];
                break;
            case 2:
                this.mapW = 5;
                this.mapH = 6;
                this.mapData = [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ];
                this.carData = [
                    { direction: CarDirection.Down, order: 0, type: "1x3" },
                    { direction: CarDirection.Down, order: 1, type: "1x2" },
                    { direction: CarDirection.Down, order: 1, type: "1x1" },
                    { direction: CarDirection.Left, order: 0, type: "1x2" },
                    { direction: CarDirection.Left, order: 0, type: "1x1" },
                    { direction: CarDirection.Left, order: 1, type: "1x3" },
                    { direction: CarDirection.Left, order: 2, type: "1x3" }
                ];
                break;
            case 3:
                 this.mapW = 5;
                this.mapH = 6;
                this.mapData = [
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ];
                this.carData = [
                    { direction: CarDirection.Down, order: 1, type: "1x3" },
                    { direction: CarDirection.Down, order: 2, type: "1x3" },
                    { direction: CarDirection.Down, order: 2, type: "1x3" },
                    { direction: CarDirection.Down, order: 3, type: "1x3" },
                    { direction: CarDirection.Left, order: 0, type: "1x2" },
                    { direction: CarDirection.Left, order: 4, type: "1x2" },
                    { direction: CarDirection.Right, order: 0, type: "1x2" },
                    { direction: CarDirection.Right, order: 4, type: "1x2" }
                ];
                break;
            case 4:
                this.mapW = 5;
                this.mapH = 6;
                this.mapData = [
                    [0, 0, 0, 0, 0],
                    [-1, 0, 0, 0, -1],
                    [0, 0, 0, 0, 0],
                    [0, -1, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0]
                ];
                this.carData = [
                    { direction: CarDirection.Down, order: 0, type: "1x3" },
                    { direction: CarDirection.Down, order: 4, type: "1x3" },
                    { direction: CarDirection.Left, order: 4, type: "1x2" },
                    { direction: CarDirection.Left, order: 4, type: "1x1" },
                    { direction: CarDirection.Right, order: 3, type: "1x1" },
                    { direction: CarDirection.Right, order: 3, type: "1x1" }
                ];
                break;
            case 5:
                this.mapW = 5;
                this.mapH = 6;
                this.mapData = [
                    [-1, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0],
                    [0, 0, 0, 0, -1]
                ];
                this.carData = [
                    { direction: CarDirection.Down, order: 0, type: "1x3" },
                    { direction: CarDirection.Left, order: 2, type: "1x3" },
                    { direction: CarDirection.Left, order: 5, type: "1x3" },
                    { direction: CarDirection.Right, order: 1, type: "1x3" },
                    { direction: CarDirection.Right, order: 3, type: "1x3" },
                    { direction: CarDirection.Right, order: 4, type: "1x3" }
                ];
                break;
        }
    }

    createMap() {
        // 根据 mapData 创建地图，例如使用 TiledMap
        // 这里只是一个示例，你需要根据你的实际地图实现来调整
        console.log("Creating map...");
    }

    createCars() {
        this.carData.forEach((data, index) => {
            let carPrefabIndex = this.getCarPrefabIndex(data.direction, data.type);
            if (carPrefabIndex !== -1) {
                let carNode = instantiate(this.carPrefabs[carPrefabIndex]);
                carNode.name = `Car_${index}`;
                this.mapNode.addChild(carNode);
                this.setCarPosition(carNode, data.direction, data.order);
                this.cars.push(carNode);

                // 添加点击事件
                carNode.on(Node.EventType.TOUCH_END, () => {
                    this.moveCar(carNode, data.direction);
                }, this);
            } else {
                console.warn("Car prefab not found for direction:", data.direction, "and type:", data.type);
            }
        });
    }

    getCarPrefabIndex(direction: CarDirection, type: string): number {
        switch (direction) {
            case CarDirection.Down:
                if (type === "1x1") return 0; // texCarU1
                if (type === "1x2") return 1; // texCarU2
                if (type === "1x3") return 2; // texCarU3
                break;
            case CarDirection.Left:
                if (type === "1x1") return 3; // texCarR1
                if (type === "1x2") return 4; // texCarR2
                if (type === "1x3") return 5; // texCarR3
                break;
            case CarDirection.Right:
                if (type === "1x1") return 6; // texCarL1
                if (type === "1x2") return 7; // texCarL2
                if (type === "1x3") return 8; // texCarL3
                break;
        }
        return -1; // 未找到
    }

    setCarPosition(carNode: Node, direction: CarDirection, order: number) {
        // 根据 direction 和 order 设置汽车的初始位置
        // 这里只是一个示例，你需要根据你的实际地图和汽车尺寸来调整
        let x = 0;
        let y = 0;

        switch (direction) {
            case CarDirection.Down:
                x = order;
                y = -1;
                break;
            case CarDirection.Left:
                x = -1;
                y = order;
                break;
            case CarDirection.Right:
                x = this.mapW;
                y = order;
                break;
        }

        carNode.setPosition(new Vec3(x, y, 0));
    }

    moveCar(carNode: Node, direction: CarDirection) {
        // 实现汽车移动的逻辑
        // 包括前进和后退，碰撞检测，以及缓动效果
        console.log("Moving car:", carNode.name, "in direction:", direction);
    }

    checkWinCondition() {
        // 检查是否所有汽车都已停入停车位
        // 如果是，则加载下一关或显示通关界面
        console.log("Checking win condition...");
    }

    onSettingsButtonClicked() {
        director.loadScene("SettingsScene"); // 假设你的设置场景名为 "SettingsScene"
    }

    updateAudioState() {
        this.audioSource.enabled = SaveManager.getSoundState();
    }
}