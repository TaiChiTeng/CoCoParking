import { _decorator, Component, Node, AudioSource, Animation, Label, instantiate, Prefab } from 'cc';
import { MapData } from './MapData';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    public UIMainMenu: Node = null;

    @property(Node)
    public UILevel: Node = null;

    @property(Node)
    public UILevelClear: Node = null;

    @property(Node)
    public UISetting: Node = null;

    @property(Node)
    public UIConfirm: Node = null;

    @property(AudioSource)
    public audioSource: AudioSource = null;

    @property(Animation)
    public animMainMenu: Animation = null;

    @property(Animation)
    public animLevel: Animation = null;

    @property(Animation)
    public animLevelClear: Animation = null;

    @property(Animation)
    public animSetting: Animation = null;

    @property(Animation)
    public animConfirm: Animation = null;

    @property(Node)
    public nodeBlock: Node = null; // 阻挡物父节点

    @property(Node)
    public nodeCar: Node = null; // 汽车父节点

    @property(Prefab)
    public itemCarU1: Prefab = null; // 汽车预制1

    @property(Prefab)
    public itemCarU2: Prefab = null; // 汽车预制2

    @property(Prefab)
    public itemCarU3: Prefab = null; // 汽车预制3

    private isSoundOn: boolean = true;
    private currentLevel: number = 1; // 当前关卡
    private labLv: Label = null; // 关卡文本标签

    start() {
        // 初始化时只显示主菜单
        this.showMainMenuOnly();

        // 初始化关卡文本标签引用
        this.initLevelLabel();
    }

    // 初始化关卡文本标签引用
    private initLevelLabel(): void {
        if (this.UILevel) {
            const animNode = this.UILevel.getChildByName('AnimNode');
            if (animNode) {
                const nodeLv = animNode.getChildByName('nodeLv');
                if (nodeLv) {
                    const findlabLv = nodeLv.getChildByName('labLv');
                    if(findlabLv){
                        this.labLv = findlabLv.getComponent(Label);
                        if (!this.labLv) {
                            console.error('Cannot find Label component on nodeLv');
                        }
                    }else {
                        console.error('Cannot find labLv under nodeLv');
                    }
                } else {
                    console.error('Cannot find nodeLv under AnimNode');
                }
            } else {
                console.error('Cannot find AnimNode under UILevel');
            }
        }
    }

    // 更新关卡文本
    private updateLevelLabel(level: number): void {
        if (this.labLv) {
            // 检查关卡是否超出范围
            if (level > MapData.getTotalLevels()) {
                this.labLv.string = "无限关卡";
            } else {
                this.labLv.string = `关卡 ${level}`;
            }
        } else {
            console.warn('labLv is not initialized, trying to find it again');
            // 如果标签未初始化，尝试重新查找
            this.initLevelLabel();
            // 再次尝试更新
            if (this.labLv) {
                // 检查关卡是否超出范围
                if (level > MapData.getTotalLevels()) {
                    this.labLv.string = "无限关卡";
                } else {
                    this.labLv.string = `关卡 ${level}`;
                }
            }
        }
    }

    // 显示主菜单，隐藏其他界面
    private showMainMenuOnly(): void {
        this.UIMainMenu.active = true;
        this.UILevel.active = false;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
        // 播放主菜单动画
        if (this.animMainMenu) {
            this.animMainMenu.play('AnimShowMainMenu');
        }
    }

    // 设置当前关卡
    public setCurrentLevel(level: number): void {
        if (level >= 1 && level <= MapData.getTotalLevels()) {
            this.currentLevel = level;
            console.log(`Current level set to: ${level}`);

            // 更新关卡文本
            this.updateLevelLabel(level);

            // 当关卡改变时，重新创建地图
            this.createMap();
        } else {
            console.error(`Invalid level: ${level}. Level must be between 1 and ${MapData.getTotalLevels()}`);
        }
    }

    // 显示关卡界面，隐藏其他界面
    private showLevelOnly(): void {
        this.UIMainMenu.active = false;
        this.UILevel.active = true;
        this.UILevelClear.active = false;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
        // 播放关卡界面动画
        if (this.animLevel) {
            this.animLevel.play('AnimShowLevel');
        }
    }

    // 显示通关界面，隐藏其他界面
    private showLevelClearOnly(): void {
        this.UIMainMenu.active = false;
        this.UILevel.active = false;
        this.UILevelClear.active = true;
        this.UISetting.active = false;
        this.UIConfirm.active = false;
        // 播放通关界面动画
        if (this.animLevelClear) {
            this.animLevelClear.play('AnimShowLevelClear');
        }
    }

    // 主菜单按钮回调函数
    public onMainMenuToLevelClick(): void {
        // 默认进入第一关
        this.setCurrentLevel(1);
        this.showLevelOnly();
    }

    // 主菜单打开设置界面，不关闭主菜单
    public onMainMenuToSettingClick(): void {
        this.UISetting.active = true;
        // 播放设置界面动画
        if (this.animSetting) {
            this.animSetting.play('AnimShowSetting');
        }
    }

    // 关卡界面按钮回调函数
    public onLevelToLevelClearClick(): void {
        this.showLevelClearOnly();
    }

    // 关卡界面打开设置界面，不关闭关卡界面
    public onLevelToSettingClick(): void {
        this.UISetting.active = true;
        // 播放设置界面动画
        if (this.animSetting) {
            this.animSetting.play('AnimShowSetting');
        }
    }

    // 通关界面按钮回调函数
    public onLevelClearToLevelClick(): void {
        // 进入下一关
        const nextLevel = this.currentLevel + 1;
        if (nextLevel <= MapData.getTotalLevels()) {
            this.setCurrentLevel(nextLevel);
        } else {
            // 没有下一关时，设置为超出范围的关卡以显示"无限关卡"
            this.currentLevel = nextLevel;
            this.updateLevelLabel(nextLevel);
        }
        this.showLevelOnly();
    }

    // 设置界面按钮回调函数
    public onSettingToConfirmClick(): void {
        // 检查关卡界面是否显示
        if (this.UILevel.active) {
            // 如果关卡界面正在显示，则打开二次确认界面
            this.UIConfirm.active = true;
            // 播放确认界面动画
            if (this.animConfirm) {
                this.animConfirm.play('AnimShowConfirm');
            }
        } else {
            // 如果关卡界面没有显示，则主界面是打开着的，直接关闭设置界面
            this.UISetting.active = false;
    }
}

    public onSettingSoundToggle(): void {
        this.isSoundOn = !this.isSoundOn;
        if (this.audioSource) {
            this.audioSource.volume = this.isSoundOn ? 1 : 0;
        }
    }

    public onSettingClose(): void {
        this.UISetting.active = false;
    }

    // 二次确认界面按钮回调函数
    public onConfirmToMainMenuClick(): void {
        this.UIConfirm.active = false;
        this.UISetting.active = false;
        this.showMainMenuOnly();
    }

    public onConfirmCancelClick(): void {
        this.UIConfirm.active = false;
    }

    // 根据关卡数获取地图数据
    private getMapDataByLevel(level: number): {MapW: number, MapH: number, Map: number[][]} {
        return MapData.getMapDataByLevel(level);
    }

    // 创建地图
    private createMap() {

        const mapData = this.getMapDataByLevel(this.currentLevel);
        // 初始化汽车
        this.initCars();

        const {MapW, MapH, Map} = mapData;

        console.log(`Creating map for level ${this.currentLevel}:`);
        console.log(`MapW: ${MapW}, MapH: ${MapH}`);
        console.log('Map data:');
        for (let i = 0; i < MapH; i++) {
            console.log(Map[i].join(','));
        }

        // 根据地图数据设置阻挡物可见性
        if (this.nodeBlock) {
            // 先隐藏所有阻挡物
            for (let i = 0; i < this.nodeBlock.children.length; i++) {
                this.nodeBlock.children[i].active = false;
            }

            // 根据地图数据显示对应的阻挡物
            // 假设子节点的顺序与地图单元格的顺序一致 (按行优先)
            let childIndex = 0;
            for (let y = 0; y < MapH; y++) {
                for (let x = 0; x < MapW; x++) {
                    if (childIndex < this.nodeBlock.children.length) {
                        // 根据地图数据设置节点可见性
                        this.nodeBlock.children[childIndex].active = (Map[y][x] === -1);
                    } else {
                        console.warn(`No enough block nodes. Missing node for cell (${y}, ${x})`);
                    }
                    childIndex++;
                }
            }

            // 如果有多余的节点，隐藏它们
            while (childIndex < this.nodeBlock.children.length) {
                this.nodeBlock.children[childIndex].active = false;
                childIndex++;
            }
        } else {
            console.error('nodeBlock is not assigned in GameManager. Please assign the nodeBlock property in the inspector.');
        }
    }

    // 初始化汽车
    private initCars() {
        if (!this.nodeCar) {
            console.error('nodeCar is not assigned in GameManager. Please assign the nodeCar property in the inspector.');
            return;
        }

        // 先清除所有现有汽车，但保留nodeU0-nodeU4节点
        const nodeNames = ['nodeU0', 'nodeU1', 'nodeU2', 'nodeU3', 'nodeU4'];
        for (const nodeName of nodeNames) {
            const node = this.nodeCar.getChildByName(nodeName);
            if (node) {
                node.removeAllChildren();
            } else {
                console.warn(`Cannot find node ${nodeName} under nodeCar`);
            }
        }

        // 获取当前关卡的汽车数据
        const carData = this.getCarDataByLevel(this.currentLevel);
        if (!carData || carData.length === 0) {
            console.log(`No car data for level ${this.currentLevel}`);
            return;
        }

        // 用于跟踪每个nodeUx节点下的汽车排序
        const nodeUSortIndex: {[key: string]: number} = {
            'nodeU0': 0,
            'nodeU1': 0,
            'nodeU2': 0,
            'nodeU3': 0,
            'nodeU4': 0
        };

        // 创建汽车
        for (const car of carData) {
            const {outerMap, sort, type} = car;
            const nodeName = `node${outerMap}`; // 例如: nodeU0
            const parentNode = this.nodeCar.getChildByName(nodeName);

            if (!parentNode) {
                console.error(`Cannot find parent node: ${nodeName} under nodeCar`);
                continue;
            }

            // 获取对应的汽车预制
            let carPrefab: Prefab = null;
            switch (type) {
                case 1:
                    carPrefab = this.itemCarU1;
                    break;
                case 2:
                    carPrefab = this.itemCarU2;
                    break;
                case 3:
                    carPrefab = this.itemCarU3;
                    break;
                default:
                    console.error(`Invalid car type: ${type}`);
                    continue;
            }

            if (!carPrefab) {
                console.error(`Car prefab for type ${type} is not assigned`);
                continue;
            }

            // 创建汽车实例
            const carNode = instantiate(carPrefab);
            if (carNode) {
                // 设置父节点
                parentNode.addChild(carNode);
                // 记录该节点下的排序
                nodeUSortIndex[nodeName]++;
                console.log(`Created car type ${type} at ${nodeName}, sort: ${sort}`);

                // 为汽车添加点击事件
                carNode.on(Node.EventType.TOUCH_END, () => {
                    console.log(`汽车被点击! 父节点: ${parentNode.name}`);
                }, this);

                // 为汽车添加鼠标点击事件（用于桌面平台）
                carNode.on(Node.EventType.MOUSE_UP, () => {
                    console.log(`汽车被点击! 父节点: ${parentNode.name}`);
                }, this);
            } else {
                console.error(`Failed to instantiate car prefab for type ${type}`);
            }
        }
    }

    // 根据关卡获取汽车数据
    private getCarDataByLevel(level: number): {outerMap: string, sort: number, type: number}[] {
        return MapData.getCarDataByLevel(level);
    }

    update(deltaTime: number) {
        // 可以在这里添加需要每帧更新的逻辑
    }
}